"""
Signal Server — FastAPI server exposing ML signals to the keeper bot.
Authenticated with X-Keeper-Secret header.
"""

import os
import time
from fastapi import FastAPI, Header, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from src.models.ensemble import EnsembleModel
from src.risk.var_calculator import compute_portfolio_var
from src.risk.drawdown_monitor import DrawdownMonitor
from src.risk.delta_monitor import DeltaMonitor
from src.config import ASSETS, KEEPER_SECRET, KEEPER_ORIGIN

# ═══ APP SETUP ═══
app = FastAPI(
    title="Ranger AI Signal Engine",
    description="ML-powered trading signal server for the Ranger AI Vault",
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[KEEPER_ORIGIN],
    allow_methods=["GET"],
    allow_headers=["X-Keeper-Secret"],
)

# ═══ AUTHENTICATION ═══
_keeper_secret = KEEPER_SECRET
if not _keeper_secret:
    print("[WARN] KEEPER_SECRET not set — using dev mode (no auth)")
    _keeper_secret = None


async def verify_keeper(x_keeper_secret: str = Header(default="")):
    if _keeper_secret and x_keeper_secret != _keeper_secret:
        raise HTTPException(status_code=403, detail="Invalid keeper secret")


# ═══ RATE LIMITING ═══
_request_counts: dict = {}


async def rate_limit():
    now = int(time.time() / 60)
    _request_counts.setdefault(now, 0)
    _request_counts[now] += 1
    for k in list(_request_counts):
        if k < now - 1:
            del _request_counts[k]
    if _request_counts[now] > 30:
        raise HTTPException(status_code=429, detail="Rate limited")


# ═══ SERVICES ═══
ensemble = EnsembleModel()
drawdown_monitor = DrawdownMonitor()
delta_monitor = DeltaMonitor()

# ═══ ENDPOINTS ═══


@app.get("/signal")
async def get_signal(
    asset: str = Query(..., pattern="^(SOL-PERP|BTC-PERP|ETH-PERP)$"),
    _auth=Depends(verify_keeper),
    _rate=Depends(rate_limit),
):
    """Get AI-generated trading signal for an asset."""
    result = ensemble.predict(asset)
    return {
        "asset": asset,
        "signal": result.signal,
        "confidence": result.confidence,
        "momentum_component": result.momentum_raw,
        "meanrev_component": result.meanrev_raw,
        "regime": result.regime,
        "features": result.feature_values,
        "timestamp": time.time(),
    }


@app.get("/signals/all")
async def get_all_signals(
    _auth=Depends(verify_keeper),
    _rate=Depends(rate_limit),
):
    """Get signals for all tracked assets."""
    results = ensemble.get_all_signals()
    return {
        asset: {
            "signal": r.signal,
            "confidence": r.confidence,
            "momentum_component": r.momentum_raw,
            "meanrev_component": r.meanrev_raw,
            "regime": r.regime,
        }
        for asset, r in results.items()
    }


@app.get("/risk")
async def get_risk(_auth=Depends(verify_keeper)):
    """Get current risk state."""
    dd = drawdown_monitor.get_state()
    delta = delta_monitor.get_state()
    return {
        "var_95_1d": -0.02,  # Placeholder — computed from historical data
        "daily_drawdown_pct": dd.daily_pct,
        "monthly_drawdown_pct": dd.monthly_pct,
        "net_delta": delta.net_delta,
        "breach": dd.breach or not delta.within_limit,
        "drawdown_reduction_factor": drawdown_monitor.get_reduction_factor(),
        "timestamp": time.time(),
    }


@app.get("/health")
async def health_check():
    """Keepalive endpoint — no auth required."""
    return {
        "status": "ok",
        "models_loaded": ensemble.momentum.is_trained and ensemble.meanrev.is_trained,
        "assets_tracked": len(ASSETS),
        "timestamp": time.time(),
    }


@app.post("/risk/update-nav")
async def update_nav(
    nav: float = Query(..., gt=0),
    _auth=Depends(verify_keeper),
):
    """Update NAV for drawdown tracking (called by keeper after each cycle)."""
    state = drawdown_monitor.update(nav)
    return {
        "daily_drawdown_pct": state.daily_pct,
        "monthly_drawdown_pct": state.monthly_pct,
        "breach": state.breach,
    }


@app.post("/risk/update-delta")
async def update_delta(
    asset: str = Query(...),
    delta: float = Query(...),
    _auth=Depends(verify_keeper),
):
    """Update delta exposure for a position."""
    state = delta_monitor.update_position(asset, delta)
    return {
        "net_delta": state.net_delta,
        "within_limit": state.within_limit,
        "rebalance_needed": state.rebalance_needed,
    }
