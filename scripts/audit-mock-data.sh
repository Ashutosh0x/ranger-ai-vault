#!/bin/bash
# ═══════════════════════════════════════════════════════
#  RANGER AI VAULT — ZERO MOCK DATA AUDIT
#  Run before submission: bash scripts/audit-mock-data.sh
# ═══════════════════════════════════════════════════════

set -e

echo "🔍 SCANNING FOR MOCK / PLACEHOLDER DATA..."
echo ""
FAILED=0

# ── 1. Check for unfilled placeholder strings ─────────────
echo "── Checking for unfilled placeholders ──"
for pattern in "FILL_AFTER_DEPLOY" "YOUR_KEY_HERE" "\[VAULT_ADDRESS\]" "\[MANAGER_ADDRESS\]" "\[AGENT_ADDRESS\]"; do
  MATCHES=$(grep -rn "$pattern" \
    --include="*.ts" --include="*.tsx" \
    --include="*.py" --include="*.md" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude="audit-mock-data.sh" \
    . 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "❌ Found '$pattern':"
    echo "$MATCHES"
    FAILED=1
  fi
done
if [ "$FAILED" = "0" ]; then
  echo "✅ No placeholder strings found"
fi

# ── 2. Check model artifacts exist ────────────────────────
echo ""
echo "── Checking model artifacts ──"
MODEL_DIR="signal-engine/models/saved"
if [ -d "$MODEL_DIR" ] && ls "$MODEL_DIR"/*.pkl 1>/dev/null 2>&1; then
  COUNT=$(ls "$MODEL_DIR"/*.pkl 2>/dev/null | wc -l)
  echo "✅ Models: $COUNT .pkl files in $MODEL_DIR"
else
  echo "❌ No trained model .pkl files in $MODEL_DIR"
  echo "   Fix: cd signal-engine && python training/train_models.py"
  FAILED=1
fi

# ── 3. Check backtest results exist ───────────────────────
echo ""
echo "── Checking backtest results ──"
BT_FILE="signal-engine/backtest/results/metrics_summary.json"
if [ -f "$BT_FILE" ]; then
  echo "✅ Backtest results: $BT_FILE exists"
  # Show key metrics
  python3 -c "
import json
with open('$BT_FILE') as f:
    m = json.load(f)
apy = m.get('annualized_return', 0)
sharpe = m.get('sharpe_ratio', 0)
trades = m.get('total_trades', 0)
print(f'   APY: {apy*100:.1f}% | Sharpe: {sharpe:.2f} | Trades: {trades}')
" 2>/dev/null || echo "   (Could not parse metrics)"
else
  echo "❌ No backtest results at $BT_FILE"
  echo "   Fix: cd signal-engine && python backtest/run_backtest.py"
  FAILED=1
fi

# ── 4. Check .env has real values ─────────────────────────
echo ""
echo "── Checking .env for real values ──"
if [ -f ".env" ]; then
  for var in COINGLASS_API_KEY HELIUS_API_KEY VAULT_ADDRESS; do
    VAL=$(grep "^${var}=" .env 2>/dev/null | cut -d= -f2)
    if [ -z "$VAL" ] || [ "$VAL" = "" ]; then
      echo "⚠️  .env: $var is empty"
      FAILED=1
    else
      echo "✅ .env: $var = ${VAL:0:8}..."
    fi
  done
else
  echo "⚠️  No .env file found (copy from .env.example)"
  FAILED=1
fi

# ── 5. Check feature count ───────────────────────────────
echo ""
echo "── Checking feature count ──"
COUNT=$(python3 -c "
import sys
sys.path.insert(0, 'signal-engine')
from src.config import FEATURE_COLUMNS
print(len(FEATURE_COLUMNS))
" 2>/dev/null || echo "0")
if [ "$COUNT" = "17" ]; then
  echo "✅ FEATURE_COLUMNS has 17 features"
else
  echo "❌ FEATURE_COLUMNS has $COUNT features, expected 17"
  FAILED=1
fi

# ── 6. Check all 15 vault scripts exist ──────────────────
echo ""
echo "── Checking vault scripts ──"
SCRIPTS_DIR="vault/src/scripts"
EXPECTED_SCRIPTS=(
  "admin-init-vault" "admin-add-adaptors" "admin-init-strategies"
  "admin-add-lp-metadata" "admin-init-direct-withdraw" "admin-update-config"
  "manager-deposit-strategies" "manager-rebalance" "manager-withdraw-strategies"
  "query-vault-state" "query-strategy-positions" "query-performance"
  "user-deposit-vault" "user-withdraw-vault" "user-direct-withdraw"
)
SCRIPTS_FOUND=0
for script in "${EXPECTED_SCRIPTS[@]}"; do
  if [ -f "$SCRIPTS_DIR/${script}.ts" ]; then
    ((SCRIPTS_FOUND++))
  else
    echo "❌ Missing: $SCRIPTS_DIR/${script}.ts"
    FAILED=1
  fi
done
echo "✅ Vault scripts: $SCRIPTS_FOUND/15 found"

# ── 7. Check docs exist ──────────────────────────────────
echo ""
echo "── Checking documentation ──"
for doc in "README.md" "docs/ARCHITECTURE.md" "docs/ATTESTATION.md" \
           "docs/RISK-FRAMEWORK.md" "docs/SIGNAL-ENGINE.md" \
           "submission/strategy-doc.md" "submission/wallet-addresses.md"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc"
  else
    echo "❌ Missing: $doc"
    FAILED=1
  fi
done

# ── 8. Check CI/CD workflows ─────────────────────────────
echo ""
echo "── Checking CI/CD workflows ──"
WF_DIR=".github/workflows"
WF_COUNT=$(ls "$WF_DIR"/*.yml 2>/dev/null | wc -l)
echo "✅ GitHub workflows: $WF_COUNT files in $WF_DIR"

# ── FINAL VERDICT ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
if [ "$FAILED" = "0" ]; then
  echo "✅ ZERO MOCK DATA — ALL CLEAR FOR SUBMIT"
else
  echo "❌ ISSUES FOUND — FIX BEFORE SUBMIT"
fi
echo "═══════════════════════════════════════════"
