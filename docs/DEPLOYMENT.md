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

Every push to `main` triggers the CI pipeline:

```yaml
# .github/workflows/ci-main.yml triggers:
# 1. Structure validation
# 2. Signal engine tests (45 tests)
# 3. Keeper bot tests (36 tests)
# 4. Dashboard build verification
# 5. Integration tests
# 6. Backtest artifact generation
```

### Required Secrets

Set these in **GitHub repo > Settings > Secrets > Actions**:

| Secret | Description |
|--------|-------------|
| `HELIUS_RPC_URL` | Helius RPC endpoint |
| `COINGLASS_API_KEY` | Coinglass API key |
| `KEEPER_SECRET` | Signal server authentication secret |
| `VERCEL_TOKEN` | Vercel deployment token (optional, for CI deploy) |
| `VERCEL_ORG_ID` | Vercel organization ID (optional) |
| `VERCEL_PROJECT_ID` | Vercel project ID (optional) |

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
