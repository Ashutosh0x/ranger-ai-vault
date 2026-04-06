# Deployment Guide

> Production deployment of Ranger AI Vault Dashboard using Vercel, GitHub CLI, and Docker.

---

## Table of Contents

- [Vercel Deployment (Dashboard)](#vercel-deployment-dashboard)
- [Docker Deployment (Backend Services)](#docker-deployment-backend-services)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Environment Variables](#environment-variables)
- [Monitoring & Post-Deploy Checklist](#monitoring--post-deploy-checklist)

---

## Vercel Deployment (Dashboard)

The Ranger AI Vault dashboard is a Next.js 14 application deployed on [Vercel](https://vercel.com) for zero-downtime, globally-distributed hosting.

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| GitHub CLI | 2.0+ | `winget install GitHub.cli` |
| Vercel CLI | 28+ | `npm i -g vercel` |

### Quick Deploy

```bash
# 1. Authenticate with Vercel
vercel login

# 2. Deploy production (from dashboard directory)
cd dashboard
vercel --prod

# 3. Set environment variables
vercel env add NEXT_PUBLIC_HELIUS_RPC_URL
vercel env add NEXT_PUBLIC_VAULT_ADDRESS
vercel env add NEXT_PUBLIC_SIGNAL_ENGINE_URL
```

### GitHub Integration (Auto-Deploy)

Vercel automatically deploys on every push to `main`:

```bash
# 1. Link your GitHub repo to Vercel
vercel link

# 2. Configure in Vercel dashboard:
#    - Root Directory: dashboard
#    - Build Command: npm run build
#    - Output Directory: .next
#    - Install Command: npm install
#    - Node.js Version: 18.x

# 3. Push to trigger deploy
git push origin main
```

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `dashboard` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 18.x |

### Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add vault.ranger.finance

# Or via Vercel dashboard:
# Settings > Domains > Add
```

---

## Docker Deployment (Backend Services)

The signal engine and keeper bot run as Docker containers for production backend operations.

```bash
# From project root
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f signal-engine
docker compose -f docker-compose.prod.yml logs -f keeper
```

### Service Architecture

```
┌──────────────────────────────────────────────────┐
│                   Production Stack                │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Signal Engine │  │  Keeper Bot  │  Docker      │
│  │  (Port 8080)  │  │  (Internal)  │  Host        │
│  └──────────────┘  └──────────────┘              │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────────────────────────┐            │
│  │      Dashboard (Next.js 14)      │  Vercel    │
│  │     ranger-ai-vault.vercel.app   │  Edge      │
│  └──────────────────────────────────┘            │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## GitHub Actions CI/CD

The project uses **15 GitHub Actions workflows** organized into CI, CD, and Security layers.

### CI Pipeline (ci-main.yml)

Every push to `main` or PR triggers the full CI orchestrator:

```
Stage 0: SECURITY --------> 12-layer security audit (security-audit.yml)
Stage 1: VALIDATE --------> File structure + env template check
Stage 2: BUILD (parallel) -> Signal Engine | Keeper | Vault | Dashboard
Stage 3: INTEGRATION -----> Cross-package communication tests
Stage 4: BACKTEST --------> 6-month synthetic backtest + artifacts
Stage 5: SUMMARY ---------> Pass/fail report
```

### Security Audit Pipeline (security-audit.yml)

Production-grade, 12-layer security scanning:

| Layer | Check | Tool |
|-------|-------|------|
| L1 | Secret Detection | Gitleaks + Solana-specific patterns |
| L2a | NPM Supply Chain | `npm audit` (keeper, vault, dashboard) |
| L2b | Rust Supply Chain | `cargo-audit` + `cargo-deny` |
| L3 | SAST | CodeQL (TypeScript) |
| L4 | Solana Hardening | Custom DeFi-logic checks |
| L5 | Rust Security Lint | Clippy + unsafe audit |
| L6 | Docker Security | Hadolint + privilege checks |
| L7 | License Compliance | Copyleft detection |
| L8 | OSSF Scorecard | Supply chain posture |
| L9 | IaC Security | Nginx + Docker Compose audit |
| L10 | Lockfile Integrity | Drift detection |
| L11 | Trivy SCA | Filesystem scan + SBOM |
| L12 | PR Comment Bot | Auto-posts security summary |

### All Workflows

| Workflow | Type | Purpose |
|----------|------|---------|
| `ci-main.yml` | CI | Full pipeline orchestrator |
| `ci-signal-engine.yml` | CI | Rust cargo check, clippy, tests |
| `ci-keeper.yml` | CI | TypeScript compile, Jest, dry run |
| `ci-vault.yml` | CI | Compile, compute budget validation |
| `ci-dashboard.yml` | CI | Next.js build, page validation |
| `ci-integration.yml` | CI | Cross-package integration tests |
| `ci-backtest.yml` | CI | Synthetic backtest + artifacts |
| `security-audit.yml` | Security | 12-layer security pipeline |
| `security-scan.yml` | Security | Wrapper -> security-audit.yml |
| `scorecard.yml` | Security | Wrapper -> security-audit.yml (L8) |
| `validate-structure.yml` | CI | Repo structure validation |
| `cd-docker.yml` | CD | Build + push images to GHCR |
| `cd-dashboard.yml` | CD | Deploy dashboard to Vercel |
| `cd-devnet.yml` | CD | Deploy to Solana devnet |
| `cd-mainnet.yml` | CD | Manual mainnet deployment |

### Required Secrets

Set these in **GitHub repo > Settings > Secrets > Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `HELIUS_RPC_URL` | Yes | Helius RPC endpoint |
| `HELIUS_API_KEY` | For CD | Helius API key (devnet/mainnet deploy) |
| `COINGLASS_API_KEY` | Yes | Coinglass API key |
| `KEEPER_SECRET` | Yes | Signal server authentication secret |
| `DEVNET_ADMIN_KEYPAIR` | For CD | Base58-encoded admin keypair (devnet) |
| `DEVNET_MANAGER_KEYPAIR` | For CD | Base58-encoded manager keypair (devnet) |
| `MAINNET_ADMIN_KEYPAIR` | For CD | Base58-encoded admin keypair (mainnet) |
| `MAINNET_MANAGER_KEYPAIR` | For CD | Base58-encoded manager keypair (mainnet) |
| `VERCEL_TOKEN` | Optional | Vercel deployment token |
| `VERCEL_ORG_ID` | Optional | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Optional | Vercel project ID |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram alert bot token |
| `TELEGRAM_CHAT_ID` | Optional | Telegram chat ID for alerts |

---

## Environment Variables

### Dashboard (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Yes | Helius or Solana RPC endpoint |
| `NEXT_PUBLIC_VAULT_ADDRESS` | Yes | On-chain vault public key |
| `NEXT_PUBLIC_SIGNAL_ENGINE_URL` | No | Signal engine API URL (defaults to localhost:8080) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | No | `devnet` or `mainnet-beta` (defaults to `devnet`) |

### Backend Services (Docker / Environment)

See [.env.example](../.env.example) for the complete list of backend environment variables.

---

## Monitoring & Post-Deploy Checklist

After deploying, verify:

- [ ] Dashboard loads at Vercel URL
- [ ] Wallet connection works (Phantom, Solflare)
- [ ] Theme toggle (dark/light) persists
- [ ] Signal engine health check: `curl https://<signal-url>/health`
- [ ] Keeper bot logs show receipt refresh running
- [ ] GitHub Actions CI passes on latest commit
- [ ] Vercel build succeeds without errors

### Health Check Endpoints

| Service | Endpoint | Expected |
|---------|----------|----------|
| Signal Engine | `GET /health` | `{"status": "healthy"}` |
| Dashboard | `GET /` | 200 OK |
| Dashboard API | `GET /api/health` | `{"status": "ok"}` |

---

## Rollback

### Vercel

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

### Docker

```bash
# Stop and roll back
docker compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

<details>
<summary><strong>Vercel build fails: "Module not found"</strong></summary>

Ensure the Root Directory is set to `dashboard` in Vercel project settings. The `package.json` and `next.config.js` must be in the root of that directory.
</details>

<details>
<summary><strong>Environment variables not available at runtime</strong></summary>

Only variables prefixed with `NEXT_PUBLIC_` are available in the browser. Server-side variables work without the prefix. After adding/changing env vars, trigger a new deployment.
</details>

<details>
<summary><strong>Vercel CLI "not linked" error</strong></summary>

Run `vercel link` in the `dashboard` directory and select the correct project. This creates `.vercel/project.json` with your project and org IDs.
</details>
