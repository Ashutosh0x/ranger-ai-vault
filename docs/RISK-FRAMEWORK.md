# Risk Framework

## Overview
The vault enforces a multi-layered risk management system that operates
at three levels: signal engine (Python), keeper bot (TypeScript), and
on-chain (Voltr SDK constraints).

## Risk Parameters

| Parameter               | Value  | Description                       |
|------------------------|--------|-----------------------------------|
| Max Daily Drawdown     | 3%     | Halts trading for remainder of day|
| Max Monthly Drawdown   | 8%     | Halts trading for remainder of month|
| Max Leverage           | 2x     | Per-position limit                |
| Max Net Delta          | 0.10   | Portfolio neutrality target       |
| Stop Loss              | -0.5%  | Per-trade automatic exit          |
| Take Profit            | 1.5%   | Per-trade automatic exit          |
| Kelly Fraction         | 0.25   | Quarter-Kelly for safety          |
| Max Concurrent Positions| 3     | Caps exposure                     |
| Min Confidence         | 0.4    | Below this, no trades taken       |
| Zeta Health Warning   | 20     | Start reducing positions          |
| Zeta Health Critical  | 10     | Emergency unwind all              |
| Kamino Floor           | 40%    | Minimum % in lending (safe yield) |

## Layer 1: Signal Engine Risk (Python)

### VaR Calculator
- Historical VaR at 95% confidence level
- Conditional VaR (Expected Shortfall) for tail risk
- Threshold check before each signal generation

### Position Sizer
- Kelly criterion with fractional (0.25x) scaling
- Adjusts size downward based on current drawdown
- Caps at 40% of active trading capital per position

### Drawdown Monitor
- Tracks intraday and monthly drawdown vs peak NAV
- Triggers halt when limits breached
- Automatic daily/monthly period resets

### Delta Monitor
- Tracks net portfolio delta across all positions
- Signals hedging requirements when delta exceeds 0.10
- Used by keeper to trigger Jupiter spot hedges

## Layer 2: Keeper Bot Risk (TypeScript)

### Pre-Trade Risk Checker
Every trade must pass 6 checks before execution:
1. Daily drawdown within limit
2. Monthly drawdown within limit
3. Net delta within limit
4. Position count under max concurrent
5. No duplicate asset position
6. Confidence above minimum threshold

### Position Tracker
- Tracks entry prices and unrealized PnL per position
- Enforces per-trade stop-loss (-0.5%) and take-profit (+1.5%)
- Automatically closes positions that breach limits

### Zeta Health Monitor
- Real ZetaUser.getHealth() calls every tick
- Health < 20: start reducing positions proportionally
- Health < 10: emergency unwind ALL positions
- Prevents Zeta liquidation events

### Emergency Unwind
Triggered by any of:
- Zeta health critical
- Daily/monthly drawdown breach
- Signal server failure (prolonged)

Sequence:
1. Close all Zeta perp positions
2. Sell spot hedge positions back to USDC
3. Move all vault funds to Kamino lending
4. Send Telegram alert

## Layer 3: On-Chain Controls

### Ed25519 Attestation
- Every trade TX includes Ed25519 signature from agent keypair
- Vault program verifies signature before execution
- Prevents rogue or unauthorized trades

### Role-Based Access
- Admin: deploy vault, add adaptors (cold storage)
- Manager: allocate funds between strategies (warm)
- User: deposit/withdraw USDC (hot)
- Agent: sign trade instructions only (keeper)

### Voltr Strategy Receipts
- Receipt values refreshed every 5 minutes
- Ensures accurate NAV and LP token pricing
- Prevents stale accounting from zeta in values
