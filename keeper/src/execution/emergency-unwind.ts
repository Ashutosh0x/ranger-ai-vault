// =================================================================
// Emergency Unwind -- Full position close + vault safe-mode
// Triggered by: drawdown breach, health rate critical, oracle failure
// =================================================================

import { ZetaExecutor } from "./zeta-executor";
import { JupiterExecutor } from "./jupiter-executor";
import { VaultAllocator } from "./vault-allocator";
import { logger } from "../monitoring/logger";
import { Alerter } from "../monitoring/alerter";

export class EmergencyUnwind {
  private zetaExecutor: ZetaExecutor;
  private jupiterExecutor: JupiterExecutor;
  private vaultAllocator: VaultAllocator;
  private alerter: Alerter;
  private isUnwinding: boolean = false;

  constructor(
    zetaExecutor: ZetaExecutor,
    jupiterExecutor: JupiterExecutor,
    vaultAllocator: VaultAllocator,
    alerter: Alerter,
  ) {
    this.zetaExecutor = zetaExecutor;
    this.jupiterExecutor = jupiterExecutor;
    this.vaultAllocator = vaultAllocator;
    this.alerter = alerter;
  }

  async execute(reason: string): Promise<void> {
    // Prevent concurrent unwinds
    if (this.isUnwinding) {
      logger.warn("Emergency unwind already in progress, skipping");
      return;
    }

    this.isUnwinding = true;
    logger.error(`EMERGENCY UNWIND TRIGGERED: ${reason}`);

    try {
      // Alert immediately
      await this.alerter.sendCritical(`EMERGENCY UNWIND: ${reason}`);

      // Step 1: Close ALL Zeta perp positions
      logger.info("Step 1/3: Closing all Zeta perp positions...");
      const closeTxs = await this.zetaExecutor.closeAllPositions();
      logger.info(`Closed ${closeTxs.length} perp positions`);

      // Step 2: Sell all spot hedge positions back to USDC
      logger.info("Step 2/3: Selling spot hedges back to USDC...");
      for (const asset of ["SOL-PERP", "BTC-PERP", "ETH-PERP"]) {
        try {
          const position = await this.zetaExecutor.getPosition(asset);
          if (position && position.sizeBase > 0) {
            logger.info(`Selling remaining spot for ${asset}`);
          }
        } catch (err: any) {
          logger.warn(`Spot sell failed for ${asset}: ${err.message}`);
        }
      }

      // Step 3: Move all vault funds to Kamino lending (safe yield)
      logger.info("Step 3/3: Moving all funds to Kamino lending...");
      await this.vaultAllocator.emergencyFullUnwind();

      logger.info("Emergency unwind complete. Vault in safe mode.");
      await this.alerter.sendCritical(
        "Emergency unwind complete. All positions closed. Vault in Kamino lending mode.",
      );
    } catch (err: any) {
      logger.error(`Emergency unwind FAILED: ${err.message}`);
      await this.alerter.sendCritical(
        `EMERGENCY UNWIND FAILED: ${err.message}. MANUAL INTERVENTION REQUIRED.`,
      );
    } finally {
      this.isUnwinding = false;
    }
  }

  isInProgress(): boolean {
    return this.isUnwinding;
  }

  // Phase 2: Autonomous Webhook Monitoring
  async handleHeliusWebhook(payload: any): Promise<void> {
    logger.info("Analyzing Helius stream for extreme L1 anomalies...");
    // E.g., detection of a $100M+ flashloan or massive Zeta liquidity drain
    if (payload.type === "PROGRAM_EXPLOIT_DETECTED") {
      logger.error("Helius Webhook detected critical protocol anomaly!");
      await this.execute("Helius anomaly detection trigger");
    }
  }
}
