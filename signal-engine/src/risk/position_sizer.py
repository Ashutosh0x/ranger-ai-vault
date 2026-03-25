"""
Position Sizer — Kelly criterion with fractional scaling.
"""

import numpy as np
from typing import Optional
from src.config import RISK_PARAMS


class PositionSizer:
    """
    Kelly criterion position sizing with conservative fractional scaling.
    kelly_fraction = 0.25 (quarter Kelly for safety).
    """

    def __init__(self):
        self.kelly_fraction = RISK_PARAMS["kelly_fraction"]
        self.max_position_pct = 0.40  # Max 40% of active capital per position
        self.min_position_pct = 0.05   # Min 5% to avoid dust

    def compute_kelly(
        self,
        win_rate: float,
        avg_win: float,
        avg_loss: float,
    ) -> float:
        """
        Kelly criterion: f* = (p*b - q) / b
        where p = win_rate, q = 1-p, b = avg_win/avg_loss
        """
        if avg_loss == 0 or win_rate <= 0 or win_rate >= 1:
            return 0.0

        q = 1 - win_rate
        b = abs(avg_win / avg_loss)
        kelly = (win_rate * b - q) / b

        return max(kelly, 0)

    def compute_position_size(
        self,
        capital: float,
        signal_strength: float,
        confidence: float,
        win_rate: float = 0.55,
        avg_win: float = 0.015,
        avg_loss: float = 0.005,
    ) -> float:
        """
        Compute position size in USDC.

        Args:
            capital: Available capital for active trading
            signal_strength: Absolute signal value (0-1)
            confidence: Model confidence (0-1)
            win_rate: Historical win rate
            avg_win: Average winning trade return
            avg_loss: Average losing trade return (positive number)

        Returns:
            Position size in USDC
        """
        # Kelly optimal fraction
        full_kelly = self.compute_kelly(win_rate, avg_win, avg_loss)

        # Apply fractional Kelly
        kelly_pct = full_kelly * self.kelly_fraction

        # Scale by signal strength and confidence
        adjusted_pct = kelly_pct * signal_strength * confidence

        # Clamp to bounds
        position_pct = np.clip(adjusted_pct, self.min_position_pct, self.max_position_pct)

        position_size = capital * position_pct

        return float(position_size)

    def adjust_for_drawdown(
        self,
        base_size: float,
        current_drawdown: float,
        max_drawdown: float,
    ) -> float:
        """
        Reduce position size as drawdown increases.
        At 50% of max drawdown, reduce size by 50%.
        At max drawdown, size goes to 0 (stop trading).
        """
        if current_drawdown >= max_drawdown:
            return 0.0

        drawdown_ratio = current_drawdown / max_drawdown
        scale_factor = max(1 - drawdown_ratio, 0)

        return float(base_size * scale_factor)


# Singleton
_sizer: Optional[PositionSizer] = None


def get_position_sizer() -> PositionSizer:
    global _sizer
    if _sizer is None:
        _sizer = PositionSizer()
    return _sizer
