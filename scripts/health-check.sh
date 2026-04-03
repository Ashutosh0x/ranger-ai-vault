#!/bin/bash
# ═══════════════════════════════════════════════════════
# Ranger AI Vault — Health Check
# ═══════════════════════════════════════════════════════
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo "🏥 RANGER AI VAULT — HEALTH CHECK"
echo "═══════════════════════════════════════════════════"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
  local name=$1
  local url=$2
  local response
  
  response=$(curl -sf -w "%{http_code}" -o /tmp/health_response.json "$url" 2>/dev/null) || response="000"
  
  if [ "$response" = "200" ]; then
    echo -e "  ${GREEN}✅${NC} $name — HTTP $response"
    cat /tmp/health_response.json 2>/dev/null | python3 -m json.tool 2>/dev/null | head -5 | sed 's/^/     /'
  else
    echo -e "  ${RED}❌${NC} $name — HTTP $response (DOWN)"
  fi
}

SIGNAL_URL="${SIGNAL_SERVER_URL:-http://localhost:8080}"
DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"

echo ""
echo "Checking services..."
echo ""

check_service "Signal Engine" "$SIGNAL_URL/health"
check_service "Signal - /signals/all" "$SIGNAL_URL/signals/all"
check_service "Signal - /risk" "$SIGNAL_URL/risk"
check_service "Dashboard" "$DASHBOARD_URL"
check_service "Dashboard API" "$DASHBOARD_URL/api/health"

# Check Solana connection
echo ""
if command -v solana &>/dev/null; then
  echo "  Solana CLI:"
  BALANCE=$(solana balance 2>/dev/null || echo "NOT CONNECTED")
  echo -e "    Balance: $BALANCE"
  NETWORK=$(solana config get | grep "RPC URL" | awk '{print $NF}')
  echo -e "    Network: $NETWORK"
fi

echo ""
echo "═══════════════════════════════════════════════════"
