"""
Test Features -- Unit tests for indicators and feature engineering
"""
import pytest
import numpy as np
import pandas as pd

# Indicators
from src.features.indicators import (
    bollinger_bands, rsi, vwap, atr, price_momentum, ema, macd,
)


class TestBollingerBands:
    def test_basic_output(self):
        prices = pd.Series(np.random.randn(50).cumsum() + 100)
        bb = bollinger_bands(prices, window=20)
        assert "upper" in bb
        assert "middle" in bb
        assert "lower" in bb
        assert "zscore" in bb
        assert "bandwidth" in bb
        assert bb["upper"] > bb["middle"] > bb["lower"]

    def test_zscore_range(self):
        prices = pd.Series(np.random.randn(50).cumsum() + 100)
        bb = bollinger_bands(prices)
        assert -10 < bb["zscore"] < 10


class TestRSI:
    def test_basic_range(self):
        prices = pd.Series(np.random.randn(50).cumsum() + 100)
        val = rsi(prices)
        assert 0 <= val <= 100

    def test_bullish_rsi(self):
        prices = pd.Series(range(1, 52), dtype=float)
        val = rsi(prices)
        assert val > 50


class TestVWAP:
    def test_basic(self):
        n = 50
        close = pd.Series(np.random.randn(n).cumsum() + 100)
        high = close + abs(np.random.randn(n))
        low = close - abs(np.random.randn(n))
        volume = pd.Series(np.random.randint(100, 1000, n).astype(float))
        val = vwap(high, low, close, volume)
        assert val > 0


class TestATR:
    def test_positive(self):
        n = 50
        close = pd.Series(np.random.randn(n).cumsum() + 100)
        high = close + 1
        low = close - 1
        val = atr(high, low, close)
        assert val > 0


class TestMomentum:
    def test_uptrend(self):
        prices = pd.Series(range(1, 20), dtype=float)
        val = price_momentum(prices, 5)
        assert val > 0

    def test_downtrend(self):
        prices = pd.Series(range(20, 1, -1), dtype=float)
        val = price_momentum(prices, 5)
        assert val < 0


class TestEMA:
    def test_basic(self):
        prices = pd.Series(np.random.randn(30).cumsum() + 100)
        val = ema(prices, span=10)
        assert val > 0


class TestMACD:
    def test_output(self):
        prices = pd.Series(np.random.randn(50).cumsum() + 100)
        result = macd(prices)
        assert "macd" in result
        assert "signal" in result
        assert "histogram" in result
