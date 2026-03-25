"""
Delta Monitor — Net portfolio delta tracking.
Keeps the vault near delta-neutral (|net_delta| < 0.1).
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from src.config import RISK_PARAMS


@dataclass
class DeltaState:
    net_delta: float = 0.0
    positions: Dict[str, float] = None  # asset -> delta exposure
    within_limit: bool = True
    rebalance_needed: bool = False

    def __post_init__(self):
        if self.positions is None:
            self.positions = {}


class DeltaMonitor:
    """Track portfolio delta exposure and enforce limits."""

    def __init__(self):
        self.max_net_delta = RISK_PARAMS["max_net_delta"]
        self.state = DeltaState()

    def update_position(
        self, asset: str, delta: float
    ) -> DeltaState:
        """
        Update delta for a specific position.
        delta > 0 = long exposure
        delta < 0 = short exposure
        """
        self.state.positions[asset] = delta
        self._recompute()
        return self.state

    def remove_position(self, asset: str) -> DeltaState:
        """Remove a closed position."""
        self.state.positions.pop(asset, None)
        self._recompute()
        return self.state

    def set_positions(self, positions: Dict[str, float]) -> DeltaState:
        """Set all positions at once."""
        self.state.positions = positions.copy()
        self._recompute()
        return self.state

    def _recompute(self):
        """Recompute net delta and check limits."""
        self.state.net_delta = sum(self.state.positions.values())
        self.state.within_limit = abs(self.state.net_delta) <= self.max_net_delta
        self.state.rebalance_needed = abs(self.state.net_delta) > self.max_net_delta * 0.8

    def get_state(self) -> DeltaState:
        return self.state

    def get_hedge_needed(self) -> float:
        """
        Returns the delta amount needed to return to neutral.
        Positive = need to add short exposure.
        Negative = need to add long exposure.
        """
        return -self.state.net_delta

    def compute_hedge_size(self, asset_price: float) -> dict:
        """
        Compute the notional hedge needed.
        Returns asset amount and USDC value.
        """
        hedge_delta = self.get_hedge_needed()
        notional = abs(hedge_delta) * asset_price

        return {
            "direction": "short" if hedge_delta > 0 else "long",
            "delta_amount": abs(hedge_delta),
            "notional_usdc": notional,
            "asset_units": abs(hedge_delta),
        }
