#!/bin/bash
# scripts/ci/smoke-test-signal.sh
# Quick signal server health check

set -e
echo "=== Signal Server Smoke Test ==="

cd signal-engine

export KEEPER_SECRET="${KEEPER_SECRET:-smoke_test_secret}"
export COINGLASS_API_KEY="${COINGLASS_API_KEY:-test_key}"

python -m uvicorn src.signal_server:app --host 0.0.0.0 --port 8080 &
SERVER_PID=$!

for i in $(seq 1 20); do
  if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "Server started after ${i}s"
    break
  fi
  sleep 1
done

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
kill $SERVER_PID 2>/dev/null || true

if [ "$HTTP_CODE" = "200" ]; then
  echo "Signal server smoke test PASSED"
else
  echo "Signal server smoke test FAILED (status: $HTTP_CODE)"
  exit 1
fi
