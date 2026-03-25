"""
Test Risk -- Unit tests for VaR, position sizer, drawdown, delta
"""
import pytest
import numpy as np

from src.risk.var_calculator import compute_var, compute_cvar, check_var_threshold
from src.risk.position_sizer import PositionSizer
from src.risk.drawdown_monitor import DrawdownMonitor
from src.risk.delta_monitor import DeltaMonitor


class TestVaR:
    def test_basic_var(self):
        returns = np.random.randn(1000) * 0.01
        var = compute_var(returns, 0.95)
        assert var < 0  # VaR should be negative (loss)

    def test_cvar_worse_than_var(self):
        returns = np.random.randn(1000) * 0.01
        var = compute_var(returns, 0.95)
        cvar = compute_cvar(returns, 0.95)
        assert cvar <= var  # CVaR is always worse (more negative)

    def test_threshold_check(self):
        returns = np.random.randn(100) * 0.005
        result = check_var_threshold(returns, threshold=-0.02)
        assert "var" in result
        assert "within_limit" in result

    def test_insufficient_data(self):
        returns = np.array([0.01, 0.02])
        var = compute_var(returns)
        assert var == -0.02  # Default


class TestPositionSizer:
    def test_kelly_positive(self):
        sizer = PositionSizer()
        kelly = sizer.compute_kelly(0.6, 0.015, 0.005)
        assert kelly > 0

    def test_kelly_losing(self):
        sizer = PositionSizer()
        kelly = sizer.compute_kelly(0.3, 0.005, 0.015)
        assert kelly == 0  # Negative Kelly clamped to 0

    def test_position_size(self):
        sizer = PositionSizer()
        size = sizer.compute_position_size(
            capital=1_000_000,
            signal_strength=0.8,
            confidence=0.7,
        )
        assert size > 0
        assert size <= 1_000_000 * 0.40  # Max 40%

    def test_drawdown_adjustment(self):
        sizer = PositionSizer()
        full = sizer.adjust_for_drawdown(100_000, 0.0, 0.08)
        reduced = sizer.adjust_for_drawdown(100_000, 0.04, 0.08)
        halted = sizer.adjust_for_drawdown(100_000, 0.08, 0.08)
        assert full == 100_000
        assert reduced < full
        assert halted == 0


class TestDrawdownMonitor:
    def test_initial_state(self):
        monitor = DrawdownMonitor()
        state = monitor.get_state()
        assert state.daily_pct == 0
        assert state.breach is False

    def test_drawdown_increase(self):
        monitor = DrawdownMonitor()
        monitor.update(1.0)
        monitor.update(0.98)  # 2% drop
        state = monitor.get_state()
        assert state.daily_pct > 0

    def test_reduction_factor(self):
        monitor = DrawdownMonitor()
        factor = monitor.get_reduction_factor()
        assert 0 <= factor <= 1


class TestDeltaMonitor:
    def test_neutral(self):
        monitor = DeltaMonitor()
        state = monitor.get_state()
        assert state.net_delta == 0
        assert state.within_limit is True

    def test_long_delta(self):
        monitor = DeltaMonitor()
        monitor.update_position("SOL-PERP", 0.05)
        state = monitor.get_state()
        assert state.net_delta == 0.05
        assert state.within_limit is True

    def test_breach(self):
        monitor = DeltaMonitor()
        monitor.update_position("SOL-PERP", 0.15)
        state = monitor.get_state()
        assert state.within_limit is False

    def test_hedge_needed(self):
        monitor = DeltaMonitor()
        monitor.update_position("SOL-PERP", 0.05)
        hedge = monitor.get_hedge_needed()
        assert hedge == -0.05
