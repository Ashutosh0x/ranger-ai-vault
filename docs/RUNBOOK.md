# Operational Runbook

> Day-to-day operations, monitoring, and incident response procedures.

---

## Table of Contents

- [Daily Operations](#daily-operations)
- [Monitoring](#monitoring)
- [Incident Response](#incident-response)
- [Maintenance Procedures](#maintenance-procedures)
- [Deployment Procedures](#deployment-procedures)

---

## Daily Operations

### Health Checks

Run these daily to verify system status:

```bash
# 1. Signal engine health
curl http://localhost:8080/health

# 2. Check keeper logs for errors
tail -50 logs/keeper.log | grep -i error

# 3. Check vault state
cd vault && npx ts-node src/scripts/query-vault-state.ts

# 4. Verify receipt refresh is running (should see entries every 5 min)
tail -20 logs/keeper.log | grep "receipt"

# 5. Check Docker container status (if using Docker)
docker compose ps
```

### Expected Log Output (Healthy System)

```
[INFO]  Receipt refreshed: kamino-lending (NAV: $50,234.12)
[INFO]  Receipt refreshed: zeta-perps (NAV: $49,876.43)
[INFO]  Signal fetched: SOL-PERP signal=0.42 confidence=0.65
[INFO]  Signal fetched: BTC-PERP signal=-0.18 confidence=0.52
[INFO]  Risk check: ALL PASS (dd=0.8%, health=62, delta=0.03)
[INFO]  No strong signal -- skipping trade
[INFO]  Rebalance: Kamino 52% / Zeta 48% (delta < $10, no change)
[INFO]  Tick complete: 0 trades, 1 position open
```

---

## Monitoring

### Key Metrics to Watch

| Metric | Normal Range | Warning | Critical |
|--------|-------------|---------|----------|
| Zeta Health | 40-100 | < 30 | < 15 |
| Daily Drawdown | 0-1.5% | > 2% | > 3% |
| Monthly Drawdown | 0-5% | > 6% | > 8% |
| Net Delta | -0.05 to +0.05 | > 0.08 | > 0.10 |
| Leverage | 0-1.5x | > 1.8x | > 2.0x |
| Open Positions | 0-2 | 3 | > 3 (should not happen) |
| Receipt Age | < 5 min | > 10 min | > 30 min |
| Signal Server Latency | < 500ms | > 2s | > 10s |

### Telegram Alert Levels

| Level | Trigger | Action Required |
|-------|---------|----------------|
| INFO | Trade executed, position closed | None (informational) |
| WARNING | Risk metric approaching limit | Monitor closely |
| CRITICAL | Emergency unwind triggered | Immediate investigation |

---

## Incident Response

### IR-1: Emergency Unwind Triggered

**Symptoms:** Telegram CRITICAL alert, all positions closed, 100% in Kamino.

**Investigation:**
```bash
# 1. Check what triggered it
grep "EMERGENCY" logs/keeper.log | tail -5

# 2. Check current vault state
cd vault && npx ts-node src/scripts/query-vault-state.ts

# 3. Verify all positions are actually closed
cd vault && npx ts-node src/scripts/query-strategy-positions.ts
```

**Resolution:**
1. Identify root cause (drawdown breach, health drop, etc.)
2. Wait for market conditions to stabilize
3. Verify risk metrics are back in normal range
4. Restart keeper: `make keeper`

---

### IR-2: Signal Server Down

**Symptoms:** Keeper logs show "Signal fetch failed", vault shifts to Kamino.

**Investigation:**
```bash
# Check if process is running
curl http://localhost:8080/health

# Check Python logs
tail -50 logs/signal.log

# Check if port is in use
netstat -tlnp | grep 8080
```

**Resolution:**
```bash
# Restart signal engine
make signal

# Or with Docker
docker compose restart signal-engine
```

**Impact:** LOW -- vault continues earning Kamino floor yield.

---

### IR-3: RPC Failures

**Symptoms:** Transaction failures, timeouts in keeper logs.

**Investigation:**
```bash
# Test RPC connectivity
curl -X POST $HELIUS_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check Helius status page
# https://status.helius.dev/
```

**Resolution:**
- If temporary: the keeper auto-retries with backoff (3 attempts)
- If persistent: switch to backup RPC in `.env`
- Priority fees auto-escalate on retry

---

### IR-4: Zeta Health Dropping

**Symptoms:** Health monitor warnings, leverage increasing.

**Investigation:**
```bash
# Check current health
grep "health" logs/keeper.log | tail -10

# Check positions and collateral
cd vault && npx ts-node src/scripts/query-strategy-positions.ts
```

**Resolution:**
1. If health < 20: keeper auto-reduces position sizes
2. If health < 15: keeper auto-triggers emergency unwind
3. Manual intervention: reduce `kellyFraction` in `keeper/src/config.ts`
4. Add more collateral to Zeta subaccount if needed

---

## Maintenance Procedures

### Retrain ML Models

Run monthly or when model performance degrades:

```bash
cd signal-engine
source venv/bin/activate
python training/train_models.py --lookback 180
python training/backtest.py

# Verify backtest results
cat ../tests/backtests/results/metrics_summary.json

# If APY > 10% and Sharpe > 1.2: deploy new models
# Restart signal engine to load new models
make signal
```

### Rotate Keypairs

If a keypair is suspected compromised:

```bash
# 1. Stop keeper immediately
# Ctrl+C or: docker compose stop keeper

# 2. Generate new keypair
solana-keygen new --no-bip39-passphrase -o keeper/keys/agent.json

# 3. Update any on-chain references (agent key is attestation-only)

# 4. Restart keeper
make keeper
```

For manager key rotation:
1. Stop keeper
2. Generate new manager keypair
3. Update vault manager authority on-chain (admin operation)
4. Update `.env` with new path
5. Restart keeper

### Update Dependencies

```bash
# Signal engine
cd signal-engine && pip install -r requirements.txt --upgrade

# Keeper + Vault
cd keeper && npm update
cd vault && npm update

# Dashboard
cd dashboard && npm update

# Run all tests after updating
make test-all
```

---

## Deployment Procedures

### Deploy New Version

```bash
# 1. Pull latest code
git pull origin main

# 2. Run tests
make test-all

# 3. Restart services
# Option A: Direct
make start

# Option B: Docker
docker compose build
docker compose up -d
```

### Rollback

```bash
# 1. Find previous working commit
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Restart services
make start
```

### Scale Up

If managing more capital (> $100K):
1. Reduce `kellyFraction` to 0.15
2. Increase `minHealthRate` to 20
3. Consider dedicated Helius plan for higher RPC limits
4. Add Discord webhook alerts alongside Telegram
