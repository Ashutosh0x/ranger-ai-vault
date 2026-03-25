#!/bin/bash
# scripts/ci/validate-env.sh
# Check all required env vars exist in .env.example

set -e

echo "=== Validating .env.example ==="

REQUIRED_VARS=(
  "HELIUS_RPC_URL"
  "COINGLASS_API_KEY"
  "KEEPER_SECRET"
  "VAULT_ADDRESS"
  "ADMIN_KEYPAIR_PATH"
  "MANAGER_KEYPAIR_PATH"
  "AGENT_KEYPAIR_PATH"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "$var" .env.example; then
    echo "OK $var"
  else
    echo "MISSING $var"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo "$MISSING vars missing from .env.example"
  exit 1
fi
echo "All required env vars present"
