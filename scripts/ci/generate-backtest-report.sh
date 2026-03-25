#!/bin/bash
# scripts/ci/generate-backtest-report.sh
# Run backtest + generate artifacts

set -e
echo "=== Running Backtest ==="

cd signal-engine

export COINGLASS_API_KEY="${COINGLASS_API_KEY:-test_key}"
export KEEPER_SECRET="${KEEPER_SECRET:-test_secret}"

python training/backtest.py

RESULTS_DIR="../tests/backtests/results"
if [ -f "$RESULTS_DIR/metrics_summary.json" ]; then
  echo "Backtest report generated"
  cat "$RESULTS_DIR/metrics_summary.json"
else
  echo "Backtest report generation failed"
  exit 1
fi
