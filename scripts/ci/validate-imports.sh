#!/bin/bash
# scripts/ci/validate-imports.sh
# Check no broken imports across packages

set -e
echo "=== Validating import chains ==="
ERRORS=0

echo "-- Signal Engine --"
cd signal-engine
python -c "
from src.signal_server import app
from src.features.indicators import *
from src.models.momentum_model import *
from src.risk.var_calculator import *
print('Signal engine imports OK')
" || ERRORS=$((ERRORS + 1))
cd ..

echo "-- Keeper --"
cd keeper
npx ts-node -e "
require('./src/config');
require('./src/core/state-manager');
require('./src/monitoring/logger');
require('./src/monitoring/metrics');
require('./src/monitoring/alerter');
console.log('Keeper imports OK');
" 2>/dev/null || ERRORS=$((ERRORS + 1))
cd ..

echo "-- Vault --"
cd vault
npx ts-node -e "
require('./src/helper');
require('./src/variables');
require('./src/types');
console.log('Vault imports OK');
" 2>/dev/null || ERRORS=$((ERRORS + 1))
cd ..

if [ $ERRORS -gt 0 ]; then
  echo "$ERRORS packages have import errors"
  exit 1
fi
echo "All imports resolve"
