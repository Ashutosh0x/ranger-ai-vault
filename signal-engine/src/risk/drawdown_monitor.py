"""
Drawdown Monitor — Track P&L and enforce drawdown limits.
3% daily max, 8% monthly max.
"""

import time
from dataclasses import dataclass, field
from typing import Optional, List
from src.config import RISK_PARAMS


@dataclass
class DrawdownState:
    daily_pct: float = 0.0
    monthly_pct: float = 0.0
    daily_hwm: float = 0.0        # High water mark (daily)
    monthly_hwm: float = 0.0      # High water mark (monthly)
    current_nav: float = 1.0
    daily_start_nav: float = 1.0
    monthly_start_nav: float = 1.0
    breach: bool = False
    last_reset_day: int = 0
    last_reset_month: int = 0


class DrawdownMonitor:
    """Track drawdown and enforce limits."""

    def __init__(self):
        self.max_daily = RISK_PARAMS["max_daily_drawdown"]
        self.max_monthly = RISK_PARAMS["max_monthly_drawdown"]
        self.state = DrawdownState()
        self.pnl_history: List[float] = []
        self._initialize_periods()

    def _initialize_periods(self):
        """Set current day/month tracking."""
        import datetime
        now = datetime.datetime.utcnow()
        self.state.last_reset_day = now.day
        self.state.last_reset_month = now.month

    def update(self, current_nav: float) -> DrawdownState:
        """
        Update drawdown state with new NAV reading.
        Call this after every rebalance cycle.
        """
        import datetime
        now = datetime.datetime.utcnow()

        # Check for period resets
        if now.day != self.state.last_reset_day:
            self.state.daily_start_nav = self.state.current_nav
            self.state.daily_hwm = self.state.current_nav
            self.state.last_reset_day = now.day

        if now.month != self.state.last_reset_month:
            self.state.monthly_start_nav = self.state.current_nav
            self.state.monthly_hwm = self.state.current_nav
            self.state.last_reset_month = now.month

        self.state.current_nav = current_nav

        # Update high water marks
        self.state.daily_hwm = max(self.state.daily_hwm, current_nav)
        self.state.monthly_hwm = max(self.state.monthly_hwm, current_nav)

        # Compute drawdowns (as positive percentages)
        if self.state.daily_hwm > 0:
            self.state.daily_pct = (self.state.daily_hwm - current_nav) / self.state.daily_hwm
        if self.state.monthly_hwm > 0:
            self.state.monthly_pct = (self.state.monthly_hwm - current_nav) / self.state.monthly_hwm

        # Clamp negatives (if NAV goes up after drawdown)
        self.state.daily_pct = max(self.state.daily_pct, 0)
        self.state.monthly_pct = max(self.state.monthly_pct, 0)

        # Check breach
        self.state.breach = (
            self.state.daily_pct > self.max_daily
            or self.state.monthly_pct > self.max_monthly
        )

        # Track history
        self.pnl_history.append(current_nav)

        return self.state

    def get_state(self) -> DrawdownState:
        return self.state

    def should_halt_trading(self) -> bool:
        """Returns True if drawdown limits are breached."""
        return self.state.breach

    def get_reduction_factor(self) -> float:
        """
        Returns a scaling factor (0-1) based on proximity to limits.
        Used to reduce position sizes near drawdown limits.
        """
        daily_usage = self.state.daily_pct / self.max_daily if self.max_daily > 0 else 0
        monthly_usage = self.state.monthly_pct / self.max_monthly if self.max_monthly > 0 else 0

        max_usage = max(daily_usage, monthly_usage)

        if max_usage >= 1.0:
            return 0.0  # Full stop
        elif max_usage >= 0.8:
            return 0.25  # Severely reduce
        elif max_usage >= 0.5:
            return 0.5   # Moderate reduction
        else:
            return 1.0   # Full allocation
