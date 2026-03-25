#!/bin/bash
# scripts/devnet/setup-devnet-wallet.sh
# Create + fund devnet wallet

set -e
echo "=== Setting up devnet wallet ==="

mkdir -p vault/keys keeper/keys

# Generate keypairs if they don't exist
for name in admin manager user; do
  if [ ! -f "vault/keys/${name}.json" ]; then
    solana-keygen new --no-bip39-passphrase --outfile "vault/keys/${name}.json" --force
    echo "Generated vault/keys/${name}.json"
  else
    echo "vault/keys/${name}.json already exists"
  fi
done

if [ ! -f "keeper/keys/agent.json" ]; then
  solana-keygen new --no-bip39-passphrase --outfile "keeper/keys/agent.json" --force
  echo "Generated keeper/keys/agent.json"
else
  echo "keeper/keys/agent.json already exists"
fi

# Fund admin wallet on devnet
solana config set --url devnet
ADMIN_PUBKEY=$(solana-keygen pubkey vault/keys/admin.json)
echo "Admin pubkey: $ADMIN_PUBKEY"
solana airdrop 2 "$ADMIN_PUBKEY" --url devnet || echo "Airdrop may have rate-limited"

MANAGER_PUBKEY=$(solana-keygen pubkey vault/keys/manager.json)
echo "Manager pubkey: $MANAGER_PUBKEY"
solana airdrop 1 "$MANAGER_PUBKEY" --url devnet || echo "Airdrop may have rate-limited"

echo "=== Devnet wallets ready ==="
