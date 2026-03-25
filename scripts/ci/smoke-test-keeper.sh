#!/bin/bash
# scripts/ci/smoke-test-keeper.sh
# Keeper dry-run (no transactions)

set -e
echo "=== Keeper Smoke Test (Dry Run) ==="

cd keeper

export KEEPER_SECRET="${KEEPER_SECRET:-smoke_test_secret}"
export SIGNAL_SERVER_URL="${SIGNAL_SERVER_URL:-http://localhost:8080}"
export HELIUS_RPC_URL="${HELIUS_RPC_URL:-https://api.devnet.solana.com}"
export DRY_RUN="true"

timeout 10 npx ts-node src/index.ts || EXIT_CODE=$?

if [ "${EXIT_CODE:-0}" = "124" ] || [ "${EXIT_CODE:-0}" = "0" ]; then
  echo "Keeper dry run PASSED"
else
  echo "Keeper dry run FAILED (exit code: $EXIT_CODE)"
  exit 1
fi
