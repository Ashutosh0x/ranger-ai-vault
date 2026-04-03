#!/bin/bash
# ═══════════════════════════════════════════════════════
# Ranger AI Vault — Deploy to Devnet
# ═══════════════════════════════════════════════════════
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo "🚀 RANGER AI VAULT — DEVNET DEPLOYMENT"
echo "═══════════════════════════════════════════════════"

# ── Check prerequisites ────────────────────────────────
command -v solana >/dev/null 2>&1 || { echo "❌ Install: solana CLI"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ Install: Node.js + npm"; exit 1; }

# ── Validate .env ──────────────────────────────────────
if [ ! -f .env ]; then
  echo "❌ No .env file found. Copy .env.example to .env and fill in values."
  exit 1
fi
source .env

if [ -z "${HELIUS_API_KEY:-}" ] && [ -z "${HELIUS_RPC_URL:-}" ]; then
  echo "❌ HELIUS_API_KEY or HELIUS_RPC_URL not set in .env"
  exit 1
fi

# ── Generate keypairs if missing ───────────────────────
mkdir -p vault/keys keeper/keys

generate_key() {
  local path=$1
  local name=$2
  if [ ! -f "$path" ]; then
    echo "🔑 Generating $name keypair → $path"
    solana-keygen new --no-passphrase -o "$path" --force
  else
    echo "✅ $name keypair exists: $path"
  fi
  echo "   Address: $(solana-keygen pubkey "$path")"
}

generate_key "vault/keys/admin.json" "Admin"
generate_key "vault/keys/manager.json" "Manager"
generate_key "keeper/keys/agent.json" "Agent"

# ── Configure Solana CLI ───────────────────────────────
RPC_URL="${HELIUS_RPC_URL:-https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY}"
solana config set --url "$RPC_URL"
solana config set --keypair vault/keys/admin.json

echo ""
echo "📡 Network: Devnet"
echo "🔗 RPC: $RPC_URL"

# ── Airdrop SOL ────────────────────────────────────────
echo ""
echo "💰 Requesting devnet SOL airdrops..."

airdrop_wallet() {
  local path=$1
  local name=$2
  local addr=$(solana-keygen pubkey "$path")
  echo "  Airdropping to $name ($addr)..."
  solana airdrop 2 "$addr" --url devnet 2>/dev/null || echo "  ⚠️ Airdrop rate limited, retrying..."
  sleep 3
  solana airdrop 2 "$addr" --url devnet 2>/dev/null || true
  sleep 2
  echo "  Balance: $(solana balance "$addr" --url devnet 2>/dev/null || echo 'unknown')"
}

airdrop_wallet "vault/keys/admin.json" "Admin"
airdrop_wallet "vault/keys/manager.json" "Manager"
airdrop_wallet "keeper/keys/agent.json" "Agent"

# ── Install vault deps ────────────────────────────────
echo ""
echo "📦 Installing vault dependencies..."
cd vault && npm ci 2>/dev/null || npm install
cd ..

# ── Deploy vault scripts ──────────────────────────────
echo ""
echo "🏦 Running vault admin scripts..."

SCRIPTS=(
  "admin-init-vault"
  "admin-add-adaptors"
  "admin-init-strategies"
  "admin-add-lp-metadata"
  "admin-init-direct-withdraw"
  "admin-update-config"
)

for script in "${SCRIPTS[@]}"; do
  echo ""
  echo "  ▶ Running: $script.ts"
  cd vault
  npx ts-node "src/scripts/${script}.ts" 2>&1 | tee "/tmp/ranger-${script}.log" || {
    echo "  ❌ Failed: $script"
    cd ..
    continue
  }
  cd ..
  echo "  ✅ Done: $script"
  sleep 5
done

# ── Query vault state ─────────────────────────────────
echo ""
echo "📊 Querying vault state..."
cd vault
npx ts-node src/scripts/query-vault-state.ts 2>&1 | tee /tmp/ranger-vault-state.json || true
cd ..

# ── Summary ───────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ DEVNET DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Copy vault address from output above → .env VAULT_ADDRESS"
echo "  2. Copy strategy addresses → .env KAMINO/DRIFT_STRATEGY_ADDRESS"
echo "  3. Update submission/wallet-addresses.md"
echo "  4. Update README.md vault address"
echo "  5. Start signal engine: make signal"
echo "  6. Start keeper: make keeper"
echo ""
echo "Verify on Solscan:"
echo "  https://solscan.io/account/$(solana-keygen pubkey vault/keys/admin.json)?cluster=devnet"
echo "═══════════════════════════════════════════════════"
