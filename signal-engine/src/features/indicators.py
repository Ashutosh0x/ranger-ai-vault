"""
Technical Indicators
Bollinger Bands, RSI, VWAP, ATR — used as ML features.
"""

import numpy as np
import pandas as pd
from typing import Optional


def bollinger_bands(
    prices: pd.Series, window: int = 20, num_std: float = 2.0
) -> dict:
    """Compute Bollinger Bands and z-score."""
    sma = prices.rolling(window=window).mean()
    std = prices.rolling(window=window).std()
    upper = sma + (std * num_std)
    lower = sma - (std * num_std)

    latest_price = prices.iloc[-1]
    latest_sma = sma.iloc[-1]
    latest_std = std.iloc[-1]

    zscore = (latest_price - latest_sma) / latest_std if latest_std > 0 else 0

    return {
        "upper": float(upper.iloc[-1]),
        "middle": float(latest_sma),
        "lower": float(lower.iloc[-1]),
        "zscore": float(zscore),
        "bandwidth": float((upper.iloc[-1] - lower.iloc[-1]) / latest_sma) if latest_sma > 0 else 0,
    }


def rsi(prices: pd.Series, window: int = 14) -> float:
    """Compute Relative Strength Index."""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=window).mean()

    rs = gain.iloc[-1] / loss.iloc[-1] if loss.iloc[-1] > 0 else 100
    rsi_val = 100 - (100 / (1 + rs))
    return float(rsi_val)


def vwap(
    high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series
) -> float:
    """Compute Volume-Weighted Average Price."""
    typical_price = (high + low + close) / 3
    cumulative_tp_vol = (typical_price * volume).cumsum()
    cumulative_vol = volume.cumsum()

    vwap_series = cumulative_tp_vol / cumulative_vol
    return float(vwap_series.iloc[-1]) if len(vwap_series) > 0 else 0.0


def atr(
    high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14
) -> float:
    """Compute Average True Range."""
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr_val = true_range.rolling(window=window).mean()
    return float(atr_val.iloc[-1]) if len(atr_val) > 0 else 0.0


def price_momentum(prices: pd.Series, periods: int = 15) -> float:
    """Compute simple price momentum (percentage change)."""
    if len(prices) < periods + 1:
        return 0.0
    return float((prices.iloc[-1] / prices.iloc[-periods - 1]) - 1)


def ema(prices: pd.Series, span: int = 20) -> float:
    """Exponential moving average (latest value)."""
    ema_series = prices.ewm(span=span).mean()
    return float(ema_series.iloc[-1]) if len(ema_series) > 0 else 0.0


def macd(
    prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> dict:
    """Compute MACD, signal line, and histogram."""
    ema_fast = prices.ewm(span=fast).mean()
    ema_slow = prices.ewm(span=slow).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    histogram = macd_line - signal_line

    return {
        "macd": float(macd_line.iloc[-1]),
        "signal": float(signal_line.iloc[-1]),
        "histogram": float(histogram.iloc[-1]),
    }
