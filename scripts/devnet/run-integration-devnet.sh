#!/bin/bash
# scripts/devnet/run-integration-devnet.sh
# End-to-end test on devnet

set -e
echo "=== Running devnet integration test ==="

# 1. Start signal server
cd signal-engine
python -m uvicorn src.signal_server:app --host 0.0.0.0 --port 8080 &
SIGNAL_PID=$!
cd ..

for i in $(seq 1 30); do
  curl -s http://localhost:8080/health > /dev/null 2>&1 && break
  sleep 1
done

# 2. Query vault state
cd vault
echo "Querying vault state..."
npx ts-node src/scripts/query-vault-state.ts || true
cd ..

# 3. Run keeper single tick (dry run)
cd keeper
export DRY_RUN="true"
timeout 15 npx ts-node src/index.ts || true
cd ..

# Cleanup
kill $SIGNAL_PID 2>/dev/null || true

echo "=== Devnet integration test complete ==="
