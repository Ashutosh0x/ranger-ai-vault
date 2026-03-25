"""
Signal Engine Configuration
All tunable parameters for the ML pipeline.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ═══ ASSETS ═══
ASSETS = ["SOL-PERP", "BTC-PERP", "ETH-PERP"]

# ═══ API ENDPOINTS ═══
DRIFT_API_BASE = "https://data.api.drift.trade"
DRIFT_MAINNET_API = "https://mainnet-beta.api.drift.trade"
COINGLASS_API_BASE = "https://open-api.coinglass.com/public/v2"
COINGLASS_V3_API_BASE = "https://open-api-v3.coinglass.com/api"
PYTH_API_BASE = "https://hermes.pyth.network"

# ═══ API KEYS ═══
COINGLASS_API_KEY = os.environ.get("COINGLASS_API_KEY", "")
HELIUS_RPC_URL = os.environ.get("HELIUS_RPC_URL", "")
KEEPER_SECRET = os.environ.get("KEEPER_SECRET", "")
KEEPER_ORIGIN = os.environ.get("KEEPER_ORIGIN", "http://localhost:3001")

# ═══ MODEL PARAMETERS ═══
MODEL_PARAMS = {
    "momentum": {
        "n_estimators": 100,
        "max_depth": 4,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "min_child_weight": 3,
    },
    "meanrev": {
        "n_estimators": 100,
        "max_depth": 4,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "min_child_weight": 3,
    },
    "ensemble_weights": {
        "momentum": 0.4,
        "meanrev": 0.6,
    },
}

# ═══ FEATURE COLUMNS ═══
FEATURE_COLUMNS = [
    # Drift-derived
    "funding_rate_1h",
    "funding_rate_8h_ma",
    "oi_change_1h",
    "volume_ratio",
    "price_momentum_15m",
    "price_momentum_1h",
    "bollinger_zscore",
    "basis_spread",
    # Coinglass liquidation-derived (KEY DIFFERENTIATOR)
    "liq_nearest_long_dist",
    "liq_nearest_short_dist",
    "liq_long_density_5pct",
    "liq_short_density_5pct",
    "liq_imbalance_ratio",
    "liq_magnetic_pull",
    "liq_proximity_score",
]

# ═══ SIGNAL THRESHOLDS ═══
SIGNAL_THRESHOLDS = {
    "long_entry": 0.6,     # signal > 0.6 → open long
    "short_entry": -0.6,   # signal < -0.6 → open short
    "close_threshold": 0.15,
    "min_confidence": 0.3,  # Don't trade below this confidence
}

# ═══ RISK PARAMETERS ═══
RISK_PARAMS = {
    "max_daily_drawdown": 0.03,      # 3%
    "max_monthly_drawdown": 0.08,    # 8%
    "max_leverage": 2.0,
    "max_net_delta": 0.10,
    "stop_loss_per_trade": -0.005,   # -0.5%
    "take_profit_per_trade": 0.015,  # 1.5%
    "max_concurrent_positions": 3,
    "kelly_fraction": 0.25,
    "min_health_rate": 1.5,
    "var_95_threshold": -0.02,       # 1-day 95% VaR threshold
}

# ═══ TRAINING ═══
TRAINING_CONFIG = {
    "lookback_days": 180,           # 6 months of historical data
    "label_horizon_hours": 1,       # Predict 1h forward return
    "train_test_split": 0.8,
    "cross_val_folds": 5,
    "min_samples": 1000,
}

# ═══ DATA PATHS ═══
DATA_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "cache")
MODEL_SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "saved")

# ═══ PYTH PRICE FEED IDS ═══
PYTH_FEED_IDS = {
    "SOL-PERP": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "BTC-PERP": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "ETH-PERP": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
}

# ═══ DRIFT MARKET MAPPING ═══
DRIFT_MARKET_MAP = {
    "SOL-PERP": {"market_index": 0, "symbol": "SOL"},
    "BTC-PERP": {"market_index": 1, "symbol": "BTC"},
    "ETH-PERP": {"market_index": 2, "symbol": "ETH"},
}
