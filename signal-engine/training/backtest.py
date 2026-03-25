"""
Backtest Engine — Walk-forward backtesting with performance metrics.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.config import ASSETS, FEATURE_COLUMNS, SIGNAL_THRESHOLDS, RISK_PARAMS
from src.data.drift_fetcher import get_drift_fetcher
from src.features.indicators import bollinger_bands, price_momentum


def run_backtest():
    """Walk-forward backtest of the strategy."""
    print("═" * 60)
    print("📊 RANGER AI VAULT — BACKTEST")
    print("═" * 60)

    # Fetch data
    drift = get_drift_fetcher()
    all_results = []

    for asset in ASSETS:
        print(f"\n[BT] Running backtest for {asset}...")
        ohlcv = drift.get_ohlcv(asset, resolution="3600", limit=4320)

        if ohlcv.empty or len(ohlcv) < 100:
            print(f"[BT] Insufficient data for {asset}, using synthetic data")
            np.random.seed(42)
            n = 2000
            prices = 100 * np.exp(np.cumsum(np.random.randn(n) * 0.002))
            ohlcv = pd.DataFrame({
                "open": prices,
                "high": prices * (1 + np.abs(np.random.randn(n) * 0.005)),
                "low": prices * (1 - np.abs(np.random.randn(n) * 0.005)),
                "close": prices * (1 + np.random.randn(n) * 0.001),
                "volume": np.random.randint(1000, 10000, n).astype(float),
            })

        results = _backtest_asset(asset, ohlcv)
        all_results.extend(results)

    # Aggregate results
    if all_results:
        _generate_report(all_results)
    else:
        print("[BT] No results generated")


def _backtest_asset(asset: str, ohlcv: pd.DataFrame) -> list:
    """Backtest a single asset."""
    close = ohlcv["close"].values
    trades = []

    capital = 1_000_000  # $1M notional
    position = 0
    entry_price = 0
    pnl_history = [0.0]

    long_threshold = SIGNAL_THRESHOLDS["long_entry"]
    short_threshold = SIGNAL_THRESHOLDS["short_entry"]
    stop_loss = RISK_PARAMS["stop_loss_per_trade"]
    take_profit = RISK_PARAMS["take_profit_per_trade"]

    for i in range(30, len(close) - 1):
        window = pd.Series(close[:i + 1])

        # Simple signal (mimics ensemble without trained model)
        bb = bollinger_bands(window, 20)
        mom = price_momentum(window, 4)
        signal = -bb["zscore"] * 0.3 + mom * 100 * 0.2  # Simple blend

        current_price = close[i]

        # Check stop/take on existing position
        if position != 0:
            pnl_pct = (current_price / entry_price - 1) * position

            if pnl_pct <= stop_loss or pnl_pct >= take_profit:
                trades.append({
                    "asset": asset,
                    "entry_idx": entry_idx,
                    "exit_idx": i,
                    "side": "long" if position > 0 else "short",
                    "entry_price": entry_price,
                    "exit_price": current_price,
                    "pnl_pct": pnl_pct,
                    "pnl_usd": pnl_pct * capital * 0.5 * abs(position),
                    "reason": "stop_loss" if pnl_pct <= stop_loss else "take_profit",
                })
                position = 0
                entry_price = 0

        # Open new position
        if position == 0:
            if signal > long_threshold:
                position = 1
                entry_price = current_price
                entry_idx = i
            elif signal < short_threshold:
                position = -1
                entry_price = current_price
                entry_idx = i

        # Track equity
        if position != 0:
            unrealized = (current_price / entry_price - 1) * position * capital * 0.5
        else:
            unrealized = 0
        cumulative = sum(t["pnl_usd"] for t in trades) + unrealized
        pnl_history.append(cumulative)

    return trades


def _generate_report(trades: list):
    """Generate backtest report."""
    if not trades:
        print("[BT] No trades to report")
        return

    df = pd.DataFrame(trades)
    total_pnl = df["pnl_usd"].sum()
    win_trades = df[df["pnl_pct"] > 0]
    lose_trades = df[df["pnl_pct"] <= 0]

    win_rate = len(win_trades) / len(df) if len(df) > 0 else 0
    avg_win = win_trades["pnl_pct"].mean() if len(win_trades) > 0 else 0
    avg_loss = lose_trades["pnl_pct"].mean() if len(lose_trades) > 0 else 0

    # Sharpe ratio (simplified)
    returns = df["pnl_pct"].values
    sharpe = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if np.std(returns) > 0 else 0

    # Max drawdown
    cumulative = np.cumsum(returns)
    max_dd = 0
    peak = 0
    for val in cumulative:
        peak = max(peak, val)
        dd = peak - val
        max_dd = max(max_dd, dd)

    print("\n══════════════════════════════════════════")
    print("📊 BACKTEST RESULTS")
    print("══════════════════════════════════════════")
    print(f"   Total Trades:    {len(df)}")
    print(f"   Win Rate:        {win_rate:.1%}")
    print(f"   Avg Win:         {avg_win:.4%}")
    print(f"   Avg Loss:        {avg_loss:.4%}")
    print(f"   Total P&L:       ${total_pnl:,.2f}")
    print(f"   Sharpe Ratio:    {sharpe:.2f}")
    print(f"   Max Drawdown:    {max_dd:.4%}")
    print("══════════════════════════════════════════")

    # Save results
    results_dir = os.path.join(os.path.dirname(__file__), "..", "tests", "backtests", "results")
    os.makedirs(results_dir, exist_ok=True)

    metrics = {
        "total_trades": len(df),
        "win_rate": float(win_rate),
        "avg_win": float(avg_win),
        "avg_loss": float(avg_loss),
        "total_pnl_usd": float(total_pnl),
        "sharpe_ratio": float(sharpe),
        "max_drawdown": float(max_dd),
        "generated_at": datetime.now().isoformat(),
    }

    with open(os.path.join(results_dir, "metrics_summary.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    df.to_csv(os.path.join(results_dir, "trade_log.csv"), index=False)

    print(f"\n✅ Results saved to {results_dir}")


if __name__ == "__main__":
    run_backtest()
