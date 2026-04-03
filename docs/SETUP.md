# Setup Guide

> Complete guide to setting up Ranger AI Vault for development and production.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Vault scripts, keeper bot, dashboard |
| Python | 3.10+ | Signal engine, ML models, backtesting |
| Solana CLI | 1.18+ | Keypair generation, devnet/mainnet interaction |
| pnpm or npm | Latest | Node.js package manager |
| Git | 2.30+ | Version control |
| Docker | 24+ | Production deployment (optional) |
| GitHub CLI | 2.0+ | Repository management and deployment |
| Vercel CLI | 28+ | Dashboard production hosting |

### API Keys Required

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Helius](https://helius.dev) | Solana RPC (reliable, fast) | Free Dev Plan |
| [Coinglass](https://coinglass.com/pricing) | Liquidation heatmap data | 30 requests/min |
| [Telegram Bot](https://t.me/BotFather) | Risk alerts (optional) | Free |

---

## 1. Clone and Configure

```bash
git clone https://github.com/Ashutosh0x/ranger-ai-vault.git
cd ranger-ai-vault
cp .env.example .env
```

Edit `.env` with your keys:
- `HELIUS_RPC_URL` — Your Helius RPC endpoint
- `COINGLASS_API_KEY` — Coinglass API key for liquidation data
- `KEEPER_SECRET` — Shared secret for signal server auth
- `VAULT_ADDRESS` — Set after vault deployment
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — Optional alerts

## 2. Install Dependencies

```bash
make setup
```

Or individually:
```bash
cd vault && npm install
cd ../signal-engine && pip install -r requirements.txt
cd ../keeper && npm install
cd ../dashboard && npm install
```

## 3. Generate Keypairs

```bash
make keygen
```

This creates 4 keypairs:
- `vault/keys/admin.json` — Vault creator (cold storage)
- `vault/keys/manager.json` — Fund allocator (warm)
- `vault/keys/user.json` — Depositor (hot)
- `keeper/keys/agent.json` — AI attestation signer

## 4. Deploy Vault (Devnet)

```bash
cd vault
npm run admin:init-vault
# Copy the vault address to .env VAULT_ADDRESS
npm run admin:add-adaptors
npm run admin:init-strategies
npm run admin:lp-metadata
```

## 5. Train Models

```bash
cd signal-engine
pip install -r requirements.txt
python training/train_models.py
python training/backtest.py
```

## 6. Start Services (Development)

```bash
# Terminal 1: Signal Engine
cd signal-engine
python -m uvicorn src.signal_server:app --port 8080

# Terminal 2: Keeper Bot
cd keeper
npx ts-node src/index.ts

# Terminal 3: Dashboard
cd dashboard
npm run dev
```

## 7. Production Deployment

### Dashboard on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Authenticate
vercel login

# Deploy (from dashboard directory)
cd dashboard
vercel --prod
```

Vercel auto-deploys on every push to `main` once linked. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel setup.

### Backend Services with Docker

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 8. Push to GitHub

```bash
# Using GitHub CLI
gh repo view --web                    # Verify repo
git add -A
git commit -m "feat: update docs and deployment"
git push origin main
```

## 9. Run Tests

```bash
# All tests
make test-all

# Individual packages
cd signal-engine && python -m pytest tests/ -v
cd keeper && npx jest --config tests/jest.config.ts
cd dashboard && npm run build
```

---

> **Full deployment details:** [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
