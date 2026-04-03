"""
Metrics Collector — Tracks NAV, equity curve, PnL, trade history.
Serves real-time metrics to the /metrics endpoint.
"""

import time
import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class TradeRecord:
    timestamp: float
    asset: str
    direction: str
    size_usd: float
    entry_price: float
    exit_price: float = 0.0
    pnl_usd: float = 0.0
    status: str = "open"


@dataclass
class EquityPoint:
    timestamp: str
    nav: float
    benchmark: float = 0.0


class MetricsCollector:
    """
    Production metrics collector — no mock data.
    Tracks real NAV, equity curve, PnL from keeper updates.
    """

    def __init__(self, initial_nav: float = 0.0):
        self.initial_nav = initial_nav
        self.current_nav = initial_nav
        self.high_water_mark = initial_nav
        self.equity_curve: List[EquityPoint] = []
        self.trade_history: List[TradeRecord] = []
        self.start_time = time.time()

        # Track running stats
        self.total_trades = 0
        self.winning_trades = 0
        self.total_pnl = 0.0
        self.total_wins = 0.0
        self.total_losses = 0.0
        self.max_drawdown = 0.0

    def update_nav(self, nav: float) -> None:
        """Called by keeper after each cycle with current vault NAV."""
        self.current_nav = nav

        if nav > self.high_water_mark:
            self.high_water_mark = nav

        # Track drawdown
        if self.high_water_mark > 0:
            dd = (self.high_water_mark - nav) / self.high_water_mark
            if dd > self.max_drawdown:
                self.max_drawdown = dd

        # Add equity point
        self.equity_curve.append(EquityPoint(
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            nav=nav,
        ))

        # Keep last 1000 points
        if len(self.equity_curve) > 1000:
            self.equity_curve = self.equity_curve[-1000:]

    def record_trade(self, trade: TradeRecord) -> None:
        """Record a completed trade."""
        self.trade_history.append(trade)
        self.total_trades += 1
        self.total_pnl += trade.pnl_usd

        if trade.pnl_usd > 0:
            self.winning_trades += 1
            self.total_wins += trade.pnl_usd
        else:
            self.total_losses += abs(trade.pnl_usd)

        # Keep last 500 trades
        if len(self.trade_history) > 500:
            self.trade_history = self.trade_history[-500:]

    def get_metrics(self) -> Dict:
        """Return all metrics for the /metrics endpoint."""
        elapsed_hours = (time.time() - self.start_time) / 3600
        elapsed_years = elapsed_hours / 8760

        # Calculate realized APY
        if self.initial_nav > 0 and elapsed_years > 0:
            total_return = (self.current_nav - self.initial_nav) / self.initial_nav
            realized_apy = total_return / elapsed_years if elapsed_years > 0.001 else 0.0
        else:
            total_return = 0.0
            realized_apy = 0.0

        # Win rate
        win_rate = self.winning_trades / self.total_trades if self.total_trades > 0 else 0.0

        # Profit factor
        profit_factor = self.total_wins / self.total_losses if self.total_losses > 0 else 0.0

        # Sharpe approximation (annualized)
        if len(self.equity_curve) > 1:
            import numpy as np
            navs = [p.nav for p in self.equity_curve]
            returns = np.diff(navs) / np.array(navs[:-1])
            if len(returns) > 0 and np.std(returns) > 0:
                sharpe = np.mean(returns) / np.std(returns) * np.sqrt(252 * 24)
            else:
                sharpe = 0.0
        else:
            sharpe = 0.0

        return {
            "nav_usdc": self.current_nav,
            "initial_nav": self.initial_nav,
            "total_return_pct": total_return * 100,
            "realized_apy": realized_apy,
            "sharpe_ratio": float(sharpe),
            "max_drawdown_pct": self.max_drawdown * 100,
            "high_water_mark": self.high_water_mark,
            "total_trades": self.total_trades,
            "win_rate": win_rate,
            "profit_factor": profit_factor,
            "total_pnl_usd": self.total_pnl,
            "uptime_hours": elapsed_hours,
            "equity_curve": [asdict(p) for p in self.equity_curve[-200:]],
            "timestamp": time.time(),
        }

    def get_trade_history(self, limit: int = 50) -> List[Dict]:
        """Return recent trade history."""
        trades = self.trade_history[-limit:]
        return [asdict(t) for t in reversed(trades)]


# Singleton
_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    global _collector
    if _collector is None:
        _collector = MetricsCollector()
    return _collector
