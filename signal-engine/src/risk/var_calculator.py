"""
VaR Calculator — Historical Value-at-Risk computation.
95% confidence, 1-day horizon.
"""

import numpy as np
from typing import List, Optional


def compute_var(returns: np.ndarray, confidence: float = 0.95) -> float:
    """
    Historical VaR: worst-case loss at given confidence level.
    Returns a negative number (loss).
    """
    if len(returns) < 10:
        return -0.02  # Default to -2% if insufficient data

    percentile = (1 - confidence) * 100
    return float(np.percentile(returns, percentile))


def compute_cvar(returns: np.ndarray, confidence: float = 0.95) -> float:
    """
    Conditional VaR (Expected Shortfall): average loss beyond VaR.
    More conservative risk measure.
    """
    if len(returns) < 10:
        return -0.03

    var = compute_var(returns, confidence)
    tail_losses = returns[returns <= var]
    return float(np.mean(tail_losses)) if len(tail_losses) > 0 else var


def compute_portfolio_var(
    position_returns: Optional[List[np.ndarray]] = None,
    weights: Optional[List[float]] = None,
    confidence: float = 0.95,
) -> float:
    """
    Portfolio VaR with optional correlation.
    If no data provided, returns default threshold.
    """
    if position_returns is None or len(position_returns) == 0:
        return -0.02  # Default

    if weights is None:
        weights = [1.0 / len(position_returns)] * len(position_returns)

    # Simple weighted combination
    portfolio_returns = np.zeros_like(position_returns[0])
    for ret, w in zip(position_returns, weights):
        min_len = min(len(portfolio_returns), len(ret))
        portfolio_returns[:min_len] += w * ret[:min_len]

    return compute_var(portfolio_returns, confidence)


def check_var_threshold(
    returns: np.ndarray,
    threshold: float = -0.02,
    confidence: float = 0.95,
) -> dict:
    """
    Check if VaR exceeds allowed threshold.
    Returns check result with details.
    """
    var = compute_var(returns, confidence)
    cvar = compute_cvar(returns, confidence)

    return {
        "var": var,
        "cvar": cvar,
        "threshold": threshold,
        "within_limit": var >= threshold,  # VaR is negative, so >= is safer
        "breach_amount": var - threshold if var < threshold else 0,
    }
