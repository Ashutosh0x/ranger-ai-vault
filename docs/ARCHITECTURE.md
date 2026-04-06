# Ranger AI Vault — System Architecture

> Complete technical architecture documentation with visual diagrams for every subsystem.

---

## Table of Contents

- [System Overview](#1-system-overview)
- [Vault Architecture](#2-vault-architecture)
- [Signal Engine Pipeline](#3-signal-engine-pipeline)
- [Keeper Bot Architecture](#4-keeper-bot-architecture)
- [Data Flow](#5-data-flow)
- [Risk Framework](#6-risk-framework)
- [Ed25519 Attestation Flow](#7-ed25519-attestation-flow)
- [Rebalance Engine Loops](#8-rebalance-engine-loops)
- [Trade Execution Flow](#9-trade-execution-flow)
- [Dashboard Architecture](#10-dashboard-architecture)
- [Deployment Architecture](#11-deployment-architecture)
- [Network & Protocol Interactions](#12-network--protocol-interactions)
- [State Machine](#13-state-machine)
- [Security Model](#14-security-model)
- [Package Dependency Graph](#15-package-dependency-graph)
- [Database & Storage](#16-database--storage)
- [Failure Modes & Recovery](#17-failure-modes--recovery)
- [Sequence Diagrams](#18-sequence-diagrams)

---

## 1. System Overview

The complete system spanning on-chain programs, off-chain services, external APIs, and the user-facing dashboard.

```mermaid
graph TB
 subgraph Users[" Users"]
 Depositor["Depositor<br/>(USDC → LP tokens)"]
 Manager["Vault Manager<br/>(Fund allocation)"]
 Admin["Vault Admin<br/>(Configuration)"]
 Judge["Judge / Viewer<br/>(Dashboard + Solscan)"]
 end

 subgraph Dashboard[" Dashboard (Next.js 14)"]
 UI["7 Pages:<br/>Overview | Vault | Signals<br/>Positions | Risk | Backtest | Logs"]
 API["API Routes:<br/>/vault-state | /signal<br/>/positions | /health"]
 end

 subgraph OffChain[" Off-Chain Services"]
 subgraph SignalEngine[" Signal Engine (Python)"]
 DataLayer["Data Layer<br/>Coinglass | Zeta API<br/>Pyth | Helius"]
 FeatureEng["Feature Engineer<br/>17 features"]
 MLModels["XGBoost Ensemble<br/>Momentum (40%)<br/>Mean-Rev (60%)"]
 RiskCalc["Risk Calculator<br/>VaR | Kelly | DD"]
 FastAPI["FastAPI Server<br/>:8080 (authenticated)"]
 end

 subgraph KeeperBot[" Keeper Bot (TypeScript)"]
 KeeperLoop["Main Loop<br/>(every 15 min)"]
 RebalanceEng["Rebalance Engine<br/>3 loops"]
 Execution["Execution Layer<br/>Zeta | Jupiter | Vault"]
 Attestation["Ed25519<br/>Attestation"]
 RiskCheck["Risk Checker<br/>6 layers"]
 Monitoring["Monitoring<br/>Logger | Metrics | Alerts"]
 end
 end

 subgraph Solana[" Solana Blockchain"]
 subgraph Vault[" Ranger Vault (Voltr)"]
 VaultProgram["Vault Program<br/>USDC base asset<br/>LP token mint"]
 Strategy1["Strategy 1<br/>Kamino Lending<br/>(Floor Yield)"]
 Strategy2["Strategy 2<br/>Zeta Lend<br/>(Fallback)"]
 Strategy3["Strategy 3<br/>Zeta Perps<br/>(Active Trading)"]
 end

 subgraph Protocols[" DeFi Protocols"]
 Zeta["Zeta Markets<br/>SOL-PERP | BTC-PERP<br/>ETH-PERP"]
 Kamino["Kamino Finance<br/>USDC Lending<br/>Farm Rewards"]
 Jupiter["Jupiter<br/>Spot Swaps<br/>Reward Swaps"]
 end

 subgraph Oracles[" Oracles"]
 Pyth["Pyth Network<br/>SOL | BTC | ETH<br/>Price Feeds"]
 end
 end

 subgraph ExternalAPIs[" External APIs"]
 Coinglass["Coinglass<br/>Liquidation Heatmap<br/>OI | Funding"]
 ZetaAPI["Zeta Data API<br/>Historical Funding<br/>OHLCV"]
 HeliusAPI["Helius RPC<br/>Transaction Data<br/>Account Updates"]
 end

 Depositor -->|"deposit USDC"| VaultProgram
 Depositor -->|"view vault"| UI
 Manager -->|"allocate funds"| VaultProgram
 Admin -->|"configure vault"| VaultProgram
 Judge -->|"verify on-chain"| Solana
 Judge -->|"view dashboard"| UI

 UI --> API
 API -->|"RPC queries"| Solana
 API -->|"signal proxy"| FastAPI

 DataLayer -->|"raw data"| FeatureEng
 FeatureEng -->|"17 features"| MLModels
 MLModels -->|"signal + confidence"| FastAPI
 RiskCalc -->|"risk state"| FastAPI

 Coinglass -->|"liq heatmap"| DataLayer
 ZetaAPI -->|"funding rates"| DataLayer
 HeliusAPI -->|"tx data"| DataLayer
 Pyth -->|"prices"| DataLayer

 FastAPI -->|"HTTP (auth)"| KeeperLoop
 KeeperLoop --> RiskCheck
 RiskCheck -->|"pass"| Execution
 RiskCheck -->|"breach"| Execution
 KeeperLoop --> RebalanceEng
 Execution -->|"sign"| Attestation
 Attestation -->|"attested TX"| Solana
 Monitoring -->|"alerts"| Users

 VaultProgram -->|"CPI"| Strategy1
 VaultProgram -->|"CPI"| Strategy2
 VaultProgram -->|"CPI"| Strategy3
 Strategy1 -->|"Kamino Adaptor"| Kamino
 Strategy2 -->|"Zeta Adaptor"| Zeta
 Strategy3 -->|"Zeta Adaptor"| Zeta
 Execution -->|"Zeta SDK"| Zeta
 Execution -->|"Jupiter API"| Jupiter
 Execution -->|"Voltr SDK"| VaultProgram

 classDef userNode fill:#f9f,stroke:#333,stroke-width:2px
 classDef onchain fill:#9f9,stroke:#333,stroke-width:2px
 classDef offchain fill:#99f,stroke:#333,stroke-width:2px
 classDef external fill:#ff9,stroke:#333,stroke-width:2px
 classDef dashboard fill:#f99,stroke:#333,stroke-width:2px

 class Depositor,Manager,Admin,Judge userNode
 class VaultProgram,Strategy1,Strategy2,Strategy3,Zeta,Kamino,Jupiter,Pyth onchain
 class SignalEngine,KeeperBot,KeeperLoop,RebalanceEng,Execution,Attestation,RiskCheck,Monitoring,DataLayer,FeatureEng,MLModels,RiskCalc,FastAPI offchain
 class Coinglass,ZetaAPI,HeliusAPI external
 class UI,API dashboard
```

---

## 2. Vault Architecture

The on-chain vault structure showing the Voltr SDK integration, adaptor pattern, and role-based access control.

```mermaid
graph TB
 subgraph VaultStructure[" Ranger Earn Vault"]
 subgraph Roles["Role-Based Access Control"]
 AdminRole[" Admin<br/>• Create vault<br/>• Add adaptors<br/>• Init strategies<br/>• Update config<br/>• Set fees"]
 ManagerRole[" Manager<br/>• Deposit to strategies<br/>• Withdraw from strategies<br/>• Rebalance allocation<br/>• Execute trades via adaptor"]
 UserRole[" User<br/>• Deposit USDC<br/>• Receive LP tokens<br/>• Withdraw USDC<br/>• Direct withdraw"]
 end

 subgraph VaultCore["Vault Core"]
 VaultAccount["Vault Account (PDA)<br/>base_asset: USDC<br/>total_assets: $X<br/>total_shares: X LP<br/>performance_fee: 10%<br/>management_fee: 1%<br/>max_cap: $1M<br/>withdrawal_period: 24h"]
 LPMint["LP Token Mint<br/>name: AI Vault LP<br/>symbol: aiVLT<br/>decimals: 6<br/>supply: dynamic"]
 TokenAccount["Vault Token Account<br/>mint: USDC<br/>balance: idle funds"]
 end

 subgraph Adaptors["Adaptor Layer"]
 ZetaAdaptor["Zeta Adaptor<br/>EBN93eXs5fHG..."]
 KaminoAdaptor["Kamino Adaptor"]
 end

 subgraph Strategies["Three Strategies"]
 S1["Strategy 1: Kamino USDC Lending<br/>Target: 50% | Floor Yield<br/>Expected: 4-12% APY"]
 S2["Strategy 2: Zeta USDC Lending<br/>Target: 0% (fallback)<br/>Expected: 3-8% APY"]
 S3["Strategy 3: Zeta Perps Trading<br/>Target: 50% | Active Engine<br/>Expected: 15-40% APY"]
 end
 end

 subgraph OnChainProtocols["On-Chain Protocols"]
 KaminoProtocol["Kamino Finance<br/>USDC Lending Market"]
 ZetaProtocol["Zeta Markets<br/>SOL-PERP (0) | BTC-PERP (1) | ETH-PERP (2)"]
 end

 AdminRole -->|"createInitializeVaultIx"| VaultAccount
 AdminRole -->|"createAddAdaptorIx"| ZetaAdaptor
 AdminRole -->|"createAddAdaptorIx"| KaminoAdaptor
 ManagerRole -->|"deposit/withdraw"| Strategies
 UserRole -->|"deposit USDC"| TokenAccount
 TokenAccount -->|"mint LP"| LPMint

 S1 -->|"CPI via Kamino Adaptor"| KaminoAdaptor
 S2 -->|"CPI via Zeta Adaptor"| ZetaAdaptor
 S3 -->|"CPI via Zeta Adaptor"| ZetaAdaptor
 KaminoAdaptor --> KaminoProtocol
 ZetaAdaptor --> ZetaProtocol

 VaultAccount -.->|"receipt refresh (5 min)"| S1
 VaultAccount -.->|"receipt refresh"| S2
 VaultAccount -.->|"receipt refresh"| S3

 classDef admin fill:#ff6b6b,stroke:#333,color:#fff
 classDef manager fill:#ffa500,stroke:#333,color:#fff
 classDef user fill:#4ecdc4,stroke:#333,color:#fff
 classDef strategy fill:#45b7d1,stroke:#333,color:#fff
 classDef adaptor fill:#96ceb4,stroke:#333

 class AdminRole admin
 class ManagerRole manager
 class UserRole user
 class S1,S2,S3 strategy
 class ZetaAdaptor,KaminoAdaptor adaptor
```

---

## 3. Signal Engine Pipeline

The complete ML pipeline from raw data ingestion to signal output.

```mermaid
graph LR
 subgraph DataSources[" Data Sources"]
 CG["Coinglass API<br/>GET /liqHeatmap<br/>Rate: 30/min"]
 DA["Zeta Data API<br/>GET /fundingRates<br/>GET /candles"]
 PY["Pyth Network<br/>SOL/USD | BTC/USD<br/>ETH/USD"]
 HE["Helius RPC<br/>getTransaction<br/>getAccountInfo"]
 end

 subgraph Fetchers[" Data Fetchers"]
 CF["coinglass_fetcher.py<br/>Rate limiting + Retry"]
 DF["zeta_fetcher.py<br/>Funding + OI + OHLCV"]
 PF["pyth_fetcher.py<br/>Real-time prices"]
 HF["helius_fetcher.py<br/>Enhanced TX data"]
 end

 subgraph Cache[" Data Store"]
 DS["data_store.py<br/>Parquet cache"]
 end

 subgraph Features[" Feature Engineering"]
 LF["liquidation_features.py<br/>7 Coinglass features"]
 TI["indicators.py<br/>BB | RSI | VWAP | ATR | MACD"]
 FE["feature_engineer.py<br/>Combines into 17-feature vector"]
 end

 subgraph Models[" ML Models"]
 MM["momentum_model.py<br/>XGBRegressor<br/>Weight: 40%"]
 MR["meanrev_model.py<br/>XGBRegressor<br/>Weight: 60%"]
 EN["ensemble.py<br/>signal = 0.4×mom + 0.6×rev<br/>+ regime adjustment"]
 end

 subgraph RiskEngine[" Risk Engine"]
 VC["var_calculator.py<br/>95% 1-day VaR: -2%"]
 PS["position_sizer.py<br/>Kelly: 0.25 fraction"]
 DM["drawdown_monitor.py<br/>Daily: 3% | Monthly: 8%"]
 DL["delta_monitor.py<br/>Net delta: ±0.10"]
 end

 subgraph Output[" Signal Server"]
 SS["signal_server.py<br/>FastAPI :8080<br/>Auth: X-Keeper-Secret"]
 end

 CG --> CF --> DS
 DA --> DF --> DS
 PY --> PF --> DS
 HE --> HF --> DS

 DS --> LF --> FE
 DS --> TI --> FE

 FE -->|"17 features"| MM
 FE -->|"17 features"| MR

 MM -->|"momentum signal"| EN
 MR -->|"mean-rev signal"| EN

 EN --> SS
 VC --> SS
 PS --> SS
 DM --> SS
 DL --> SS

 classDef source fill:#fff3cd,stroke:#856404
 classDef model fill:#cce5ff,stroke:#004085
 classDef risk fill:#f8d7da,stroke:#721c24
 classDef output fill:#e2d5f1,stroke:#5a2d82

 class CG,DA,PY,HE source
 class MM,MR,EN model
 class VC,PS,DM,DL risk
 class SS output
```

---

## 4. Keeper Bot Architecture

Internal architecture of the keeper bot showing all modules and their interactions.

```mermaid
graph TB
 subgraph Entry[" Entry Point"]
 Index["index.ts<br/>Init clients + Start 3 loops"]
 end

 subgraph Core[" Core"]
 KL["keeper-loop.ts<br/>Every 15 min: Fetch → Risk → Trade → Rebalance"]
 SC["signal-client.ts<br/>HTTP to signal server (auth + retry)"]
 SM["state-manager.ts<br/>Positions + P&L + Allocation"]
 RE["rebalance-engine.ts<br/>3 Loops: Receipt (5m) | Compound (1h) | Signal (15m)"]
 end

 subgraph Execution[" Execution"]
 DE["zeta-executor.ts<br/>open/close/getPosition/getOraclePrice"]
 VA["vault-allocator.ts<br/>allocateFromSignal/emergencyFullUnwind"]
 JE["jupiter-executor.ts<br/>buySpot/sellSpot (Jupiter V6)"]
 EU["emergency-unwind.ts<br/>Close all → Sell spot → Kamino → Alert"]
 end

 subgraph AttestationLayer[" Attestation"]
 AA["ai-attestation.ts<br/>Ed25519 sign every trade IX"]
 AV["attestation-verifier.ts<br/>Verify + audit trail"]
 end

 subgraph Risk[" Risk Management"]
 RC["risk-checker.ts<br/>DD < 3% | Leverage < 2x | Delta < 0.10"]
 PT["position-tracker.ts<br/>SL: -0.5% | TP: +1.5%"]
 DH["zeta-health-monitor.ts<br/>Health 0-100 | Risk level enum"]
 end

 subgraph Monitor[" Monitoring"]
 LG["logger.ts (Winston)"]
 MT["metrics.ts (Sharpe/Win rate)"]
 AL["alerter.ts (Telegram)"]
 end

 Index --> KL
 Index --> RE
 KL --> SC
 KL --> SM
 KL --> RC

 SC -->|"GET /signal"| SignalServer["Signal Server :8080"]

 RC -->|" pass"| DE
 RC -->|" breach"| EU
 PT -->|"stop-loss"| DE
 DH -->|"health < 15"| EU

 DE -->|"trade IX"| AA
 AA -->|"attested TX"| Solana[" Solana"]
 VA --> RE
 KL --> LG
 KL --> MT
 EU --> AL

 classDef core fill:#4a90d9,stroke:#333,color:#fff
 classDef exec fill:#e67e22,stroke:#333,color:#fff
 classDef risk fill:#e74c3c,stroke:#333,color:#fff
 classDef monitor fill:#27ae60,stroke:#333,color:#fff

 class KL,SC,SM,RE core
 class DE,VA,JE,EU exec
 class RC,PT,DH risk
 class LG,MT,AL monitor
```

---

## 5. Data Flow

End-to-end data flow showing how information moves through the entire system every 15 minutes.

```mermaid
sequenceDiagram
 autonumber
 participant CG as Coinglass API
 participant DA as Zeta API
 participant PY as Pyth Oracle
 participant SE as Signal Engine
 participant KB as Keeper Bot
 participant RC as Risk Checker
 participant DH as Zeta Health
 participant AT as Attestation
 participant DR as Zeta Markets
 participant KM as Kamino Finance
 participant VT as Ranger Vault
 participant TG as Telegram
 participant DB as Dashboard

 Note over SE,KB: Every 15 minutes (keeper tick)

 rect rgb(255, 243, 205)
 Note over CG,SE: Phase 1: Data Collection
 KB->>SE: GET /signal?asset=SOL-PERP
 SE->>CG: GET /liqHeatmap (SOL)
 CG-->>SE: liquidation clusters
 SE->>DA: GET /fundingRates (SOL)
 DA-->>SE: funding rate data
 SE->>PY: getPrice(SOL/USD)
 PY-->>SE: $150.42
 end

 rect rgb(209, 236, 241)
 Note over SE: Phase 2: Feature Engineering + ML
 SE->>SE: Compute 17 features
 SE->>SE: XGBoost Momentum → 0.35
 SE->>SE: XGBoost MeanRev → 0.52
 SE->>SE: Ensemble → signal=0.45
 SE-->>KB: {signal: 0.45, confidence: 0.68}
 end

 rect rgb(248, 215, 218)
 Note over KB,DH: Phase 3: Risk Validation
 KB->>RC: checkAllLimits()
 RC->>DH: getHealthState()
 DH->>DR: zetaUser.getHealth()
 DR-->>DH: health=58, leverage=1.42x
 DH-->>RC: {safe, health=58}
 RC-->>KB: ALL LIMITS PASS
 end

 alt Signal > 0.6 (LONG)
 rect rgb(212, 237, 218)
 Note over KB,DR: Phase 4a: Execute Trade
 KB->>KB: Kelly size = $12,500
 KB->>AT: sign(tradeIx, agentKey)
 AT-->>KB: Ed25519 signature
 KB->>DR: placePerpOrder(SOL long $12.5k)
 DR-->>KB: txSig: "abc123..."
 KB->>AT: recordAttestation(txSig)
 end
 else Signal < -0.6 (SHORT)
 rect rgb(212, 237, 218)
 Note over KB,DR: Phase 4b: Execute Short
 KB->>DR: placePerpOrder(SOL short)
 DR-->>KB: txSig
 end
 else |Signal| < 0.6 (NEUTRAL)
 rect rgb(226, 232, 240)
 Note over KB,VT: Phase 4c: No Trade
 KB->>KB: Close existing positions if any
 KB->>VT: Shift allocation → 70% Kamino
 end
 end

 rect rgb(204, 229, 255)
 Note over KB,VT: Phase 5: Rebalance
 KB->>VT: rebalanceFromSignal(55%, 45%)
 VT->>KM: deposit/withdraw USDC
 VT->>DR: deposit/withdraw USDC
 end

 rect rgb(226, 213, 241)
 Note over KB,TG: Phase 6: Monitor & Report
 KB->>KB: updateMetrics(trade, pnl)
 KB->>KB: logExecution(details)
 opt Risk Warning
 KB->>TG: sendWarning("leverage 1.8x")
 end
 DB->>KB: GET /api/vault-state
 KB-->>DB: {tvl, apy, nav, positions}
 end
```

---

## 6. Risk Framework

The 6-layer risk management architecture.

```mermaid
graph TB
 subgraph Layer1["Layer 1: STRUCTURAL"]
 L1A["50% Kamino Floor<br/>No directional risk"]
 L1B["50% Active Trading<br/>Controlled exposure"]
 L1C["Delta Wrapper<br/>Net delta ≈ 0"]
 end

 subgraph Layer2["Layer 2: PER-TRADE"]
 L2A["Stop-Loss: -0.5%"]
 L2B["Take-Profit: +1.5%"]
 L2C["Kelly Sizing: 25%"]
 L2D["Max Positions: 3"]
 end

 subgraph Layer3["Layer 3: PORTFOLIO"]
 L3A["Daily DD: 3% max"]
 L3B["Monthly DD: 8% max"]
 L3C["VaR: 2% at 95%"]
 L3D["Net Delta: ±0.10"]
 end

 subgraph Layer4["Layer 4: PROTOCOL"]
 L4A["Zeta Health: 0-100<br/>Warning: 20 | Critical: 10"]
 L4B["Max Leverage: 2.0x"]
 L4C["Oracle Guard<br/>Divergence < 1%"]
 end

 subgraph Layer5["Layer 5: OPERATIONAL"]
 L5A["Ed25519 Attestation"]
 L5B["Auth Signal Server"]
 L5C["Receipt Refresh (5m)"]
 L5D["Reward Compound (1h)"]
 end

 subgraph Layer6["Layer 6: EMERGENCY"]
 L6A["Full Unwind<br/>Close all → Kamino"]
 L6B["Telegram Alerts"]
 L6C["Manual Override"]
 end

 Trade["New Trade Signal"] --> Layer1
 Layer1 --> Layer2
 Layer2 --> Layer3
 Layer3 --> Layer4
 Layer4 --> Layer5
 Layer5 -->|" All Pass"| Execute["Execute Trade"]

 Layer2 -->|" Breach"| Layer6
 Layer3 -->|" Breach"| Layer6
 Layer4 -->|" Breach"| Layer6
 Layer6 --> SafeMode["Safe Mode (100% Kamino)"]

 classDef l1 fill:#d4edda,stroke:#155724
 classDef l2 fill:#cce5ff,stroke:#004085
 classDef l3 fill:#fff3cd,stroke:#856404
 classDef l4 fill:#ffeaa7,stroke:#d68910
 classDef l5 fill:#e2d5f1,stroke:#5a2d82
 classDef l6 fill:#f8d7da,stroke:#721c24
 classDef safe fill:#00b894,stroke:#333,color:#fff

 class L1A,L1B,L1C l1
 class L2A,L2B,L2C,L2D l2
 class L3A,L3B,L3C,L3D l3
 class L4A,L4B,L4C l4
 class L5A,L5B,L5C,L5D l5
 class L6A,L6B,L6C l6
 class SafeMode safe
```

---

## 7. Ed25519 Attestation Flow

Detailed flow of how every trade is cryptographically attested.

```mermaid
sequenceDiagram
 autonumber
 participant ML as ML Signal Engine
 participant KP as Keeper Loop
 participant AT as AI Attestation
 participant AK as Agent Keypair (Ed25519)
 participant TX as Transaction Builder
 participant ED as Ed25519 Program (On-Chain)
 participant DR as Zeta Program (On-Chain)
 participant VL as Validators

 KP->>ML: GET /signal → {signal: 0.72, asset: SOL}
 ML-->>KP: Signal received

 KP->>KP: Build trade instruction: Zeta.placePerpOrder(SOL, LONG, $12.5k)

 rect rgb(226, 213, 241)
 Note over KP,AK: Attestation Phase
 KP->>AT: attestTrade(tradeInstruction)
 AT->>AT: message = tradeIx.data
 AT->>AK: Ed25519.sign(message, privateKey)
 AK-->>AT: signature (64 bytes)
 AT->>AT: Build Ed25519 verify instruction
 AT-->>KP: ed25519VerifyIx
 end

 rect rgb(204, 229, 255)
 Note over KP,TX: Transaction Assembly
 KP->>TX: Build final transaction
 TX->>TX: ix[0] ComputeBudgetProgram.setComputeUnitLimit(400k)
 TX->>TX: ix[1] ComputeBudgetProgram.setComputeUnitPrice(50k)
 TX->>TX: ix[2] Ed25519 VERIFY instruction (ATTESTATION)
 TX->>TX: ix[3] Zeta.placePerpOrder (ACTUAL TRADE)
 TX->>TX: Sign with manager keypair
 end

 rect rgb(212, 237, 218)
 Note over TX,VL: On-Chain Verification
 TX->>VL: sendRawTransaction(signedTx)
 VL->>ED: Verify Ed25519 signature
 alt Signature Valid
 ED-->>VL: Verification passed
 VL->>DR: Execute Zeta order
 DR-->>VL: Order placed 
 VL-->>TX: txSig: "abc123..."
 else Signature Invalid
 ED-->>VL: Verification failed
 VL-->>TX: Transaction REJECTED
 end
 end

 rect rgb(255, 243, 205)
 Note over KP: Post-Trade
 KP->>AT: recordAttestation(txSig, message)
 AT->>AT: Store in attestation log
 end
```

---

## 8. Rebalance Engine Loops

The three independent loops running in the keeper.

```mermaid
graph TB
 subgraph Loop1[" Loop 1: Receipt Refresh (every 5 min)"]
 R1["Timer triggers"] --> R2["For each strategy"]
 R2 --> R3["createRefreshReceiptIx()"]
 R3 --> R4["sendOptimisedTx()"]
 R4 --> R5["NAV per LP = accurate"]
 R5 -.->|"5 min later"| R1
 end

 subgraph Loop2[" Loop 2: Reward Compound (every 1 hour)"]
 C1["Timer triggers"] --> C2["Claim Kamino rewards"]
 C2 --> C3{"Balance > 0?"}
 C3 -->|"Yes"| C4["Swap → USDC via Jupiter"]
 C3 -->|"No"| C5["Check idle USDC"]
 C4 --> C5
 C5 --> C6{"Idle > $1?"}
 C6 -->|"Yes"| C7["Re-deposit to Kamino"]
 C6 -->|"No"| C8["Done"]
 C7 --> C8
 C8 -.->|"1 hour later"| C1
 end

 subgraph Loop3[" Loop 3: Signal Rebalance (every 15 min)"]
 S1["Timer triggers"] --> S2["Fetch signal"]
 S2 --> S3["Compute target allocation"]
 S3 --> S4["Get current on-chain"]
 S4 --> S5{"Delta > $10?"}
 S5 -->|"Yes"| S6["Withdraw over-allocated"]
 S5 -->|"No"| S7["Log"]
 S6 --> S8["Deposit under-allocated"]
 S8 --> S7
 S7 -.->|"15 min later"| S1
 end

 subgraph Allocation[" Dynamic Allocation"]
 A1["No signal (0.0): 80% Kamino / 20% Zeta"]
 A2["Weak (0.3): 68% Kamino / 32% Zeta"]
 A3["Strong (0.6+): 52% Kamino / 48% Zeta"]
 A4["Max (1.0): 40% Kamino / 60% Zeta"]
 end

 classDef refresh fill:#d4edda,stroke:#155724
 classDef compound fill:#fff3cd,stroke:#856404
 classDef rebalance fill:#cce5ff,stroke:#004085
 classDef alloc fill:#e2d5f1,stroke:#5a2d82

 class R1,R2,R3,R4,R5 refresh
 class C1,C2,C3,C4,C5,C6,C7,C8 compound
 class S1,S2,S3,S4,S5,S6,S7,S8 rebalance
 class A1,A2,A3,A4 alloc
```

---

## 9. Trade Execution Flow

Complete flow from signal to on-chain trade execution.

```mermaid
flowchart TD
 Start(["⏰ Keeper Tick (every 15 min)"]) --> FetchSignals

 subgraph FetchPhase["Phase 1: Signal Collection"]
 FetchSignals["Fetch signals for SOL, BTC, ETH"]
 FetchSignals --> SignalSOL["SOL: +0.72"]
 FetchSignals --> SignalBTC["BTC: -0.31"]
 FetchSignals --> SignalETH["ETH: +0.08"]
 end

 subgraph RiskPhase["Phase 2: Risk Validation"]
 SignalSOL --> RiskCheck{"Risk Check (6 layers)"}
 SignalBTC --> RiskCheck
 SignalETH --> RiskCheck
 RiskCheck --> DD{"Daily DD < 3%?"}
 DD -->|""| Health{"Zeta Health > 15?"}
 DD -->|""| Emergency[" EMERGENCY UNWIND"]
 Health -->|""| Delta{"Net Delta < 0.10?"}
 Health -->|""| Emergency
 Delta -->|""| Positions{"Open Pos < 3?"}
 Delta -->|""| Rehedge["Rebalance delta"]
 Positions -->|""| CheckSL["Check SL/TP"]
 Positions -->|""| SkipNew["Skip new trades"]
 end

 subgraph TradePhase["Phase 3: Execute"]
 CheckSL --> NewTrades{"Signal > 0.6?"}
 NewTrades -->|"SOL: 0.72"| SizeTrade["Kelly: $12,500"]
 NewTrades -->|"BTC: 0.31"| NoTrade["No trade"]
 SizeTrade --> Attest["Ed25519 sign"]
 Attest --> SendTx["sendOptimisedTx()"]
 SendTx --> Confirm{"Confirmed?"}
 Confirm -->|""| Record["Record in state"]
 Confirm -->|""| SendTx
 end

 subgraph RebalancePhase["Phase 4: Rebalance"]
 Record --> Rebalance["Compute target allocation"]
 NoTrade --> Rebalance
 SkipNew --> Rebalance
 Rehedge --> Rebalance
 Rebalance --> UpdateMetrics["Update P&L, Sharpe, DD"]
 end

 UpdateMetrics --> End(["⏰ Wait 15 min"])
 Emergency --> SafeMode["100% Kamino"] --> End

 classDef emergency fill:#d63031,stroke:#333,color:#fff
 class Emergency,SafeMode emergency
```

---

## 10. Dashboard Architecture

Frontend architecture and data flow.

```mermaid
graph TB
 subgraph NextApp["Next.js 14 App Router"]
 subgraph Pages["7 Dashboard Pages"]
 P1["/ (Overview)"]
 P2["/vault"]
 P3["/signals"]
 P4["/positions"]
 P5["/risk"]
 P6["/backtest"]
 P7["/logs"]
 end

 subgraph Hooks["React Query Hooks"]
 H1["useVaultState() (30s)"]
 H2["useSignal(asset) (60s)"]
 H3["usePositions() (15s)"]
 H4["usePerformance() (60s)"]
 H5["useRiskState() (30s)"]
 end

 subgraph APIRoutes["API Routes"]
 A1["/api/vault-state → Voltr SDK"]
 A2["/api/signal → Signal proxy"]
 A3["/api/positions → Zeta SDK"]
 A4["/api/health → System check"]
 end
 end

 subgraph Backend["Backend"]
 SS["Signal Engine :8080"]
 SOL["Solana RPC (Helius)"]
 end

 P1 --> H1
 P1 --> H2
 P2 --> H1
 P3 --> H2
 P4 --> H3
 P5 --> H5
 P6 --> H4

 H1 --> A1
 H2 --> A2
 H3 --> A3

 A1 --> SOL
 A2 --> SS
 A3 --> SOL

 classDef page fill:#74b9ff,stroke:#0984e3
 classDef hook fill:#55efc4,stroke:#00b894
 classDef api fill:#ffeaa7,stroke:#fdcb6e

 class P1,P2,P3,P4,P5,P6,P7 page
 class H1,H2,H3,H4,H5 hook
 class A1,A2,A3,A4 api
```

---

## 11. Deployment Architecture

Production deployment with Docker Compose.

```mermaid
graph TB
 subgraph Internet[" Internet"]
 User["User Browser"]
 TGBot["Telegram Bot API"]
 CGApi["Coinglass API"]
 end

 subgraph Server[" Server / VPS"]
 subgraph Docker["Docker Compose"]
 SE[" signal-engine<br/>Python 3.10 | FastAPI<br/>Port: 8080"]
 KB[" keeper<br/>Node.js 18 | ts-node<br/>Depends: signal-engine"]
 DB[" dashboard<br/>Next.js 14 | Standalone<br/>Port: 3000"]
 end

 ENV[".env secrets"]
 Keys[" keys/ (volume mount)"]
 LogDir[" logs/ (volume mount)"]
 end

 subgraph Solana[" Solana"]
 Helius["Helius RPC"]
 VaultProg["Ranger Vault"]
 ZetaProg["Zeta Markets"]
 end

 User -->|"HTTPS :3000"| DB
 DB -->|"internal :8080"| SE
 KB -->|"internal :8080"| SE
 SE -->|"HTTPS"| CGApi
 KB -->|"HTTPS"| TGBot
 KB -->|"RPC"| Helius
 Helius --> VaultProg
 Helius --> ZetaProg
 ENV -.-> Docker
 Keys -.-> KB

 classDef container fill:#74b9ff,stroke:#0984e3
 classDef solana fill:#55efc4,stroke:#00b894
 classDef secure fill:#fd79a8,stroke:#e84393

 class SE,KB,DB container
 class Helius,VaultProg,ZetaProg solana
 class Keys,ENV secure
```

---

## 12. Network & Protocol Interactions

All external API calls and RPC interactions.

```mermaid
graph LR
 subgraph OurSystem["Our System"]
 SE["Signal Engine"]
 KB["Keeper Bot"]
 DB["Dashboard"]
 end

 subgraph APIs["External APIs"]
 CG["Coinglass (~288/day)"]
 DAPI["Zeta Data API (~288/day)"]
 JUP["Jupiter API (~50/day)"]
 TG["Telegram API (~10/day)"]
 end

 subgraph RPC["Solana RPC (Helius)"]
 Read["Read (~12K/day)"]
 Write["Write (~400 TXs/day)"]
 end

 subgraph Programs["On-Chain Programs"]
 Voltr["Voltr Vault"]
 ZetaP["Zeta"]
 KaminoP["Kamino"]
 Ed25519P["Ed25519 SigVerify"]
 end

 SE --> CG
 SE --> DAPI
 SE --> Read
 KB --> Write
 KB --> Read
 KB --> JUP
 KB --> TG
 DB --> Read

 Write --> Voltr
 Write --> ZetaP
 Write --> KaminoP
 Write --> Ed25519P

 classDef our fill:#74b9ff,stroke:#0984e3
 classDef api fill:#ffeaa7,stroke:#fdcb6e
 classDef program fill:#dfe6e9,stroke:#636e72

 class SE,KB,DB our
 class CG,DAPI,JUP,TG api
 class Voltr,ZetaP,KaminoP,Ed25519P program
```

---

## 13. State Machine

The vault operating states and transitions.

```mermaid
stateDiagram-v2
 [*] --> Uninitialized: Deploy

 Uninitialized --> Initialized: admin-init-vault
 Initialized --> Configured: admin-add-adaptors + init-strategies
 Configured --> Funded: user-deposit + manager-deposit
 Funded --> Active: Keeper starts

 Active --> Active: Normal operation (15 min tick)
 Active --> Warning: Risk limit approaching
 Warning --> Active: Risk subsides
 Warning --> Emergency: Risk breach (DD > 3% or health < 15)
 Emergency --> SafeMode: All positions closed
 SafeMode --> Active: Manual restart
 Active --> Paused: Admin halt
 Paused --> Active: Admin resume
 Active --> Withdrawing: User withdraw
 Withdrawing --> Active: Processed

 state Active {
 [*] --> FetchSignals
 FetchSignals --> RiskCheck
 RiskCheck --> ExecuteTrades: All pass
 RiskCheck --> ReduceExposure: Partial breach
 ExecuteTrades --> Rebalance
 ReduceExposure --> Rebalance
 Rebalance --> Monitor
 Monitor --> [*]: Wait 15 min
 }
```

---

## 14. Security Model

Authentication, authorization, and key management.

```mermaid
graph TB
 subgraph Keys[" Key Management"]
 AdminKey["Admin Keypair<br/>Cold storage | Setup only"]
 ManagerKey["Manager Keypair<br/>Hot wallet | Every 15 min"]
 AgentKey["Agent Keypair<br/>Hot wallet | Every trade"]
 KeeperSecret["KEEPER_SECRET<br/>Env var | Signal auth"]
 end

 subgraph Isolation[" Blast Radius"]
 I1["Admin compromised:<br/> Change config<br/> Cannot move funds"]
 I2["Manager compromised:<br/> Move between strategies<br/> Cannot change config"]
 I3["Agent compromised:<br/> Sign fake attestations<br/> Cannot trade alone"]
 I4["Secret leaked:<br/> Read signals<br/> Cannot trade"]
 end

 AdminKey --> I1
 ManagerKey --> I2
 AgentKey --> I3
 KeeperSecret --> I4

 classDef cold fill:#74b9ff,stroke:#0984e3
 classDef hot fill:#fd79a8,stroke:#e84393
 classDef env fill:#ffeaa7,stroke:#fdcb6e

 class AdminKey cold
 class ManagerKey,AgentKey hot
 class KeeperSecret env
```

---

## 15. Package Dependency Graph

How the 4 packages depend on each other.

```mermaid
graph TD
 subgraph Packages[" Project Packages"]
 V["vault/ (TypeScript)"]
 SE["signal-engine/ (Python)"]
 K["keeper/ (TypeScript)"]
 D["dashboard/ (TypeScript)"]
 end

 subgraph SharedDeps["Shared Dependencies"]
 VoltrSDK["@voltr/vault-sdk"]
 ZetaSDK["@zetamarkets/sdk"]
 SolanaWeb3["@solana/web3.js"]
 end

 V --> VoltrSDK
 V --> SolanaWeb3
 K --> ZetaSDK
 K --> VoltrSDK
 K --> SolanaWeb3
 D --> VoltrSDK
 D --> ZetaSDK

 K -->|"HTTP :8080 (auth)"| SE
 D -->|"HTTP :8080 (proxy)"| SE
 K -->|"Solana TXs"| V
 D -->|"Read-only RPC"| V

 classDef pkg fill:#74b9ff,stroke:#0984e3
 classDef shared fill:#55efc4,stroke:#00b894

 class V,SE,K,D pkg
 class VoltrSDK,ZetaSDK,SolanaWeb3 shared
```

---

## 16. Database & Storage

Where data persists across the system.

```mermaid
graph TB
 subgraph OnChain[" On-Chain State"]
 VS["Vault Account PDA"]
 SS1["Strategy Accounts (3)"]
 LP["LP Token Mint"]
 ZetaUser["Zeta User Account"]
 end

 subgraph FileStorage[" File Storage"]
 Models["models/saved/*.joblib"]
 DataCache["data/cache/*.parquet"]
 LogFiles["logs/*.log"]
 Results["tests/backtests/results/"]
 end

 subgraph InMemory[" In-Memory"]
 KeeperState["StateManager: positions, P&L, DD"]
 MetricsState["MetricsCollector: trades, Sharpe"]
 SignalState["Signal Server: models, cache"]
 end

 classDef chain fill:#55efc4,stroke:#00b894
 classDef file fill:#74b9ff,stroke:#0984e3
 classDef memory fill:#ffeaa7,stroke:#fdcb6e

 class VS,SS1,LP,ZetaUser chain
 class Models,DataCache,LogFiles,Results file
 class KeeperState,MetricsState,SignalState memory
```

---

## 17. Failure Modes & Recovery

How the system handles failures at each level.

```mermaid
graph TB
 subgraph Failures[" Failure Modes"]
 F1["Signal Server Down"]
 F2["Coinglass API Down"]
 F3["RPC Congestion"]
 F4["Zeta Health Critical"]
 F5["Drawdown Breach"]
 F6["Keeper Crash"]
 end

 subgraph Recovery[" Recovery"]
 R1["Shift 100% to Kamino"]
 R2["Graceful degradation (10 features)"]
 R3["Retry with backoff (3 attempts)"]
 R4["Emergency unwind"]
 R5["Emergency unwind + Telegram alert"]
 R6["Docker restart + recover from chain"]
 end

 subgraph Impact[" Impact"]
 I1["LOW: Floor yield continues"]
 I2["LOW: Model still functional"]
 I3["MEDIUM: Delayed execution"]
 I4["HIGH: Immediate action"]
 I5["HIGH: Protective mode"]
 I6["LOW: Auto-restart"]
 end

 F1 --> R1 --> I1
 F2 --> R2 --> I2
 F3 --> R3 --> I3
 F4 --> R4 --> I4
 F5 --> R5 --> I5
 F6 --> R6 --> I6

 classDef failure fill:#ff7675,stroke:#d63031
 classDef recovery fill:#55efc4,stroke:#00b894
 classDef low fill:#ffeaa7,stroke:#fdcb6e
 classDef high fill:#ff7675,stroke:#d63031

 class F1,F2,F3,F4,F5,F6 failure
 class R1,R2,R3,R4,R5,R6 recovery
 class I1,I2,I6 low
 class I3 low
 class I4,I5 high
```

---

## 18. Sequence Diagrams

### 18.1 User Deposit Flow

```mermaid
sequenceDiagram
 autonumber
 participant User as User
 participant Wallet as Wallet
 participant Dashboard as Dashboard
 participant Vault as Vault Program
 participant LP as 🪙 LP Mint
 participant Kamino as Kamino
 participant Zeta as Zeta

 User->>Dashboard: Navigate to /vault
 Dashboard->>User: Show deposit form
 User->>Dashboard: Enter amount: 1000 USDC
 Dashboard->>Wallet: Request approval
 Wallet->>User: Confirm transaction?
 User->>Wallet: Approve 

 rect rgb(212, 237, 218)
 Note over Wallet,Vault: Deposit Transaction
 Wallet->>Vault: userDeposit(1000 USDC)
 Vault->>Vault: shares = amount × totalShares / totalAssets
 Vault->>LP: mint(shares) → User ATA
 LP-->>User: Receive LP tokens
 end

 rect rgb(204, 229, 255)
 Note over Vault,Zeta: Keeper Allocates (next tick)
 Vault->>Kamino: managerDeposit(500 USDC)
 Vault->>Zeta: managerDeposit(500 USDC)
 end

 Dashboard->>User: Deposited 1000 USDC
```

### 18.2 Emergency Unwind Sequence

```mermaid
sequenceDiagram
 autonumber
 participant DH as Health Monitor
 participant RC as Risk Checker
 participant EU as Emergency Unwind
 participant DE as Zeta Executor
 participant JE as Jupiter
 participant VA as Vault Allocator
 participant AL as Telegram
 participant TG as Telegram

 DH->>DH: health = 12 (CRITICAL!)
 DH->>RC: shouldEmergencyUnwind() → TRUE

 rect rgb(248, 215, 218)
 Note over RC,TG: Emergency Protocol
 RC->>EU: execute("Health critical: 12")
 EU->>AL: sendCritical(" EMERGENCY UNWIND")
 AL->>TG: POST /sendMessage

 EU->>DE: closeAllPositions()
 DE-->>EU: 3 positions closed

 EU->>JE: sellSpot(SOL, balance)
 JE-->>EU: USDC received

 EU->>VA: emergencyFullUnwind()
 VA-->>EU: 100% moved to Kamino
 end

 EU->>AL: sendCritical(" Unwind complete")
 Note over EU: Safe mode — manual restart required
```

### 18.3 Full Keeper Tick Sequence

```mermaid
sequenceDiagram
 autonumber
 participant Timer as ⏰ Timer
 participant KL as Keeper
 participant SC as Signal Client
 participant SE as Signal Engine
 participant RC as Risk Checker
 participant DE as Zeta Executor
 participant AT as Attestation
 participant VA as Allocator
 participant MT as Metrics

 Timer->>KL: tick()

 rect rgb(255, 243, 205)
 KL->>SC: getSignal("SOL-PERP")
 SC->>SE: GET /signal?asset=SOL-PERP
 SE-->>SC: {signal: 0.72, confidence: 0.68}
 SC-->>KL: SOL signal received
 KL->>SC: getSignal("BTC-PERP")
 SC-->>KL: {signal: -0.31}
 KL->>SC: getSignal("ETH-PERP")
 SC-->>KL: {signal: 0.08}
 end

 rect rgb(248, 215, 218)
 KL->>RC: checkAllLimits()
 RC-->>KL: ALL PASS
 end

 rect rgb(212, 237, 218)
 Note over KL: SOL 0.72 > 0.6 → TRADE
 KL->>KL: Kelly size: $12,500
 KL->>AT: signTrade(tradeIx)
 AT-->>KL: Attested TX
 KL->>DE: sendOptimisedTx()
 DE-->>KL: txSig: "abc123..."
 end

 rect rgb(204, 229, 255)
 KL->>VA: allocateFromSignal(0.72)
 VA-->>KL: Kamino 52%, Zeta 48%
 end

 KL->>MT: recordTrade()
 KL->>Timer: Done. Wait 15 min.
```

---

## Appendix: Key Addresses

| Item | Address |
|------|---------|
| Zeta Adaptor | `EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP` |
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Wrapped SOL | `So11111111111111111111111111111111111111112` |
| Ed25519 Program | `Ed25519SigVerify111111111111111111111111111` |
| Vault Address | `[DEPLOY_OUTPUT]` |

| Market | Zeta Index |
|--------|------------|
| SOL-PERP | 0 |
| BTC-PERP | 1 |
| ETH-PERP | 2 |

| API | Endpoint |
|-----|----------|
| Zeta Data | `data.api.zeta.markets` |
| Coinglass | `open-api.coinglass.com` |
| Jupiter | `quote-api.jup.ag/v6` |
| Helius | `mainnet.helius-rpc.com` |

---

> This architecture document is part of the Ranger AI Vault submission for the Build-A-Bear Hackathon. All diagrams render in GitHub Markdown, VS Code (with Mermaid extension), and any Mermaid-compatible viewer.
