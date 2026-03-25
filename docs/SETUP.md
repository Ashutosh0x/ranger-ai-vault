# Setup Guide

## Prerequisites
- Node.js 18+
- pnpm (npm install -g pnpm)
- Python 3.10+
- Solana CLI (optional, for keypair generation)
- Docker + Docker Compose (for production deployment)

## 1. Clone and Configure

```bash
git clone <repo-url> ranger && cd ranger
cp .env.example .env
```

Edit `.env` with your keys:
- `HELIUS_RPC_URL` -- Your Helius RPC endpoint
- `COINGLASS_API_KEY` -- Coinglass API key for liquidation data
- `KEEPER_SECRET` -- Shared secret for signal server auth
- `VAULT_ADDRESS` -- Set after vault deployment
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` -- Optional alerts

## 2. Install Dependencies

```bash
make setup
```

Or individually:
```bash
cd vault && pnpm install
cd ../signal-engine && pip install -r requirements.txt
cd ../keeper && pnpm install
cd ../dashboard && pnpm install
```

## 3. Generate Keypairs

```bash
make keygen
```

This creates 4 keypairs:
- `vault/keys/admin.json` -- Vault creator (cold storage)
- `vault/keys/manager.json` -- Fund allocator (warm)
- `vault/keys/user.json` -- Depositor (hot)
- `keeper/keys/agent.json` -- AI attestation signer

## 4. Deploy Vault (Devnet)

```bash
cd vault
pnpm admin:init-vault
# Copy the vault address to .env VAULT_ADDRESS
pnpm admin:add-adaptors
pnpm admin:init-strategies
pnpm admin:lp-metadata
```

## 5. Train Models

```bash
cd signal-engine
pip install -r requirements.txt
python training/train_models.py
python training/backtest.py
```

## 6. Start Services

```bash
# Terminal 1: Signal Engine
cd signal-engine
python -m uvicorn src.signal_server:app --port 8080

# Terminal 2: Keeper Bot
cd keeper
npx ts-node src/index.ts

# Terminal 3: Dashboard
cd dashboard
pnpm dev
```

## 7. Docker Production Deploy

```bash
cd infra/docker
docker-compose up -d
```

## 8. Run Tests

```bash
# Signal engine tests
cd signal-engine && python -m pytest tests/ -v

# Keeper tests
npx jest --config tests/jest.config.ts
```
