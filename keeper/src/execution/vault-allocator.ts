// =================================================================
// Vault Allocator -- Moves funds between vault strategies
// Wrapper around RebalanceEngine for keeper-loop integration
// =================================================================

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { RebalanceEngine } from "../core/rebalance-engine";
import { logger } from "../monitoring/logger";
import { VAULT_CONFIG } from "../config";

export class VaultAllocator {
  private rebalanceEngine: RebalanceEngine;
  private client: VoltrClient;
  private vaultAddress: PublicKey;

  constructor(
    connection: Connection,
    managerKp: Keypair,
    vaultAddress: PublicKey,
  ) {
    this.vaultAddress = vaultAddress;
    this.client = new VoltrClient(connection);
    this.rebalanceEngine = new RebalanceEngine(
      connection,
      managerKp,
      vaultAddress,
    );
  }

  // === SIGNAL-BASED ALLOCATION ===

  /**
   * Adjust allocation based on signal strength.
   *
   * Signal range: -1.0 to +1.0
   * - Strong signal (|signal| > 0.6): shift more to Drift for active trading
   * - Weak/no signal: keep more in Kamino for floor yield
   *
   * Allocation ranges:
   * - Kamino: 40% (strong signal) to 80% (no signal)
   * - Drift:  20% (no signal) to 60% (strong signal)
   */
  async allocateFromSignal(signalStrength: number): Promise<void> {
    const absSignal = Math.abs(signalStrength);

    // Linear interpolation based on signal strength
    const kaminoPct = 0.80 - absSignal * 0.40;
    const driftPct = 1.0 - kaminoPct;

    // Clamp to safe bounds
    const safeKamino = Math.max(0.40, Math.min(0.80, kaminoPct));
    const safeDrift = 1.0 - safeKamino;

    logger.info(
      `Signal strength: ${signalStrength.toFixed(3)} -> ` +
        `Kamino: ${(safeKamino * 100).toFixed(1)}%, ` +
        `Drift: ${(safeDrift * 100).toFixed(1)}%`,
    );

    await this.rebalanceEngine.rebalanceFromSignal(safeKamino, safeDrift);
  }

  // === EMERGENCY ===

  async emergencyFullUnwind(): Promise<void> {
    logger.warn("VaultAllocator: emergency full unwind to Kamino");
    await this.rebalanceEngine.emergencyMoveToSafe();
  }

  // === GETTERS ===

  async getVaultTVL(): Promise<number> {
    return this.rebalanceEngine.getTotalVaultAssets();
  }

  async getStrategyBalances(): Promise<{
    kamino: number;
    drift: number;
    idle: number;
  }> {
    const [kamino, drift, idle] = await Promise.all([
      this.rebalanceEngine.getStrategyBalance("kamino-lending"),
      this.rebalanceEngine.getStrategyBalance("drift-perps"),
      this.rebalanceEngine.getVaultIdleUSDC(),
    ]);
    return {
      kamino: kamino / 1e6,
      drift: drift / 1e6,
      idle: idle / 1e6,
    };
  }

  // === LOOPS ===

  getRebalanceEngine(): RebalanceEngine {
    return this.rebalanceEngine;
  }
}
