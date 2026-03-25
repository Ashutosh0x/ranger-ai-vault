"""
Feature Engineer — Computes all ML features from raw data sources.
Combines Drift, Coinglass, and Pyth data into a feature vector.
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional

from src.data.drift_fetcher import get_drift_fetcher
from src.data.pyth_fetcher import get_pyth_fetcher
from src.features.indicators import (
    bollinger_bands,
    price_momentum,
)
from src.features.liquidation_features import get_liquidation_features
from src.config import FEATURE_COLUMNS


class FeatureEngineer:
    """Compute all features for a given asset."""

    def __init__(self):
        self.drift = get_drift_fetcher()
        self.pyth = get_pyth_fetcher()

    def compute_features(self, asset: str) -> Dict[str, float]:
        """
        Compute the full feature vector for an asset.
        Returns a dict matching FEATURE_COLUMNS.
        """
        features: Dict[str, float] = {}

        # 1. Get current price
        current_price = self.pyth.get_price(asset)
        if current_price is None:
            current_price = self.drift.get_oracle_price(asset) or 0.0

        # 2. Funding rate features
        funding = self.drift.compute_funding_features(asset)
        features["funding_rate_1h"] = funding.get("funding_rate_1h", 0.0)
        features["funding_rate_8h_ma"] = funding.get("funding_rate_8h_ma", 0.0)

        # 3. Volume and OI features
        volume = self.drift.compute_volume_features(asset)
        features["oi_change_1h"] = volume.get("oi_change_1h", 0.0)
        features["volume_ratio"] = volume.get("volume_ratio", 0.0)

        # 4. Price data features (from OHLCV)
        ohlcv = self.drift.get_ohlcv(asset, resolution="60", limit=200)

        if not ohlcv.empty and "close" in ohlcv.columns:
            close_prices = ohlcv["close"]

            # Momentum
            features["price_momentum_15m"] = price_momentum(close_prices, periods=1)  # ~15min candle
            features["price_momentum_1h"] = price_momentum(close_prices, periods=4)   # 4x15min

            # Bollinger z-score
            bb = bollinger_bands(close_prices, window=20)
            features["bollinger_zscore"] = bb["zscore"]
        else:
            features["price_momentum_15m"] = 0.0
            features["price_momentum_1h"] = 0.0
            features["bollinger_zscore"] = 0.0

        # 5. Basis spread (mark - oracle)
        features["basis_spread"] = self.drift.compute_basis_spread(asset)

        # 6. Liquidation features (KEY DIFFERENTIATOR)
        if current_price > 0:
            liq_features = get_liquidation_features(asset, current_price)
            features["liq_nearest_long_dist"] = liq_features.get("liq_nearest_long_dist", 50.0)
            features["liq_nearest_short_dist"] = liq_features.get("liq_nearest_short_dist", 50.0)
            features["liq_long_density_5pct"] = liq_features.get("liq_long_density_5pct", 0.0)
            features["liq_short_density_5pct"] = liq_features.get("liq_short_density_5pct", 0.0)
            features["liq_imbalance_ratio"] = liq_features.get("liq_imbalance_ratio", 0.5)
            features["liq_magnetic_pull"] = liq_features.get("liq_magnetic_pull", 0.0)
            features["liq_proximity_score"] = liq_features.get("liq_proximity_score", 0.0)
        else:
            features.update({
                "liq_nearest_long_dist": 50.0,
                "liq_nearest_short_dist": 50.0,
                "liq_long_density_5pct": 0.0,
                "liq_short_density_5pct": 0.0,
                "liq_imbalance_ratio": 0.5,
                "liq_magnetic_pull": 0.0,
                "liq_proximity_score": 0.0,
            })

        return features

    def compute_features_batch(
        self, asset: str, ohlcv_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Compute features for each row in OHLCV data (for training).
        Returns DataFrame with feature columns.
        """
        if ohlcv_df.empty:
            return pd.DataFrame(columns=FEATURE_COLUMNS)

        close = ohlcv_df["close"]
        records = []

        for i in range(20, len(ohlcv_df)):  # Need 20 period lookback for BB
            row = {}
            window = close.iloc[:i + 1]

            # Momentum
            row["price_momentum_15m"] = price_momentum(window, 1)
            row["price_momentum_1h"] = price_momentum(window, 4)

            # Bollinger
            bb = bollinger_bands(window, 20)
            row["bollinger_zscore"] = bb["zscore"]

            # Basis, funding — use placeholders for batch training
            row["funding_rate_1h"] = 0.0
            row["funding_rate_8h_ma"] = 0.0
            row["oi_change_1h"] = 0.0
            row["volume_ratio"] = 0.0
            row["basis_spread"] = 0.0

            # Liquidation features — neutral for historical data
            row["liq_nearest_long_dist"] = 50.0
            row["liq_nearest_short_dist"] = 50.0
            row["liq_long_density_5pct"] = 0.0
            row["liq_short_density_5pct"] = 0.0
            row["liq_imbalance_ratio"] = 0.5
            row["liq_magnetic_pull"] = 0.0
            row["liq_proximity_score"] = 0.0

            records.append(row)

        return pd.DataFrame(records)


# Singleton
_engineer: Optional[FeatureEngineer] = None


def get_feature_engineer() -> FeatureEngineer:
    global _engineer
    if _engineer is None:
        _engineer = FeatureEngineer()
    return _engineer
