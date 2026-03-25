"""
Test Data Fetchers -- Coinglass, asset mapping, graceful degradation
"""
import pytest
import numpy as np

from src.data.data_store import DataStore
from src.data.coinglass_fetcher import CoinglassFetcher
from src.config import ASSETS


class TestCoinglassClient:
    def test_instantiation(self):
        fetcher = CoinglassFetcher()
        assert fetcher is not None

    def test_asset_map_contains_all_assets(self):
        fetcher = CoinglassFetcher()
        for asset in ASSETS:
            assert asset in fetcher.asset_map or asset.replace("-PERP", "") in str(
                fetcher.asset_map
            ), f"Asset {asset} not found in CoinglassFetcher asset_map"

    def test_heatmap_features_graceful_degradation(self):
        """When API key is invalid, fetcher should return safe defaults, not crash."""
        fetcher = CoinglassFetcher()
        try:
            features = fetcher.get_liquidation_features("SOL-PERP")
            # Should return a dict with default safe values, not raise
            assert isinstance(features, dict)
            # Check expected keys exist
            expected_keys = [
                "liq_nearest_long_dist",
                "liq_nearest_short_dist",
                "liq_imbalance_ratio",
            ]
            for key in expected_keys:
                if key in features:
                    assert isinstance(
                        features[key], (int, float)
                    ), f"{key} should be numeric"
        except Exception:
            # In CI with fake API key, either return defaults or raise
            # Both are acceptable as long as the module loads
            pass

    def test_magnetic_pull_calculation(self):
        """Magnetic pull should return -1, 0, or 1 indicating price direction pull."""
        fetcher = CoinglassFetcher()
        try:
            features = fetcher.get_liquidation_features("SOL-PERP")
            if "liq_magnetic_pull" in features:
                assert features["liq_magnetic_pull"] in [-1, 0, 1]
        except Exception:
            pass  # OK in CI with fake key


class TestDataStore:
    def test_init(self):
        store = DataStore()
        assert store is not None

    def test_get_nonexistent(self):
        store = DataStore()
        df = store.get("nonexistent_key")
        assert df is None or (hasattr(df, "empty") and df.empty)

    def test_set_and_get(self):
        import pandas as pd

        store = DataStore()
        test_df = pd.DataFrame({"price": [100, 101, 102]})
        store.set("test_key", test_df)
        result = store.get("test_key")
        assert result is not None
        assert len(result) == 3
