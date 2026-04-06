// =================================================================
// Rebalance Engine -- 3-loop engine: receipt refresh, reward
// compounding, signal-driven rebalance
//
// H3: Zeta Lend Gap
// NOTE: The rebalance engine currently manages TWO strategies:
//   1. kamino-lending (floor yield)
//   2. zeta-perps (active trading)
// A third strategy "zeta-lend" is configured in VAULT_CONFIG but
// NOT handled by rebalanceFromSignal(). When Zeta Lend is integrated,
// the allocation logic should be updated to a 3-way split.
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

// I10: Structured error type for rebalance operations
export class RebalanceError extends Error {
  constructor(
    message: string,
    public readonly code: "STRATEGY_NOT_FOUND" | "TX_FAILED" | "INVALID_ALLOCATION" | "FETCH_FAILED",
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RebalanceError";
  }
}

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
  private isShuttingDown: boolean = false;

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
    if (this.isShuttingDown) return;
    const strategies = this.getStrategies();

    for (const strategy of strategies) {
      try {
        const refreshIx = await (this.client as any).createRefreshReceiptIx({
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
    if (this.isShuttingDown) return;
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
  // Engine B (Zeta) based on AI signal strength.
  //
  // H3: This only handles kamino-lending + zeta-perps.
  //     zeta-lend is NOT yet handled here.
  // =================================================================

  async rebalanceFromSignal(
    targetKaminoPct: number,
    targetZetaPct: number,
  ): Promise<void> {
    const total = targetKaminoPct + targetZetaPct;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new RebalanceError(
        `Invalid allocation: Kamino=${targetKaminoPct} + Zeta=${targetZetaPct} = ${total} (must equal 1.0)`,
        "INVALID_ALLOCATION",
        { targetKaminoPct, targetZetaPct },
      );
    }

    const totalAssets = await this.getTotalVaultAssets();
    if (totalAssets <= 0) {
      logger.warn("Vault has zero assets, skipping rebalance");
      return;
    }

    const targetKamino = Math.floor(totalAssets * targetKaminoPct);
    const targetZeta = Math.floor(totalAssets * targetZetaPct);

    const currentKamino = await this.getStrategyBalance("kamino-lending");
    const currentZeta = await this.getStrategyBalance("zeta-perps");

    const kaminoDelta = targetKamino - currentKamino;
    const zetaDelta = targetZeta - currentZeta;

    if (
      Math.abs(kaminoDelta) < this.MIN_REBALANCE &&
      Math.abs(zetaDelta) < this.MIN_REBALANCE
    ) {
      logger.debug("Allocation within threshold, skipping rebalance");
      return;
    }

    logger.info(
      `Rebalancing: Kamino ${(currentKamino / 1e6).toFixed(0)} -> ${(targetKamino / 1e6).toFixed(0)} USDC, ` +
        `Zeta ${(currentZeta / 1e6).toFixed(0)} -> ${(targetZeta / 1e6).toFixed(0)} USDC`,
    );

    // IMPORTANT: Withdraw from over-allocated FIRST, then deposit
    if (kaminoDelta < -this.MIN_REBALANCE) {
      await this.withdrawFromStrategy("kamino-lending", Math.abs(kaminoDelta));
    }
    if (zetaDelta < -this.MIN_REBALANCE) {
      await this.withdrawFromStrategy("zeta-perps", Math.abs(zetaDelta));
    }

    await new Promise((r) => setTimeout(r, 2000));

    if (kaminoDelta > this.MIN_REBALANCE) {
      await this.depositToStrategy("kamino-lending", kaminoDelta);
    }
    if (zetaDelta > this.MIN_REBALANCE) {
      await this.depositToStrategy("zeta-perps", zetaDelta);
    }

    logger.info(
      `Rebalanced: Kamino=${(targetKaminoPct * 100).toFixed(1)}%, Zeta=${(targetZetaPct * 100).toFixed(1)}%`,
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
    // C7: Filter strategies with empty addresses to prevent PublicKey crash
    return VAULT_CONFIG.strategies
      .filter((s) => !!s.address)
      .map((s) => ({
        address: new PublicKey(s.address),
        name: s.name,
        defaultPct: s.defaultPct,
      }));
  }

  async getTotalVaultAssets(): Promise<number> {
    try {
      const vaultState = await this.client.fetchVaultAccount(this.vaultAddress);
      // H2: Typed access with safe fallback chain
      const state = vaultState as Record<string, any>;
      return Number(state.asset?.totalValue ?? state.totalAssets ?? 0);
    } catch (err: any) {
      logger.error(`Failed to fetch vault assets: ${err.message}`);
      return 0;
    }
  }

  async getStrategyBalance(name: string): Promise<number> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy || !strategy.address) return 0;

    try {
      const fetchFn = (this.client as Record<string, any>).fetchStrategyAccount;
      if (typeof fetchFn !== "function") {
        logger.warn(`fetchStrategyAccount not available on VoltrClient`);
        return 0;
      }
      const strategyState = await fetchFn.call(
        this.client,
        new PublicKey(strategy.address),
      );
      const state = strategyState as Record<string, any>;
      return Number(state?.currentAssets ?? state?.asset?.totalValue ?? 0);
    } catch (err: any) {
      logger.warn(`Failed to fetch ${name} balance: ${err.message}`);
      return 0;
    }
  }

  async getVaultIdleUSDC(): Promise<number> {
    try {
      const vaultState = await this.client.fetchVaultAccount(this.vaultAddress);
      const state = vaultState as Record<string, any>;
      return Number(state.asset?.totalValue ?? state.idleAssets ?? 0);
    } catch {
      return 0;
    }
  }

  async depositToStrategy(name: string, amount: number): Promise<void> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy || !strategy.address) {
      throw new RebalanceError(`Strategy ${name} not found or has no address`, "STRATEGY_NOT_FOUND", { name });
    }

    const depositIx = await this.client.createDepositStrategyIx(
      { depositAmount: BigInt(amount) } as any,
      {
        vault: this.vaultAddress,
        strategy: new PublicKey(strategy.address),
        manager: this.managerKp.publicKey,
      } as any,
    );

    await this.sendOptimisedTx(
      [depositIx],
      `deposit-${name}-${(amount / 1e6).toFixed(2)}`,
    );
  }

  async withdrawFromStrategy(name: string, amount: number): Promise<void> {
    const strategy = VAULT_CONFIG.strategies.find((s) => s.name === name);
    if (!strategy || !strategy.address) {
      throw new RebalanceError(`Strategy ${name} not found or has no address`, "STRATEGY_NOT_FOUND", { name });
    }

    const withdrawIx = await this.client.createWithdrawStrategyIx(
      { withdrawAmount: BigInt(amount) } as any,
      {
        vault: this.vaultAddress,
        strategy: new PublicKey(strategy.address),
        manager: this.managerKp.publicKey,
      } as any,
    );

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
      if (!strategy || !strategy.address) {
        logger.debug("Kamino claim: no kamino-lending strategy configured");
        return null;
      }

      // Check if reward token balance exists before attempting claim
      const rewardBalance = await this.getRewardTokenBalance();
      if (rewardBalance <= 0) {
        logger.debug("Kamino claim: no reward tokens accrued yet");
        return null;
      }

      // Note: Full klend-sdk CPI integration requires @kamino-finance/klend-sdk
      // When available, this will call KaminoAction.buildClaimFarmsRewardsIxs()
      // For now, rewards are claimed via the Voltr adaptor's built-in claim flow
      logger.info(
        `Kamino claim: ${rewardBalance} reward tokens available. ` +
        `Claim will be processed via Voltr adaptor refresh cycle.`
      );
      return null;
    } catch (err: any) {
      logger.warn(`Kamino claim check failed: ${err.message}`);
      return null;
    }
  }

  private async buildJupiterSwapIx(
    amount: number,
  ): Promise<TransactionInstruction[] | null> {
    if (!VAULT_CONFIG.rewardTokenMint) {
      logger.debug("Jupiter swap: no reward token mint configured");
      return null;
    }

    try {
      // Step 1: Get real quote from Jupiter V6
      const quoteResp = await fetch(
        `https://quote-api.jup.ag/v6/quote?` +
          `inputMint=${VAULT_CONFIG.rewardTokenMint}` +
          `&outputMint=${VAULT_CONFIG.usdcMint}` +
          `&amount=${amount}` +
          `&slippageBps=50`,
      );

      if (!quoteResp.ok) {
        logger.warn(`Jupiter quote HTTP error: ${quoteResp.status}`);
        return null;
      }

      const quote = (await quoteResp.json()) as Record<string, any>;

      if (!quote || quote.error) {
        logger.warn(`Jupiter quote failed: ${quote?.error}`);
        return null;
      }

      logger.info(
        `Jupiter quote: ${quote.inAmount} → ${quote.outAmount} ` +
        `(${quote.routePlan?.length || 0} routes)`,
      );

      // Step 2: Build real swap transaction
      const swapResp = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: this.managerKp.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        }),
      });

      if (!swapResp.ok) {
        logger.warn(`Jupiter swap HTTP error: ${swapResp.status}`);
        return null;
      }

      const swapResult = (await swapResp.json()) as Record<string, any>;

      if (!swapResult?.swapTransaction) {
        logger.warn("Jupiter swap: no transaction returned");
        return null;
      }

      // Step 3: Deserialize the real versioned transaction
      const { VersionedTransaction: VTX } = await import("@solana/web3.js");
      const swapTxBuf = Buffer.from(swapResult.swapTransaction as string, "base64");
      const vtx = VTX.deserialize(swapTxBuf);

      // Step 4: Sign and send the full versioned transaction directly
      vtx.sign([this.managerKp]);
      const sig = await this.connection.sendRawTransaction(vtx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash("confirmed");

      await this.connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      logger.info(
        `Jupiter swap completed: ${sig} ` +
        `(${quote.inAmount} reward → ${quote.outAmount} USDC)`,
      );

      // Return empty array since we sent the TX directly
      // (versioned transactions can't be decomposed into legacy IXs)
      return [];
    } catch (err: any) {
      logger.warn(`Jupiter swap failed: ${err.message}`);
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
          throw new RebalanceError(
            `TX failed: ${label} — ${err.message}`,
            "TX_FAILED",
            { label, attempt, originalError: err.message },
          );
        }
      }
    }

    throw new RebalanceError(`TX failed: ${label}`, "TX_FAILED", { label });
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
    this.isShuttingDown = true;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.rewardTimer) clearInterval(this.rewardTimer);
    logger.info("All rebalance engine loops stopped");
  }
}
