#!/bin/bash
# ═══════════════════════════════════════════════════════
# Ranger AI Vault — Register GitHub Secrets
# Usage: GITHUB_REPO=Ashutosh0x/ranger-ai-vault bash scripts/register-github-secrets.sh
# ═══════════════════════════════════════════════════════
set -euo pipefail

REPO="${GITHUB_REPO:-Ashutosh0x/ranger-ai-vault}"

echo "🔐 Registering GitHub Secrets for $REPO"
echo ""

# ── Require gh CLI ─────────────────────────────────────
command -v gh >/dev/null || { echo "❌ Install: gh auth login (GitHub CLI)"; exit 1; }

# ── Check .env file exists ─────────────────────────────
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example and fill in values."
  exit 1
fi

source .env

# ── Register repository-level secrets ──────────────────
echo "📋 Registering repository secrets..."

register_secret() {
  local name=$1
  local value=$2
  if [ -n "$value" ] && [ "$value" != "" ]; then
    echo "$value" | gh secret set "$name" -R "$REPO"
    echo "  ✅ $name"
  else
    echo "  ⚠️  $name — empty, skipping"
  fi
}

register_secret "COINGLASS_API_KEY" "${COINGLASS_API_KEY:-}"
register_secret "HELIUS_API_KEY" "${HELIUS_API_KEY:-}"
register_secret "TELEGRAM_BOT_TOKEN" "${TELEGRAM_BOT_TOKEN:-}"
register_secret "TELEGRAM_CHAT_ID" "${TELEGRAM_CHAT_ID:-}"
register_secret "HELIUS_DEVNET_RPC_URL" "${HELIUS_RPC_URL:-}"

# ── Encode and register keypairs ──────────────────────
echo ""
echo "🔑 Encoding and registering devnet keypairs..."

encode_keypair() {
  local path=$1
  if [ -f "$path" ]; then
    python3 -c "
import json, sys
try:
    import base58
    data = json.load(open('$path'))
    print(base58.b58encode(bytes(data)).decode())
except ImportError:
    import base64
    data = json.load(open('$path'))
    print(base64.b64encode(bytes(data)).decode())
"
  else
    echo ""
  fi
}

register_keypair() {
  local name=$1
  local path=$2
  local encoded
  encoded=$(encode_keypair "$path")
  if [ -n "$encoded" ]; then
    echo "$encoded" | gh secret set "$name" --env devnet -R "$REPO"
    echo "  ✅ $name (from $path)"
  else
    echo "  ⚠️  $name — keypair file $path not found, skipping"
  fi
}

# Create devnet environment if it doesn't exist
gh api -X PUT "repos/$REPO/environments/devnet" 2>/dev/null || true

register_keypair "DEVNET_ADMIN_KEYPAIR" "vault/keys/admin.json"
register_keypair "DEVNET_MANAGER_KEYPAIR" "vault/keys/manager.json"
register_keypair "DEVNET_AGENT_KEYPAIR" "keeper/keys/agent.json"

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ All secrets registered!"
echo ""
echo "Next steps:"
echo "  1. Deploy vault: bash scripts/deploy-devnet.sh"
echo "  2. Fill DEVNET_VAULT_ADDRESS secret after deployment:"
echo "     gh secret set DEVNET_VAULT_ADDRESS --env devnet -R $REPO"
echo "  3. Push to devnet branch: git push origin devnet"
echo "═══════════════════════════════════════════════════"
