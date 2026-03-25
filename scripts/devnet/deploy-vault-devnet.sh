#!/bin/bash
# scripts/devnet/deploy-vault-devnet.sh
# Full vault deployment on devnet

set -e
echo "=== Deploying vault to devnet ==="

# Ensure wallets exist
bash scripts/devnet/setup-devnet-wallet.sh

cd vault

echo "Step 1: Init vault"
npx ts-node src/scripts/admin-init-vault.ts

echo "Step 2: Add adaptors"
npx ts-node src/scripts/admin-add-adaptors.ts

echo "Step 3: Init strategies"
npx ts-node src/scripts/admin-init-strategies.ts

echo "Step 4: LP metadata"
npx ts-node src/scripts/admin-add-lp-metadata.ts

echo "=== Vault deployment complete ==="
echo "Copy the vault address to .env VAULT_ADDRESS"
