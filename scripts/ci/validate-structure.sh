#!/bin/bash
# scripts/ci/validate-structure.sh
# Run locally: bash scripts/ci/validate-structure.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

MISSING=0
FOUND=0

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    FOUND=$((FOUND + 1))
  else
    echo -e "${RED}❌${NC} $1"
    MISSING=$((MISSING + 1))
  fi
}

echo "═══════════════════════════════════════"
echo "  Ranger AI Vault — Structure Check"
echo "═══════════════════════════════════════"
echo ""

echo "── Root Files ──"
check_file ".gitignore"
check_file ".env.example"
check_file "Makefile"
check_file "README.md"

echo ""
echo "── Vault Package ──"
check_file "vault/package.json"
check_file "vault/tsconfig.json"
check_file "vault/src/helper.ts"
check_file "vault/src/variables.ts"
check_file "vault/src/types.ts"
check_file "vault/src/constants/drift.ts"
check_file "vault/src/constants/kamino.ts"
check_file "vault/src/constants/tokens.ts"
check_file "vault/src/constants/ranger.ts"

echo ""
echo "── Vault Scripts (15 expected) ──"
for s in admin-init-vault admin-add-adaptors admin-init-strategies \
         admin-add-lp-metadata admin-update-config admin-init-direct-withdraw \
         manager-deposit-strategies manager-withdraw-strategies manager-rebalance \
         user-deposit-vault user-withdraw-vault user-direct-withdraw \
         query-vault-state query-strategy-positions query-performance; do
  check_file "vault/src/scripts/${s}.ts"
done

echo ""
echo "── Signal Engine ──"
check_file "signal-engine/requirements.txt"
check_file "signal-engine/src/__init__.py"
check_file "signal-engine/src/config.py"
check_file "signal-engine/src/signal_server.py"
check_file "signal-engine/src/data/__init__.py"
check_file "signal-engine/src/data/coinglass_fetcher.py"
check_file "signal-engine/src/data/drift_fetcher.py"
check_file "signal-engine/src/data/helius_fetcher.py"
check_file "signal-engine/src/data/pyth_fetcher.py"
check_file "signal-engine/src/data/data_store.py"
check_file "signal-engine/src/features/__init__.py"
check_file "signal-engine/src/features/feature_engineer.py"
check_file "signal-engine/src/features/indicators.py"
check_file "signal-engine/src/features/liquidation_features.py"
check_file "signal-engine/src/models/__init__.py"
check_file "signal-engine/src/models/momentum_model.py"
check_file "signal-engine/src/models/meanrev_model.py"
check_file "signal-engine/src/models/ensemble.py"
check_file "signal-engine/src/models/model_registry.py"
check_file "signal-engine/src/risk/__init__.py"
check_file "signal-engine/src/risk/var_calculator.py"
check_file "signal-engine/src/risk/position_sizer.py"
check_file "signal-engine/src/risk/drawdown_monitor.py"
check_file "signal-engine/src/risk/delta_monitor.py"
check_file "signal-engine/training/train_models.py"
check_file "signal-engine/training/backtest.py"

echo ""
echo "── Signal Engine Tests ──"
check_file "signal-engine/tests/__init__.py"
check_file "signal-engine/tests/conftest.py"
check_file "signal-engine/tests/test_features.py"
check_file "signal-engine/tests/test_models.py"
check_file "signal-engine/tests/test_risk.py"
check_file "signal-engine/tests/test_signal_server.py"
check_file "signal-engine/tests/test_data_fetchers.py"

echo ""
echo "── Keeper (22 expected) ──"
check_file "keeper/package.json"
check_file "keeper/tsconfig.json"
check_file "keeper/jest.config.ts"
check_file "keeper/src/index.ts"
check_file "keeper/src/config.ts"
check_file "keeper/src/types.ts"
check_file "keeper/src/core/keeper-loop.ts"
check_file "keeper/src/core/signal-client.ts"
check_file "keeper/src/core/state-manager.ts"
check_file "keeper/src/core/rebalance-engine.ts"
check_file "keeper/src/execution/drift-executor.ts"
check_file "keeper/src/execution/vault-allocator.ts"
check_file "keeper/src/execution/jupiter-executor.ts"
check_file "keeper/src/execution/emergency-unwind.ts"
check_file "keeper/src/attestation/ai-attestation.ts"
check_file "keeper/src/attestation/attestation-verifier.ts"
check_file "keeper/src/risk/risk-checker.ts"
check_file "keeper/src/risk/position-tracker.ts"
check_file "keeper/src/risk/drift-health-monitor.ts"
check_file "keeper/src/monitoring/logger.ts"
check_file "keeper/src/monitoring/metrics.ts"
check_file "keeper/src/monitoring/alerter.ts"

echo ""
echo "── Keeper Tests ──"
check_file "keeper/tests/risk-checker.test.ts"
check_file "keeper/tests/drift-executor.test.ts"
check_file "keeper/tests/attestation.test.ts"
check_file "keeper/tests/vault-allocator.test.ts"
check_file "keeper/tests/keeper-loop.test.ts"
check_file "keeper/tests/metrics.test.ts"
check_file "keeper/tests/state-manager.test.ts"

echo ""
echo "── Dashboard ──"
check_file "dashboard/package.json"
check_file "dashboard/next.config.js"
check_file "dashboard/tailwind.config.js"
check_file "dashboard/tsconfig.json"

echo ""
echo "── Docs & Submission ──"
check_file "docs/ARCHITECTURE.md"
check_file "docs/SETUP.md"
check_file "docs/RISK-FRAMEWORK.md"
check_file "submission/strategy-doc.md"

echo ""
echo "── Infrastructure ──"
check_file "infra/docker/docker-compose.yml"
check_file "infra/docker/Dockerfile.signal"
check_file "infra/docker/Dockerfile.keeper"
check_file "infra/docker/Dockerfile.dashboard"

echo ""
echo "── CI/CD ──"
check_file ".github/workflows/ci-main.yml"
check_file ".github/workflows/ci-signal-engine.yml"
check_file ".github/workflows/ci-keeper.yml"
check_file ".github/workflows/ci-vault.yml"
check_file ".github/workflows/ci-dashboard.yml"
check_file ".github/workflows/ci-integration.yml"
check_file ".github/workflows/ci-backtest.yml"
check_file ".github/actions/setup-solana/action.yml"
check_file ".github/CODEOWNERS"

echo ""
echo "── Integration Tests ──"
check_file "tests/integration/test_full_flow.ts"
check_file "tests/integration/test_vault_lifecycle.ts"
check_file "tests/integration/test_emergency_unwind.ts"

echo ""
echo "═══════════════════════════════════════"
echo -e "  Found: ${GREEN}${FOUND}${NC}  Missing: ${RED}${MISSING}${NC}"
echo "═══════════════════════════════════════"

if [ $MISSING -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  $MISSING files missing — fix before pushing${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}✅ All files present — ready to push${NC}"
fi
