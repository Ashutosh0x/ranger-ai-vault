# Signal Engine -- Technical Documentation

> Complete documentation of the ML signal pipeline, from raw data ingestion through feature engineering to signal output.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Layer](#data-layer)
- [Feature Engineering](#feature-engineering)
- [ML Models](#ml-models)
- [Risk Calculators](#risk-calculators)
- [Signal Server](#signal-server)
- [Training Pipeline](#training-pipeline)
- [Configuration](#configuration)
- [API Reference](#api-reference)

---

## Overview

The signal engine is a Python-based ML pipeline that runs as a FastAPI server on port 8080. It provides authenticated endpoints for the keeper bot to fetch trading signals, risk state, and system health.

**Core loop:** Every time the keeper requests a signal, the engine:
1. Fetches latest data from 4 external sources
2. Computes 17 features per asset
3. Runs two XGBoost models (momentum + mean-reversion)
4. Combines via weighted ensemble with regime adjustment
5. Returns signal in [-1.0, +1.0] with confidence score

---

## Architecture

```
+-------------------+     +-------------------+
| Coinglass API     |     | Drift Data API    |
| - liqHeatmap      |     | - fundingRates    |
| - liqMap          |     | - candles         |
+--------+----------+     +--------+----------+
         |                          |
         v                          v
+--------+----------+     +--------+----------+
| coinglass_fetcher  |     | drift_fetcher     |
| Rate limit: 30/min |     | No rate limit     |
+--------+----------+     +--------+----------+
         |                          |
         +----------+   +-----------+
                    v   v
            +-------+---+--------+
            |    data_store.py   |
            |  Parquet file cache|
            +--------+-----------+
                     |
         +-----------+-----------+
         v                       v
+--------+---------+   +---------+--------+
| liquidation_     |   | indicators.py    |
|  features.py     |   | BB, RSI, VWAP    |
| 7 liq features   |   | ATR, MACD        |
+--------+---------+   +---------+--------+
         |                       |
         +----------+  +---------+
                    v  v
            +-------+--+--------+
            | feature_engineer  |
            | 17-feature vector |
            +--------+----------+
                     |
         +-----------+-----------+
         v                       v
+--------+---------+   +---------+--------+
| momentum_model   |   | meanrev_model    |
| XGBRegressor     |   | XGBRegressor     |
| Weight: 40%      |   | Weight: 60%      |
+--------+---------+   +---------+--------+
         |                       |
         +----------+  +---------+
                    v  v
            +-------+--+--------+
            |   ensemble.py     |
            | 0.4*mom + 0.6*rev |
            | + regime adjust   |
            +--------+----------+
                     |
                     v
            +--------+----------+
            | signal_server.py  |
            | FastAPI :8080     |
            | Auth: X-Keeper-   |
            |       Secret      |
            +-------------------+
```

---

## Data Layer

### Coinglass Fetcher (`src/data/coinglass_fetcher.py`)

Fetches liquidation heatmap data from the Coinglass API.

| Field | Value |
|-------|-------|
| Endpoint | `GET /api/pro/v1/futures/liquidation_heatmap` |
| Rate Limit | 30 requests/min (self-enforced: 1 req/2s) |
| Auth | `coinglassSecret` header |
| Retry | 3 attempts with exponential backoff |
| Degradation | Returns neutral values if API fails |

**Asset mapping:**

| Internal Name | Coinglass Symbol |
|--------------|-----------------|
| SOL-PERP | SOL |
| BTC-PERP | BTC |
| ETH-PERP | ETH |

### Drift Fetcher (`src/data/drift_fetcher.py`)

Fetches funding rates, open interest, and OHLCV candles from the Drift Data API.

| Endpoint | Data | Frequency |
|----------|------|-----------|
| `GET /fundingRates` | Hourly funding rates | Every 15 min |
| `GET /candles` | OHLCV price data | Every 15 min |
| `GET /markets` | Market metadata | On startup |

### Pyth Fetcher (`src/data/pyth_fetcher.py`)

Reads oracle prices from Pyth Network via Solana RPC.

| Feed | Price ID |
|------|----------|
| SOL/USD | Pyth SOL feed |
| BTC/USD | Pyth BTC feed |
| ETH/USD | Pyth ETH feed |

### Helius Fetcher (`src/data/helius_fetcher.py`)

Reads enhanced transaction data and account information via Helius RPC.

### Data Store (`src/data/data_store.py`)

Thread-safe in-memory + Parquet file cache for all fetched data.

```python
class DataStore:
    def set(self, key: str, value: Any) -> None
    def get(self, key: str, default: Any = None) -> Any
    def save_parquet(self, key: str, df: pd.DataFrame) -> None
    def load_parquet(self, key: str) -> pd.DataFrame
```

---

## Feature Engineering

### Liquidation Features (`src/features/liquidation_features.py`)

7 features derived from Coinglass heatmap data:

| # | Feature | Description | Range |
|---|---------|-------------|-------|
| 1 | `liq_nearest_long_dist` | % distance to nearest long liquidation cluster | 0-100 |
| 2 | `liq_nearest_short_dist` | % distance to nearest short liquidation cluster | 0-100 |
| 3 | `liq_long_density_5pct` | Total long liq $ within 5% of current price | 0-inf |
| 4 | `liq_short_density_5pct` | Total short liq $ within 5% of current price | 0-inf |
| 5 | `liq_imbalance_ratio` | long_density / (long_density + short_density) | 0-1 |
| 6 | `liq_magnetic_pull` | Weighted direction toward nearest cluster | -1 to +1 |
| 7 | `liq_proximity_score` | Composite proximity indicating cluster nearness | 0-1 |

**Magnetic pull calculation:**

```python
def compute_magnetic_pull(price, clusters):
    """
    Positive = price pulled upward (to short liq clusters)
    Negative = price pulled downward (to long liq clusters)
    
    Large clusters exert more "pull" -- price tends to sweep
    toward them, triggering cascading liquidations.
    """
    weighted_sum = 0
    total_weight = 0
    for cluster in clusters:
        distance = (cluster.price - price) / price
        weight = cluster.usd_value / (abs(distance) + 0.001)
        weighted_sum += distance * weight
        total_weight += weight
    return weighted_sum / total_weight if total_weight > 0 else 0
```

### Technical Indicators (`src/features/indicators.py`)

10 features from standard technical analysis:

| # | Feature | Parameters |
|---|---------|-----------|
| 1 | `funding_rate_1h` | Current hourly funding rate |
| 2 | `funding_rate_8h_ma` | 8-hour moving average |
| 3 | `oi_change_1h` | 1-hour open interest change % |
| 4 | `volume_ratio` | Volume / 24h average volume |
| 5 | `price_momentum_15m` | 15-minute log return |
| 6 | `price_momentum_1h` | 1-hour log return |
| 7 | `bollinger_zscore` | (price - BB_mid) / BB_std, period=20 |
| 8 | `basis_spread` | (perp_price - spot_price) / spot_price |
| 9 | `rsi_14` | 14-period RSI (0-100, normalized to 0-1) |
| 10 | `vwap_deviation` | (price - VWAP) / VWAP |

### Feature Engineer (`src/features/feature_engineer.py`)

Combines liquidation + technical features into a single 17-feature vector per asset per tick.

```python
class FeatureEngineer:
    def compute_features(self, asset: str) -> np.ndarray:
        """Returns a 17-element feature vector."""
        liq_features = self.liq_engine.compute(asset)       # 7 features
        tech_features = self.indicators.compute(asset)      # 10 features
        return np.concatenate([tech_features, liq_features])
```

---

## ML Models

### Momentum Model (`src/models/momentum_model.py`)

Predicts 1-hour forward momentum (trend continuation probability).

| Parameter | Value |
|-----------|-------|
| Algorithm | XGBRegressor |
| n_estimators | 100 |
| max_depth | 4 |
| learning_rate | 0.1 |
| Target | 1-hour forward return |
| Ensemble Weight | 40% |

### Mean-Reversion Model (`src/models/meanrev_model.py`)

Predicts reversion probability toward VWAP.

| Parameter | Value |
|-----------|-------|
| Algorithm | XGBRegressor |
| n_estimators | 100 |
| max_depth | 4 |
| learning_rate | 0.1 |
| Target | Reversion to VWAP (next 1h) |
| Ensemble Weight | 60% |

### Ensemble (`src/models/ensemble.py`)

Combines both models with regime adjustment:

```python
def compute_signal(self, features: np.ndarray) -> dict:
    mom_signal = self.momentum_model.predict(features)
    rev_signal = self.meanrev_model.predict(features)
    
    # Weighted combination
    raw_signal = 0.4 * mom_signal + 0.6 * rev_signal
    
    # Regime adjustment based on volatility
    if self.is_high_volatility(features):
        raw_signal *= 0.7  # Reduce conviction in high-vol
    
    # Clamp to [-1, 1]
    signal = max(-1.0, min(1.0, raw_signal))
    
    # Confidence = agreement between models
    confidence = 1.0 - abs(mom_signal - rev_signal)
    
    return {
        "signal": signal,
        "confidence": confidence,
        "momentum_component": mom_signal,
        "meanrev_component": rev_signal,
    }
```

---

## Risk Calculators

### VaR Calculator (`src/risk/var_calculator.py`)

95th percentile 1-day Value at Risk using historical simulation.

- Threshold: -2% (if VaR exceeds, reduce position sizes)
- Lookback: 30 days of daily returns
- Method: Historical simulation (non-parametric)

### Position Sizer (`src/risk/position_sizer.py`)

Kelly criterion with conservative fraction:

```python
kelly_size = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
position_size = kelly_size * 0.25  # 25% Kelly for safety
```

### Drawdown Monitor (`src/risk/drawdown_monitor.py`)

Tracks peak-to-trough drawdown in real time:
- Daily limit: 3% (breach triggers full unwind)
- Monthly limit: 8% (breach triggers full unwind)

### Delta Monitor (`src/risk/delta_monitor.py`)

Monitors net portfolio delta across all positions:
- Threshold: |0.10| (breach triggers rehedging)
- Computed as sum of all position deltas

---

## Signal Server

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/signal` | Required | Get trading signal for an asset |
| GET | `/risk` | Required | Get current risk state |
| GET | `/health` | None | System health check |

### Authentication

All endpoints except `/health` require the `X-Keeper-Secret` header matching the `KEEPER_SECRET` environment variable.

---

## API Reference

### GET /signal

```
GET /signal?asset=SOL-PERP
Headers: X-Keeper-Secret: <secret>
```

Response:
```json
{
  "asset": "SOL-PERP",
  "signal": 0.72,
  "confidence": 0.68,
  "timestamp": 1711382400.0,
  "components": {
    "momentum": 0.65,
    "mean_reversion": 0.77
  },
  "features": {
    "funding_rate_1h": 0.0012,
    "bollinger_zscore": 1.45,
    "liq_magnetic_pull": 0.23,
    "liq_proximity_score": 0.67
  }
}
```

### GET /risk

```
GET /risk
Headers: X-Keeper-Secret: <secret>
```

Response:
```json
{
  "var_95": 0.018,
  "daily_drawdown": 0.012,
  "monthly_drawdown": 0.034,
  "net_delta": 0.05,
  "risk_level": "normal"
}
```

### GET /health

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1711382400.0,
  "models_loaded": true,
  "uptime_seconds": 3600
}
```

---

## Training Pipeline

### Train Models

```bash
cd signal-engine
python training/train_models.py \
  --assets SOL-PERP BTC-PERP ETH-PERP \
  --lookback 180 \
  --train-split 0.7 \
  --val-split 0.15 \
  --test-split 0.15
```

### Walk-Forward Backtest

```bash
python training/backtest.py \
  --config ../tests/backtests/backtest_config.yaml \
  --output ../tests/backtests/results/
```

Output artifacts:
- `metrics_summary.json` -- All performance metrics
- `equity_curve.png` -- NAV over time
- `drawdown_chart.png` -- Drawdown visualization
- `trade_log.csv` -- Every trade with entry/exit/PnL

---

## Configuration

All tunable parameters are in `src/config.py`:

```python
# Signal thresholds
SIGNAL_THRESHOLDS = {
    "long_entry": 0.6,
    "short_entry": -0.6,
    "confidence_min": 0.4,
}

# Model parameters
MODEL_PARAMS = {
    "momentum_weight": 0.4,
    "meanrev_weight": 0.6,
    "n_estimators": 100,
    "max_depth": 4,
}

# Data fetching
DATA_CONFIG = {
    "coinglass_rate_limit": 2.0,  # seconds between requests
    "lookback_hours": 720,        # 30 days
    "cache_ttl": 300,             # 5 minutes
}

# Risk parameters
RISK_CONFIG = {
    "var_threshold": 0.02,
    "daily_dd_limit": 0.03,
    "monthly_dd_limit": 0.08,
    "max_net_delta": 0.10,
}
```
