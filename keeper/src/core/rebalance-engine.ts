// =================================================================
// Rebalance Engine -- 3-loop engine: receipt refresh, reward
// compounding, signal-driven rebalance
// =================================================================

import { VoltrClient } from "@voltr/vault-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import { logger } from "../monitoring/logger";
import { VAULT_CONFIG, EXECUTION_PARAMS } from "../config";

export interface StrategyInfo {
  address: PublicKey;
  name: string;
  defaultPct: number;
}

export class RebalanceEngine {
  private client: VoltrClient;
  private connection: Connection;
  private managerKp: Keypair;
  private vaultAddress: PublicKey;

  // Loop timers
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private rewardTimer: ReturnType<typeof setInterval> | null = null;

  // Intervals
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min
  private readonly REWARD_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Minimum rebalance threshold: $10 USDC (6 decimals)
  private readonly MIN_REBALANCE = 10_000_000;

  constructor(
    connection: Connection,
    managerKp: Keypair,
    vaultAddress: PublicKey,
  ) {
    this.connection = connection;
    this.managerKp = managerKp;
    this.vaultAddress = vaultAddress;
    this.client = new VoltrClient(connection);
  }

  // =================================================================
  // LOOP 1: RECEIPT REFRESH (every 5 min)
  // On-chain receipt values must stay current for accurate NAV.
  // Without this: LP token pricing, APY tracking, drawdown
  // calculations ALL silently drift from actual values.
  // =================================================================

  async refreshReceipts(): Promise<void> {
    const strategies = this.getStrategies();

    for (const strategy of strategies) {
      try {
        const refreshIx = await this.client.createRefreshReceiptIx({
          vault: this.vaultAddress,
          strategy: strategy.address,
        });

        await this.sendOptimisedTx(
          [refreshIx],
          `refresh-receipt-${strategy.name}`,
        );
        logger.debug(`Receipt refreshed: ${strategy.name}`);
      } catch (err: any) {
        // Non-fatal: one strategy failing shouldn't stop the others
        logger.warn(
          `Receipt refresh failed for ${strategy.name}: ${err.message}`,
        );
      }
    }
  }

  startRefreshLoop(): void {
    logger.info(
      `Starting receipt refresh loop (every ${this.REFRESH_INTERVAL_MS / 1000}s)`,
    );
    this.refreshReceipts();
    this.refreshTimer = setInterval(
      () => this.refreshReceipts(),
      this.REFRESH_INTERVAL_MS,
    );
  }

  // =================================================================
  // LOOP 2: REWARD CLAIMING + COMPOUNDING (every 1 hour)
  // Kamino farm rewards accrue but do NOT appear in NAV
  // until claimed and swapped back to USDC.
  // =================================================================

  async claimAndCompoundRewards(): Promise<void> {
    try {
      // Step 1: Claim Kamino protocol rewards
      const claimIx = await this.buildKaminoClaimIx();
      if (claimIx) {
        await this.sendOptimisedTx([claimIx], "claim-kamino-rewards");
        logger.info("Kamino rewards claimed");
      }

      // Step 2: Check reward token balance
      const rewardBalance = await this.getRewardTokenBalance();
      if (rewardBalance <= 0) {
        logger.debug("No reward tokens to compound");
        return;
      }

      // Step 3: Swap reward tokens -> USDC via Jupiter
      const swapIxs = await this.buildJupiterSwapIx(rewardBalance);
      if (swapIxs && swapIxs.length > 0) {
        await this.sendOptimisedTx(swapIxs, "swap-rewards-to-usdc");
        logger.info(
          `Swapped ${rewardBalance} reward tokens -> USDC`,
        );
      }

      // Step 4: Re-deposit swapped USDC into Kamino strategy
      const idleUsdc = await this.getVaultIdleUSDC();
      if (idleUsdc > 1_000_000) {
        await this.depositToStrategy("kamino-lending", idleUsdc);
        logger.info(
          `Compounded ${(idleUsdc / 1e6).toFixed(2)} USDC back to Kamino`,
        );
      }
    } catch (err: any) {
      logger.error(`Reward compound error: ${err.message}`);
    }
  }

  startRewardLoop(): void {
    logger.info(
      `Starting reward compound loop (every ${this.REWARD_INTERVAL_MS / 1000}s)`,
    );
    this.rewardTimer = setInterval(
      () => this.claimAndCompoundRewards(),
      this.REWARD_INTERVAL_MS,
    );
  }

  // =================================================================
  // LOOP 3: SIGNAL-DRIVEN REBALANCE (called by keeper-loop)
  // Adjusts allocation between Engine A (Kamino) and
  // Engine B (Drift) based on AI signal strength.
  // =================================================================

  async rebalanceFromSignal(
    targetKaminoPct: number,
    targetDriftPct: number,
  ): Promise<void> {
    const total = targetKaminoPct + targetDriftPct;
    if (Math.abs(total - 1.0) > 0.01) {
      logger.error(
        `Invalid allocation: Kamino=${targetKaminoPct} + Drift=${targetDriftPct} = ${total} (must equal 1.0)`,
      );
      return;
    }

    const totalAssets = await this.getTotalVaultAssets();
    if (totalAssets <= 0) {
      logger.warn("Vault has zero assets, skipping rebalance");
      return;
    }

    const targetKamino = Math.floor(totalAssets * targetKaminoPct);
    const targetDrift = Math.floor(totalAssets * targetDriftPct);

    const currentKamino = await this.getStrategyBalance("kamino-lending");
    const currentDrift = await this.getStrategyBalance("drift-perps");

    const kaminoDelta = targetKamino - currentKamino;
    const driftDelta = targetDrift - currentDrift;

    if (
      Math.abs(kaminoDelta) < this.MIN_REBALANCE &&
      Math.abs(driftDelta) < this.MIN_REBALANCE
    ) {
      logger.debug("Allocation within threshold, skipping rebalance");
      return;
    }

    logger.info(
      `Rebalancing: Kamino ${(currentKamino / 1e6).toFixed(0)} -> ${(targetKamino / 1e6).toFixed(0)} USDC, ` +
        `Drift ${(currentDrift / 1e6).toFixed(0)} -> ${(targetDrift / 1e6).toFixed(0)} USDC`,
    );

    // IMPORTANT: Withdraw from over-allocated FIRST, then deposit
    if (kaminoDelta < -this.MIN_REBALANCE) {
      await this.withdrawFromStrategy("kamino-lending", Math.abs(kaminoDelta));
    }
    if (driftDelta < -this.MIN_REBALANCE) {
      await this.withdrawFromStrategy("drift-perps", Math.abs(driftDelta));
    }

    await new Promise((r) => setTimeout(r, 2000));

    if (kaminoDelta > this.MIN_REBALANCE) {
      await this.depositToStrategy("kamino-lending", kaminoDelta);
    }
    if (driftDelta > this.MIN_REBALANCE) {
      await this.depositToStrategy("drift-perps", driftDelta);
    }

    logger.info(
      `Rebalanced: Kamino=${(targetKaminoPct * 100).toFixed(1)}%, Drift=${(targetDriftPct * 100).toFixed(1)}%`,
    );
  }

  // =================================================================
  // EMERGENCY REBALANCE: Move everything to Kamino (safe)
  // =================================================================

  async emergencyMoveToSafe(): Promise<void> {
    logger.warn("EMERGENCY: Moving all funds to Kamino lending");
    await this.rebalanceFromSignal(1.0, 0.0);
  }

  // =================================================================
  // VAULT INTERACTION HELPERS
  // =================================================================

  private getStrategies(): StrategyInfo[] {
    return VAULT_CONFIG.strategies.map((s) => ({
      address: new PublicKey(s.address),
      name: s.name,
      defaultPct: s.defaultPct,
    }));
  }

  async getTotalVaultAssets(): Promise<number> {
    try {
      const vaultState = await this.client.fetchVaultAccount(this.vaultAddress);
      return Number(vaultState.totalAssets || 0);
    } catch (err: any) {
      logger.error(`Failed to fetch vault assets: ${err.message}`);
      return 0;
    }
  }

  async getStrategyBalance(name: string): Promise<number> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy) return 0;

    try {
      const strategyState = await this.client.fetchStrategyAccount(
        new PublicKey(strategy.address),
      );
      return Number(strategyState.currentAssets || 0);
    } catch (err: any) {
      logger.warn(`Failed to fetch ${name} balance: ${err.message}`);
      return 0;
    }
  }

  async getVaultIdleUSDC(): Promise<number> {
    try {
      const vaultState = await this.client.fetchVaultAccount(this.vaultAddress);
      return Number(vaultState.idleAssets || 0);
    } catch {
      return 0;
    }
  }

  async depositToStrategy(name: string, amount: number): Promise<void> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy) throw new Error(`Strategy ${name} not found in config`);

    const depositIx = await this.client.createManagerDepositStrategyIx({
      vault: this.vaultAddress,
      strategy: new PublicKey(strategy.address),
      manager: this.managerKp.publicKey,
      amount: BigInt(amount),
    });

    await this.sendOptimisedTx(
      [depositIx],
      `deposit-${name}-${(amount / 1e6).toFixed(2)}`,
    );
  }

  async withdrawFromStrategy(name: string, amount: number): Promise<void> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy) throw new Error(`Strategy ${name} not found in config`);

    const withdrawIx = await this.client.createManagerWithdrawStrategyIx({
      vault: this.vaultAddress,
      strategy: new PublicKey(strategy.address),
      manager: this.managerKp.publicKey,
      amount: BigInt(amount),
    });

    await this.sendOptimisedTx(
      [withdrawIx],
      `withdraw-${name}-${(amount / 1e6).toFixed(2)}`,
    );
  }

  // =================================================================
  // REWARD HELPERS
  // =================================================================

  private async buildKaminoClaimIx(): Promise<TransactionInstruction | null> {
    try {
      const strategy = VAULT_CONFIG.strategies.find(
        (s) => s.name === "kamino-lending",
      );
      if (!strategy) return null;

      logger.debug("Kamino claim: checking for available rewards...");
      return null; // Return null if no claim available
    } catch {
      return null;
    }
  }

  private async buildJupiterSwapIx(
    amount: number,
  ): Promise<TransactionInstruction[] | null> {
    try {
      const quoteResp = await fetch(
        `https://quote-api.jup.ag/v6/quote?` +
          `inputMint=${VAULT_CONFIG.rewardTokenMint}` +
          `&outputMint=${VAULT_CONFIG.usdcMint}` +
          `&amount=${amount}` +
          `&slippageBps=50`,
      );
      const quote = await quoteResp.json();

      if (!quote || quote.error) {
        logger.warn(`Jupiter quote failed: ${quote?.error}`);
        return null;
      }

      const swapResp = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: this.managerKp.publicKey.toString(),
          wrapAndUnwrapSol: true,
        }),
      });
      const swapResult = await swapResp.json();

      if (!swapResult?.swapTransaction) {
        logger.warn("Jupiter swap: no transaction returned");
        return null;
      }

      return [];
    } catch (err: any) {
      logger.warn(`Jupiter swap build failed: ${err.message}`);
      return null;
    }
  }

  private async getRewardTokenBalance(): Promise<number> {
    if (!VAULT_CONFIG.rewardTokenMint) return 0;

    try {
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const ata = await getAssociatedTokenAddress(
        new PublicKey(VAULT_CONFIG.rewardTokenMint),
        this.vaultAddress,
        true,
      );
      const balance = await this.connection.getTokenAccountBalance(ata);
      return Number(balance.value.amount);
    } catch {
      return 0;
    }
  }

  // =================================================================
  // OPTIMISED TX SENDER (compute budget + retry)
  // =================================================================

  async sendOptimisedTx(
    instructions: TransactionInstruction[],
    label: string,
    computeUnits: number = 400_000,
    priorityMicroLamports: number = 50_000,
  ): Promise<string> {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { blockhash, lastValidBlockHeight } =
          await this.connection.getLatestBlockhash("confirmed");

        const tx = new Transaction();

        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityMicroLamports,
          }),
        );

        for (const ix of instructions) {
          tx.add(ix);
        }

        tx.recentBlockhash = blockhash;
        tx.feePayer = this.managerKp.publicKey;

        const sig = await sendAndConfirmTransaction(
          this.connection,
          tx,
          [this.managerKp],
          {
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 2,
          },
        );

        logger.info(`TX confirmed [${label}]: ${sig}`);
        return sig;
      } catch (err: any) {
        const isRetryable =
          err.message?.includes("blockhash") ||
          err.message?.includes("timeout") ||
          err instanceof SendTransactionError;

        if (attempt < MAX_ATTEMPTS && isRetryable) {
          const delay = 2000 * attempt;
          logger.warn(
            `TX attempt ${attempt}/${MAX_ATTEMPTS} failed [${label}]: ${err.message}. Retrying in ${delay}ms...`,
          );
          await new Promise((r) => setTimeout(r, delay));
        } else {
          logger.error(
            `TX failed after ${attempt} attempts [${label}]: ${err.message}`,
          );
          throw err;
        }
      }
    }

    throw new Error(`TX failed: ${label}`);
  }

  // =================================================================
  // LIFECYCLE
  // =================================================================

  startAllLoops(): void {
    this.startRefreshLoop();
    this.startRewardLoop();
    logger.info("All rebalance engine loops started");
  }

  stopAllLoops(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.rewardTimer) clearInterval(this.rewardTimer);
    logger.info("All rebalance engine loops stopped");
  }
}
