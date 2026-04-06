// =================================================================
// Jupiter Executor -- Spot hedging via Jupiter swap
// Maintains delta neutrality: short perp + long spot = delta neutral
// =================================================================

import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import { logger } from "../monitoring/logger";

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";

// Token mints
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const BTC_MINT = "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh";
const ETH_MINT = "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs";

const ASSET_MINT_MAP: Record<string, string> = {
  "SOL-PERP": SOL_MINT,
  "BTC-PERP": BTC_MINT,
  "ETH-PERP": ETH_MINT,
};

const ASSET_DECIMALS_MAP: Record<string, number> = {
  "SOL-PERP": 9,
  "BTC-PERP": 8,
  "ETH-PERP": 8,
};

export class JupiterExecutor {
  private connection: Connection;
  private walletKp: Keypair;

  constructor(connection: Connection, walletKp: Keypair) {
    this.connection = connection;
    this.walletKp = walletKp;
  }

  /**
   * Buy spot asset with USDC (for delta hedge when shorting perps)
   * Short perp + long spot = delta neutral
   */
  async buySpot(asset: string, amountUsd: number): Promise<string> {
    const outputMint = ASSET_MINT_MAP[asset];
    if (!outputMint) throw new Error(`Unknown asset: ${asset}`);

    const amountLamports = Math.floor(amountUsd * 1e6);

    logger.info(
      `Buying spot ${asset}: $${amountUsd.toFixed(2)} USDC -> ${asset.replace("-PERP", "")}`,
    );

    return this.executeSwap(USDC_MINT, outputMint, amountLamports, "buy");
  }

  /**
   * Sell spot asset for USDC (unwinding spot hedge)
   */
  async sellSpot(
    asset: string,
    amountBase: number,
    decimals: number = 9,
  ): Promise<string> {
    const inputMint = ASSET_MINT_MAP[asset];
    if (!inputMint) throw new Error(`Unknown asset: ${asset}`);

    const amountLamports = Math.floor(amountBase * 10 ** decimals);

    logger.info(
      `Selling spot ${asset}: ${amountBase.toFixed(6)} ${asset.replace("-PERP", "")} -> USDC`,
    );

    return this.executeSwap(inputMint, USDC_MINT, amountLamports, "sell");
  }

  /**
   * H7: Get spot token balance for an asset in the manager wallet.
   * Used by EmergencyUnwind step 2 to check actual spot holdings.
   */
  async getSpotBalance(asset: string): Promise<number> {
    const mint = ASSET_MINT_MAP[asset];
    if (!mint) return 0;

    try {
      // For native SOL, check lamport balance
      if (mint === SOL_MINT) {
        const balance = await this.connection.getBalance(this.walletKp.publicKey);
        // Reserve 0.05 SOL for fees
        const usableBalance = Math.max(0, balance - 50_000_000);
        return usableBalance / 1e9;
      }

      // For SPL tokens, find the ATA
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const ata = await getAssociatedTokenAddress(
        new PublicKey(mint),
        this.walletKp.publicKey,
      );
      const tokenBalance = await this.connection.getTokenAccountBalance(ata);
      const decimals = ASSET_DECIMALS_MAP[asset] || 9;
      return Number(tokenBalance.value.amount) / (10 ** decimals);
    } catch {
      // Token account doesn't exist = 0 balance
      return 0;
    }
  }

  /**
   * Core swap execution via Jupiter V6 API
   */
  private async executeSwap(
    inputMint: string,
    outputMint: string,
    amount: number,
    label: string,
  ): Promise<string> {
    // Step 1: Get quote
    const quoteUrl =
      `${JUPITER_QUOTE_API}/quote?` +
      `inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&slippageBps=50` +
      `&onlyDirectRoutes=false`;

    const quoteResp = await fetch(quoteUrl);
    if (!quoteResp.ok) {
      throw new Error(
        `Jupiter quote failed: ${quoteResp.status} ${await quoteResp.text()}`,
      );
    }
    const quote = (await quoteResp.json()) as Record<string, any>;

    if (quote.error) {
      throw new Error(`Jupiter quote error: ${quote.error}`);
    }

    // Step 2: Build swap transaction
    const swapResp = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: this.walletKp.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!swapResp.ok) {
      throw new Error(
        `Jupiter swap build failed: ${swapResp.status} ${await swapResp.text()}`,
      );
    }

    const swapResult = (await swapResp.json()) as Record<string, any>;
    const swapTransaction = swapResult.swapTransaction as string | undefined;
    if (!swapTransaction) {
      throw new Error("Jupiter returned no swap transaction");
    }

    // Step 3: Deserialize, sign, and send
    const txBuf = Buffer.from(swapTransaction, "base64");
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([this.walletKp]);

    const sig = await this.connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash("confirmed");

    await this.connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    logger.info(`Jupiter swap [${label}]: ${sig}`);
    return sig;
  }
}
