# ═══════════════════════════════════════════════
# Ranger AI Vault — Makefile
# ═══════════════════════════════════════════════

.PHONY: setup keygen deploy-devnet deploy-mainnet signal keeper dashboard start \
        train backtest test-signal test-keeper test-vault test-dashboard test-all \
        ci-local validate docker-build docker-up docker-down docker-logs clean \
        lint format vault-state vault-positions vault-performance help

# ═══ SETUP ═══

setup: ## Install all dependencies
	@echo "═══ Installing Vault dependencies ═══"
	cd vault && npm install
	@echo ""
	@echo "═══ Installing Signal Engine dependencies ═══"
	cd signal-engine && python3 -m pip install -r requirements.txt
	@echo ""
	@echo "═══ Installing Keeper dependencies ═══"
	cd keeper && npm install
	@echo ""
	@echo "═══ Installing Dashboard dependencies ═══"
	cd dashboard && npm install
	@echo ""
	@echo "✅ All dependencies installed"

keygen: ## Generate Solana keypairs (admin, manager, agent)
	@echo "Generating keypairs..."
	@mkdir -p vault/keys keeper/keys
	@if [ ! -f vault/keys/admin.json ]; then \
		solana-keygen new --no-bip39-passphrase -o vault/keys/admin.json; \
		echo "✅ Admin keypair generated"; \
	else \
		echo "⚠️  Admin keypair already exists — skipping"; \
	fi
	@if [ ! -f vault/keys/manager.json ]; then \
		solana-keygen new --no-bip39-passphrase -o vault/keys/manager.json; \
		echo "✅ Manager keypair generated"; \
	else \
		echo "⚠️  Manager keypair already exists — skipping"; \
	fi
	@if [ ! -f keeper/keys/agent.json ]; then \
		solana-keygen new --no-bip39-passphrase -o keeper/keys/agent.json; \
		echo "✅ Agent keypair generated"; \
	else \
		echo "⚠️  Agent keypair already exists — skipping"; \
	fi
	@echo ""
	@echo "Public keys:"
	@echo "  Admin:   $$(solana-keygen pubkey vault/keys/admin.json)"
	@echo "  Manager: $$(solana-keygen pubkey vault/keys/manager.json)"
	@echo "  Agent:   $$(solana-keygen pubkey keeper/keys/agent.json)"

# ═══ DEPLOYMENT ═══

deploy-devnet: ## Deploy vault to devnet (full sequence)
	@echo "═══ Deploying to Devnet ═══"
	@echo "Step 1/6: Creating vault..."
	cd vault && npx ts-node src/scripts/admin-init-vault.ts
	@echo "Step 2/6: Adding adaptors..."
	cd vault && npx ts-node src/scripts/admin-add-adaptors.ts
	@echo "Step 3/6: Initializing strategies..."
	cd vault && npx ts-node src/scripts/admin-init-strategies.ts
	@echo "Step 4/6: Adding LP metadata..."
	cd vault && npx ts-node src/scripts/admin-add-lp-metadata.ts
	@echo "Step 5/6: Enabling direct withdraw..."
	cd vault && npx ts-node src/scripts/admin-init-direct-withdraw.ts
	@echo "Step 6/6: Initial deposit..."
	cd vault && npx ts-node src/scripts/manager-deposit-strategies.ts
	@echo ""
	@echo "✅ Vault deployed to devnet"
	@echo "⚠️  Copy vault + strategy addresses to .env"

deploy-mainnet: ## Deploy vault to mainnet
	@echo "═══ MAINNET DEPLOYMENT ═══"
	@echo "Are you sure? This uses real SOL for fees."
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	SOLANA_CLUSTER=mainnet-beta $(MAKE) deploy-devnet

# ═══ SERVICES ═══

signal: ## Start signal engine (port 8080)
	@echo "═══ Starting Signal Engine ═══"
	cd signal-engine && python -m uvicorn src.signal_server:app \
		--host 0.0.0.0 --port $${SIGNAL_SERVER_PORT:-8080} --reload

keeper: ## Start keeper bot
	@echo "═══ Starting Keeper Bot ═══"
	cd keeper && npx ts-node src/index.ts

dashboard: ## Start dashboard (port 3000)
	@echo "═══ Starting Dashboard ═══"
	cd dashboard && npm run dev

start: ## Start all services (signal + keeper + dashboard)
	@echo "═══ Starting All Services ═══"
	@echo "Starting signal engine in background..."
	cd signal-engine && python -m uvicorn src.signal_server:app \
		--host 0.0.0.0 --port 8080 &
	@sleep 3
	@echo "Starting keeper in background..."
	cd keeper && npx ts-node src/index.ts &
	@sleep 2
	@echo "Starting dashboard..."
	cd dashboard && npm run dev

# ═══ ML ═══

train: ## Train XGBoost models
	@echo "═══ Training ML Models ═══"
	cd signal-engine && python training/train_models.py
	@echo "✅ Models trained and saved to signal-engine/models/saved/"

backtest: ## Run walk-forward backtest
	@echo "═══ Running Backtest ═══"
	cd signal-engine && python training/backtest.py
	@echo ""
	@echo "Results saved to tests/backtests/results/"
	@cat tests/backtests/results/metrics_summary.json 2>/dev/null || echo "No results yet"

# ═══ TESTING ═══

test-signal: ## Run signal engine tests
	@echo "═══ Testing Signal Engine ═══"
	cd signal-engine && python -m pytest tests/ -v --tb=short --cov=src

test-keeper: ## Run keeper tests
	@echo "═══ Testing Keeper ═══"
	cd keeper && npx jest --verbose --forceExit --detectOpenHandles

test-vault: ## Compile vault scripts
	@echo "═══ Compiling Vault Scripts ═══"
	cd vault && npx tsc --noEmit
	@echo "✅ All vault scripts compile"

test-dashboard: ## Build dashboard
	@echo "═══ Building Dashboard ═══"
	cd dashboard && npm run build
	@echo "✅ Dashboard builds successfully"

test-all: test-signal test-keeper test-vault test-dashboard ## Run all tests
	@echo ""
	@echo "✅ All tests passed"

ci-local: ## Run full CI pipeline locally (same as GitHub Actions)
	@echo "═══ Running CI Pipeline Locally ═══"
	@echo ""
	@echo "Stage 1: Structure Validation"
	@bash scripts/ci/validate-structure.sh
	@echo ""
	@echo "Stage 2: Signal Engine"
	@$(MAKE) test-signal
	@echo ""
	@echo "Stage 3: Keeper"
	@$(MAKE) test-keeper
	@echo ""
	@echo "Stage 4: Vault"
	@$(MAKE) test-vault
	@echo ""
	@echo "Stage 5: Dashboard"
	@$(MAKE) test-dashboard
	@echo ""
	@echo "═══ ✅ Local CI Complete — All Checks Passed ═══"

validate: ## Quick import validation (no full build)
	@echo "═══ Quick Validation ═══"
	@cd signal-engine && python -c "from src.signal_server import app; print('✅ Signal server OK')" 2>/dev/null || echo "❌ Signal server import failed"
	@cd keeper && npx ts-node -e "require('./src/config'); console.log('✅ Keeper config OK')" 2>/dev/null || echo "❌ Keeper config import failed"
	@cd vault && npx ts-node -e "require('./src/helper'); console.log('✅ Vault helper OK')" 2>/dev/null || echo "❌ Vault helper import failed"

# ═══ DOCKER ═══

docker-build: ## Build all Docker images
	cd infra/docker && docker compose build

docker-up: ## Start with docker-compose
	cd infra/docker && docker compose up -d
	@echo "✅ Services started"
	@echo "  Signal: http://localhost:8080/health"
	@echo "  Dashboard: http://localhost:3000"

docker-down: ## Stop all containers
	cd infra/docker && docker compose down

docker-logs: ## View all container logs
	cd infra/docker && docker compose logs -f

# ═══ VAULT QUERIES ═══

vault-state: ## Query vault state
	cd vault && npx ts-node src/scripts/query-vault-state.ts

vault-positions: ## Query strategy positions
	cd vault && npx ts-node src/scripts/query-strategy-positions.ts

vault-performance: ## Query vault performance
	cd vault && npx ts-node src/scripts/query-performance.ts

# ═══ UTILITIES ═══

clean: ## Remove build artifacts
	rm -rf vault/node_modules keeper/node_modules dashboard/node_modules
	rm -rf dashboard/.next
	rm -rf signal-engine/venv signal-engine/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleaned"

lint: ## Lint all packages
	cd signal-engine && python -m ruff check src/ training/ tests/ || true
	cd keeper && npx tsc --noEmit || true
	cd vault && npx tsc --noEmit || true

format: ## Format all code
	cd signal-engine && python -m ruff format src/ training/ tests/ || true

# ═══ HELP ═══

help: ## Show this help message
	@echo "Ranger AI Vault — Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
