# signal-engine/tests/conftest.py
# Shared fixtures for all signal engine tests

import os
import sys
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("COINGLASS_API_KEY", "test_key_not_real")
os.environ.setdefault("KEEPER_SECRET", "test_secret_ci")
os.environ.setdefault("DRIFT_ENV", "devnet")


@pytest.fixture
def sample_features():
    """Generate sample feature vector for model testing"""
    return {
        "funding_rate_1h": 0.0005,
        "funding_rate_8h_ma": 0.0003,
        "oi_change_1h": 150000,
        "volume_ratio": 1.2,
        "price_momentum_15m": 0.003,
        "price_momentum_1h": 0.008,
        "bollinger_zscore": -0.5,
        "basis_spread": 0.002,
        "liq_nearest_long_dist": 3.5,
        "liq_nearest_short_dist": 4.2,
        "liq_long_density_5pct": 5000000,
        "liq_short_density_5pct": 3000000,
        "liq_imbalance_ratio": 0.62,
        "liq_magnetic_pull": -1,
        "liq_proximity_score": 0.22,
    }


@pytest.fixture
def sample_ohlcv():
    """Generate sample OHLCV data"""
    np.random.seed(42)
    n = 1000
    dates = pd.date_range("2025-01-01", periods=n, freq="1h")
    close = 150 + np.cumsum(np.random.normal(0, 2, n))
    return pd.DataFrame({
        "timestamp": dates,
        "open": close + np.random.normal(0, 0.5, n),
        "high": close + abs(np.random.normal(1, 0.5, n)),
        "low": close - abs(np.random.normal(1, 0.5, n)),
        "close": close,
        "volume": np.random.lognormal(15, 1, n),
    })


@pytest.fixture
def sample_returns():
    """Generate sample daily returns for risk testing"""
    np.random.seed(42)
    return np.random.normal(0.001, 0.02, 180)
