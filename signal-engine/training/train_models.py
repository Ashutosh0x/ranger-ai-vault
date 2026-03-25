"""
Training Pipeline — Fetch data, engineer features, train models.
"""

import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Add parent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.data.drift_fetcher import get_drift_fetcher
from src.features.feature_engineer import get_feature_engineer
from src.features.indicators import bollinger_bands, price_momentum
from src.models.momentum_model import MomentumModel
from src.models.meanrev_model import MeanRevModel
from src.models.model_registry import get_model_registry
from src.config import ASSETS, FEATURE_COLUMNS, TRAINING_CONFIG, MODEL_PARAMS


def fetch_training_data(asset: str) -> pd.DataFrame:
    """Fetch OHLCV data for training."""
    drift = get_drift_fetcher()
    print(f"[TRAIN] Fetching OHLCV for {asset}...")
    df = drift.get_ohlcv(asset, resolution="3600", limit=4320)  # ~6 months of hourly

    if df.empty:
        print(f"[WARN] No OHLCV data for {asset}")
        return pd.DataFrame()

    print(f"[TRAIN] Got {len(df)} candles for {asset}")
    return df


def engineer_features(ohlcv: pd.DataFrame) -> pd.DataFrame:
    """Compute features from OHLCV data."""
    if len(ohlcv) < 30:
        return pd.DataFrame()

    close = ohlcv["close"]
    records = []

    for i in range(20, len(ohlcv)):
        window = close.iloc[:i + 1]
        row = {}

        # Price features
        row["price_momentum_15m"] = price_momentum(window, 1)
        row["price_momentum_1h"] = price_momentum(window, 4)
        bb = bollinger_bands(window, 20)
        row["bollinger_zscore"] = bb["zscore"]

        # Market features (simplified for training)
        row["funding_rate_1h"] = 0.0
        row["funding_rate_8h_ma"] = 0.0
        row["oi_change_1h"] = 0.0
        row["volume_ratio"] = float(ohlcv["volume"].iloc[i] / ohlcv["volume"].iloc[max(0, i-24):i+1].mean()) if "volume" in ohlcv.columns else 1.0
        row["basis_spread"] = 0.0

        # Liquidation features (neutral for training)
        row["liq_nearest_long_dist"] = 50.0
        row["liq_nearest_short_dist"] = 50.0
        row["liq_long_density_5pct"] = 0.0
        row["liq_short_density_5pct"] = 0.0
        row["liq_imbalance_ratio"] = 0.5
        row["liq_magnetic_pull"] = 0.0
        row["liq_proximity_score"] = 0.0

        # Target: 1h forward return
        if i + 4 < len(ohlcv):
            row["target_momentum"] = (close.iloc[i + 4] - close.iloc[i]) / close.iloc[i]
            # Mean-reversion target: z-score decay
            current_z = bb["zscore"]
            future_z = 0
            if i + 4 < len(ohlcv):
                future_window = close.iloc[:i + 5]
                future_bb = bollinger_bands(future_window, 20)
                future_z = future_bb["zscore"]
            row["target_meanrev"] = -(current_z - future_z)  # Positive if z reverts
        else:
            row["target_momentum"] = 0.0
            row["target_meanrev"] = 0.0

        records.append(row)

    return pd.DataFrame(records)


def train_models():
    """Full training pipeline."""
    print("═" * 60)
    print("🧠 RANGER AI VAULT — MODEL TRAINING")
    print("═" * 60)

    all_features = []
    all_targets_mom = []
    all_targets_mrev = []

    for asset in ASSETS:
        # Fetch data
        ohlcv = fetch_training_data(asset)
        if ohlcv.empty:
            continue

        # Engineer features
        features_df = engineer_features(ohlcv)
        if features_df.empty:
            continue

        # Split features and targets
        feature_cols = [c for c in FEATURE_COLUMNS if c in features_df.columns]
        X = features_df[feature_cols]
        y_mom = features_df["target_momentum"]
        y_mrev = features_df["target_meanrev"]

        all_features.append(X)
        all_targets_mom.append(y_mom)
        all_targets_mrev.append(y_mrev)

        print(f"[TRAIN] {asset}: {len(X)} samples")

    if not all_features:
        print("[ERROR] No training data available. Using synthetic data for demo...")
        # Generate synthetic training data for demo purposes
        np.random.seed(42)
        n = 1000
        X = pd.DataFrame(
            np.random.randn(n, len(FEATURE_COLUMNS)),
            columns=FEATURE_COLUMNS,
        )
        y_mom = pd.Series(np.random.randn(n) * 0.01)
        y_mrev = pd.Series(np.random.randn(n) * 0.01)
    else:
        X = pd.concat(all_features, ignore_index=True)
        y_mom = pd.concat(all_targets_mom, ignore_index=True)
        y_mrev = pd.concat(all_targets_mrev, ignore_index=True)

    # Fill NaN
    X = X.fillna(0)
    y_mom = y_mom.fillna(0)
    y_mrev = y_mrev.fillna(0)

    print(f"\n[TRAIN] Total samples: {len(X)}")
    print(f"[TRAIN] Features: {len(X.columns)}")

    # Train/test split
    split = int(len(X) * TRAINING_CONFIG["train_test_split"])
    X_train, X_test = X[:split], X[split:]
    y_mom_train, y_mom_test = y_mom[:split], y_mom[split:]
    y_mrev_train, y_mrev_test = y_mrev[:split], y_mrev[split:]

    # Train Momentum Model
    print("\n📈 Training Momentum Model...")
    momentum = MomentumModel()
    mom_metrics = momentum.train(X_train, y_mom_train)
    print(f"   Train RMSE: {mom_metrics['rmse']:.6f}")
    print(f"   Train Corr: {mom_metrics['correlation']:.4f}")

    # Test metrics
    y_mom_pred = momentum.predict_batch(X_test)
    test_rmse = np.sqrt(np.mean((y_mom_test - y_mom_pred) ** 2))
    test_corr = np.corrcoef(y_mom_test, y_mom_pred)[0, 1] if len(y_mom_test) > 1 else 0
    print(f"   Test RMSE:  {test_rmse:.6f}")
    print(f"   Test Corr:  {test_corr:.4f}")
    mom_metrics["test_rmse"] = float(test_rmse)
    mom_metrics["test_correlation"] = float(test_corr)

    # Train Mean-Reversion Model
    print("\n📉 Training Mean-Reversion Model...")
    meanrev = MeanRevModel()
    mrev_metrics = meanrev.train(X_train, y_mrev_train)
    print(f"   Train RMSE: {mrev_metrics['rmse']:.6f}")
    print(f"   Train Corr: {mrev_metrics['correlation']:.4f}")

    y_mrev_pred = meanrev.predict_batch(X_test)
    test_rmse_mr = np.sqrt(np.mean((y_mrev_test - y_mrev_pred) ** 2))
    test_corr_mr = np.corrcoef(y_mrev_test, y_mrev_pred)[0, 1] if len(y_mrev_test) > 1 else 0
    print(f"   Test RMSE:  {test_rmse_mr:.6f}")
    print(f"   Test Corr:  {test_corr_mr:.4f}")
    mrev_metrics["test_rmse"] = float(test_rmse_mr)
    mrev_metrics["test_correlation"] = float(test_corr_mr)

    # Save models
    registry = get_model_registry()
    registry.save_model("momentum", momentum.model, mom_metrics)
    registry.save_model("meanrev", meanrev.model, mrev_metrics)

    # Feature importance
    print("\n🔍 Top Feature Importance (Momentum):")
    for feat, imp in list(momentum.get_feature_importance().items())[:5]:
        print(f"   {feat}: {imp:.4f}")

    print("\n🔍 Top Feature Importance (Mean-Rev):")
    for feat, imp in list(meanrev.get_feature_importance().items())[:5]:
        print(f"   {feat}: {imp:.4f}")

    print("\n" + "═" * 60)
    print("✅ Models trained and saved!")
    print("═" * 60)


if __name__ == "__main__":
    train_models()
