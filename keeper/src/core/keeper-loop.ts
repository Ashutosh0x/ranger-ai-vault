import { AgentOrchestrator } from "../execution/agent-orchestrator";
import { FlashExecutor } from "../execution/flash-executor";
// =================================================================
// Keeper Loop -- Main execution loop with full module integration
// =================================================================

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ZetaClient, Wallet } from "@zetamarkets/sdk";

import { SignalClient } from "./signal-client";
import { StateManager } from "./state-manager";
import { RebalanceEngine } from "./rebalance-engine";
import { ZetaExecutor } from "../execution/zeta-executor";
import { VaultAllocator } from "../execution/vault-allocator";
import { JupiterExecutor } from "../execution/jupiter-executor";
import { EmergencyUnwind } from "../execution/emergency-unwind";
import { RiskChecker } from "../risk/risk-checker";
import { PositionTracker } from "../risk/position-tracker";
import { ZetaHealthMonitor } from "../risk/zeta-health-monitor";
import { AIAttestor } from "../attestation/ai-attestation";
import { AttestationVerifier } from "../attestation/attestation-verifier";
import { MetricsCollector } from "../monitoring/metrics";
import { Alerter } from "../monitoring/alerter";
import { EXECUTION_PARAMS, SIGNAL_THRESHOLDS, RISK_PARAMS, VAULT_CONFIG } from "../config";
import { SignalResponse, TradeAction } from "../types";
import { logger } from "../monitoring/logger";
import * as fs from "fs";

export class KeeperLoop {
  private signalClient: SignalClient;
  private stateManager: StateManager;
  private riskChecker: RiskChecker;
  private attestor: AIAttestor;
  private attestationVerifier!: AttestationVerifier;
  private metrics: MetricsCollector;
  private alerter: Alerter;

  // Execution layer (initialized after Zeta connects)
  private zetaExecutor!: ZetaExecutor;
  private vaultAllocator!: VaultAllocator;
  private jupiterExecutor!: JupiterExecutor;
  private emergencyUnwind!: EmergencyUnwind;
  private positionTracker!: PositionTracker;
  private healthMonitor!: ZetaHealthMonitor;
  private rebalanceEngine!: RebalanceEngine;

  private agentOrchestrator!: AgentOrchestrator;
  private flashExecutor!: FlashExecutor;


  private connection!: Connection;
  private zetaClient!: ZetaClient;
  private initialized: boolean = false;

  constructor() {
    this.signalClient = new SignalClient();
    this.stateManager = new StateManager();
    this.riskChecker = new RiskChecker(this.stateManager);
    this.attestor = new AIAttestor();
    this.metrics = new MetricsCollector();
    this.alerter = new Alerter();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Setup Solana connection
      this.connection = new Connection(VAULT_CONFIG.rpcUrl, "confirmed");

      // Load manager keypair
      const managerKpPath = VAULT_CONFIG.managerKeypairPath;
      let managerKp: Keypair;
      if (fs.existsSync(managerKpPath)) {
        const raw = fs.readFileSync(managerKpPath, "utf-8");
        managerKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      } else {
        managerKp = Keypair.generate();
        logger.warn("Using ephemeral manager keypair -- generate a persistent one for production");
      }

      // Initialize Zeta client
      const wallet = new Wallet(managerKp);
      this.zetaClient = new ZetaClient({
        connection: this.connection,
        wallet,
        env: "mainnet-beta",
      });
      await this.zetaClient.subscribe();

      // Initialize execution modules
      const vaultAddress = new PublicKey(VAULT_CONFIG.vaultAddress || Keypair.generate().publicKey);

      this.zetaExecutor = new ZetaExecutor(this.zetaClient);
      this.vaultAllocator = new VaultAllocator(this.connection, managerKp, vaultAddress);
      this.jupiterExecutor = new JupiterExecutor(this.connection, managerKp);
      this.positionTracker = new PositionTracker(this.zetaExecutor);
      this.healthMonitor = new ZetaHealthMonitor(this.zetaClient);
      this.rebalanceEngine = this.vaultAllocator.getRebalanceEngine();

      this.agentOrchestrator = new AgentOrchestrator(
        managerKp.secretKey.toString(),
        VAULT_CONFIG.rpcUrl,
        process.env.OPENAI_API_KEY || "dummy"
      );
      this.flashExecutor = new FlashExecutor(this.connection, managerKp);


      this.emergencyUnwind = new EmergencyUnwind(
        this.zetaExecutor,
        this.jupiterExecutor,
        this.vaultAllocator,
        this.alerter,
      );

      this.attestationVerifier = new AttestationVerifier(
        this.connection,
        new PublicKey(this.attestor.getAgentPublicKey()),
      );

      // Start background loops
      this.rebalanceEngine.startAllLoops();

      this.initialized = true;
      logger.info("Keeper fully initialized with all execution modules");
      await this.alerter.sendInfo("Keeper bot started successfully");
    } catch (err: any) {
      logger.error(`Keeper initialization failed: ${err.message}`);
      logger.warn("Running in signal-only mode (no on-chain execution)");
    }
  }

  async tick(): Promise<void> {
    const startTime = Date.now();
    logger.info("=== KEEPER TICK START ===");

    try {
      // 0. Ensure initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // 1. Check signal server health
      const healthy = await this.signalClient.isHealthy();
      if (!healthy) {
        logger.error("Signal server is down -- skipping tick");
        return;
      }

      // 2. Check Zeta health (if executor available)
      if (this.healthMonitor) {
        const shouldUnwind = await this.healthMonitor.shouldEmergencyUnwind();
        if (shouldUnwind) {
          logger.error("Zeta health critical -- emergency unwind");
          await this.emergencyUnwind.execute("Zeta health ratio critical");
          return;
        }
      }

      // 3. Fetch risk state from signal server
      const risk = await this.signalClient.getRisk();
      if (risk.breach) {
        logger.warn("Risk breach detected -- reducing positions");
        await this.handleRiskBreach();
        return;
      }

      // 4. Check stop-loss / take-profit on existing positions
      if (this.positionTracker) {
        const trackedPositions = await this.positionTracker.checkAllPositions();
        for (const tp of trackedPositions) {
          if (tp.shouldClose) {
            logger.warn(`${tp.asset}: ${tp.closeReason}`);
            if (this.zetaExecutor) {
              const sig = await this.zetaExecutor.closePosition(tp.asset);
              if (sig) {
                this.positionTracker.recordExit(tp.asset);
                this.metrics.recordTrade({
                  timestamp: Date.now(),
                  asset: tp.asset,
                  direction: tp.direction,
                  pnlUsd: tp.currentPnlPct * tp.sizeUsd,
                  pnlPct: tp.currentPnlPct,
                  durationMs: Date.now() - tp.entryTime,
                });
                await this.alerter.sendTradeAlert(tp.asset, "CLOSE", tp.sizeUsd, tp.closeReason || "stop/TP");
              }
            }
          }
        }
      }

      // 5. Process each asset for new signals
      for (const asset of EXECUTION_PARAMS.assets) {
        try {
          await this.processAsset(asset);
        } catch (err: any) {
          logger.error(`Error processing ${asset}: ${err.message}`);
        }
      }

      // 6. Update NAV and metrics
      if (this.vaultAllocator) {
        const tvl = await this.vaultAllocator.getVaultTVL();
        if (tvl > 0) {
          this.metrics.updateNAV(tvl / 1e6);
          await this.signalClient.updateNav(tvl / 1e6);
        }
      }

      // 7. Update last rebalance
      this.stateManager.setLastRebalance(Date.now());

      const duration = Date.now() - startTime;
      logger.info(`=== KEEPER TICK COMPLETE (${duration}ms) ===`);
    } catch (err: any) {
      logger.error(`Keeper tick failed: ${err.message}`);
    }
  }

  private async processAsset(asset: string): Promise<void> {
    const signal = await this.signalClient.getSignal(asset);
    logger.info(
      `[${asset}] Signal: ${signal.signal.toFixed(3)}, Confidence: ${signal.confidence.toFixed(3)}, Regime: ${signal.regime}`,
    );

    const action = this.determineAction(asset, signal);

    if (action.type === "none") {
      logger.debug(`[${asset}] No action needed`);
      return;
    }

    const riskOk = this.riskChecker.preTradeCheck(action);
    if (!riskOk) {
      logger.warn(`[${asset}] Trade blocked by risk checker: ${action.type}`);
      return;
    }

    logger.info(`[${asset}] Executing: ${action.type} (size: ${action.size}, reason: ${action.reason})`);
    await this.executeAction(action);
  }

  private determineAction(asset: string, signal: SignalResponse): TradeAction {
    const currentPosition = this.stateManager.getPosition(asset);

    if (signal.confidence < SIGNAL_THRESHOLDS.minConfidence) {
      return { type: "none", asset, size: 0, signal: signal.signal, confidence: signal.confidence, reason: "low confidence" };
    }

    if (currentPosition) {
      const isLong = currentPosition.side === "long";
      const shouldClose =
        (isLong && signal.signal < -SIGNAL_THRESHOLDS.closeThreshold) ||
        (!isLong && signal.signal > SIGNAL_THRESHOLDS.closeThreshold);

      if (shouldClose) {
        return { type: "close", asset, size: currentPosition.size, signal: signal.signal, confidence: signal.confidence, reason: "signal reversal" };
      }
      return { type: "none", asset, size: 0, signal: signal.signal, confidence: signal.confidence, reason: "holding position" };
    }

    if (signal.signal > SIGNAL_THRESHOLDS.longEntry) {
      return { type: "open_long", asset, size: this.calculatePositionSize(signal), signal: signal.signal, confidence: signal.confidence, reason: "strong long signal" };
    }

    if (signal.signal < SIGNAL_THRESHOLDS.shortEntry) {
      return { type: "open_short", asset, size: this.calculatePositionSize(signal), signal: signal.signal, confidence: signal.confidence, reason: "strong short signal" };
    }

    return { type: "none", asset, size: 0, signal: signal.signal, confidence: signal.confidence, reason: "signal within neutral zone" };
  }

  private calculatePositionSize(signal: SignalResponse): number {
    const basePct = RISK_PARAMS.kellyFraction;
    const adjustedPct = basePct * Math.abs(signal.signal) * signal.confidence;
    return Math.min(Math.max(adjustedPct, 0.05), 0.40);
  }

  private async executeAction(action: TradeAction): Promise<void> {
    const direction = action.type === "open_long" ? "long" : action.type === "open_short" ? "short" : "close";

    switch (action.type) {
      case "open_long":
      case "open_short": {
        // Execute on Zeta if available
        if (this.zetaExecutor) {
          const oraclePrice = this.zetaExecutor.getOraclePrice(action.asset);
          const tvl = this.vaultAllocator ? await this.vaultAllocator.getVaultTVL() : 0;
          const sizeUsd = (tvl / 1e6) * EXECUTION_PARAMS.activeAllocationPct * action.size;

          const txSig = await this.zetaExecutor.openPosition({
            asset: action.asset,
            direction: direction as "long" | "short",
            sizeUsd,
          });

          // Record attestation
          this.attestationVerifier?.recordAttestation(txSig, Buffer.from(action.asset));

          // Track position
          this.positionTracker?.recordEntry(action.asset, oraclePrice, direction);

          // Update delta on signal server
          const delta = direction === "long" ? action.size : -action.size;
          await this.signalClient.updateDelta(action.asset, delta);

          // Alert
          await this.alerter.sendTradeAlert(action.asset, direction, sizeUsd, action.reason);
        }

        // Always track in state manager
        this.stateManager.addPosition({
          asset: action.asset,
          side: direction as "long" | "short",
          size: action.size,
          entryPrice: this.zetaExecutor?.getOraclePrice(action.asset) || 0,
          currentPrice: 0,
          unrealizedPnl: 0,
          leverage: 1,
          entryTimestamp: Date.now(),
        });
        logger.info(`Opened ${direction} ${action.asset} (size: ${(action.size * 100).toFixed(1)}%)`);
        break;
      }

      case "close": {
        if (this.zetaExecutor) {
          await this.zetaExecutor.closePosition(action.asset);
          this.positionTracker?.recordExit(action.asset);
          await this.signalClient.updateDelta(action.asset, 0);
        }

        const closed = this.stateManager.removePosition(action.asset);
        if (closed) {
          logger.info(`Closed ${closed.side} ${action.asset} (PnL: ${closed.unrealizedPnl.toFixed(2)})`);
          this.stateManager.recordTradePnl(closed.unrealizedPnl);
          this.metrics.recordTrade({
            timestamp: Date.now(),
            asset: action.asset,
            direction: closed.side,
            pnlUsd: closed.unrealizedPnl,
            pnlPct: closed.entryPrice > 0 ? closed.unrealizedPnl / (closed.size * closed.entryPrice) : 0,
            durationMs: Date.now() - closed.entryTimestamp,
          });
          await this.alerter.sendTradeAlert(action.asset, "CLOSE", closed.size, action.reason);
        }
        break;
      }

      case "reduce":
        logger.info(`Reduced position ${action.asset}`);
        break;
    }
  }

  private async handleRiskBreach(): Promise<void> {
    logger.warn("RISK BREACH -- Closing all positions");

    if (this.emergencyUnwind) {
      await this.emergencyUnwind.execute("Signal server risk breach");
    } else {
      // Fallback: close via state manager only
      const positions = this.stateManager.getAllPositions();
      for (const pos of positions) {
        const closed = this.stateManager.removePosition(pos.asset);
        if (closed) {
          logger.info(`Emergency close: ${closed.side} ${closed.asset}`);
          this.stateManager.recordTradePnl(closed.unrealizedPnl);
        }
      }
    }

    await this.alerter.sendCritical("All positions closed due to risk breach");
  }

  getStateManager(): StateManager { return this.stateManager; }
  getMetrics(): MetricsCollector { return this.metrics; }
  getAlerter(): Alerter { return this.alerter; }

  async shutdown(): Promise<void> {
    logger.info("Shutting down keeper...");
    this.rebalanceEngine?.stopAllLoops();
    if (this.zetaClient) await this.zetaClient.unsubscribe();
    logger.info("Keeper shutdown complete");
  }
}
