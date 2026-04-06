// ═══════════════════════════════════════════════════════
// Helper — Optimised Transaction Sender
// ═══════════════════════════════════════════════════════
// Includes compute budget, priority fees, retry logic.
// Used by all vault scripts.

import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  SendTransactionError,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import * as fs from "fs";

// ═══ TX OPTIONS ═══
export interface TxOptions {
  computeUnits?: number;
  priorityMicroLamports?: number;
  maxRetries?: number;
  skipPreflight?: boolean;
}

const DEFAULT_TX_OPTIONS: TxOptions = {
  computeUnits: 400_000,
  priorityMicroLamports: 50_000,
  maxRetries: 3,
  skipPreflight: false,
};

// ═══ SEND OPTIMISED TRANSACTION ═══
export async function sendAndConfirmOptimisedTx(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  options: TxOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_TX_OPTIONS, ...options };

  const tx = new Transaction();

  // CRITICAL: Always prepend compute budget instructions
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: opts.computeUnits!,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: opts.priorityMicroLamports!,
    }),
  );

  // Add actual instructions
  for (const ix of instructions) {
    tx.add(ix);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    try {
      const sig = await sendAndConfirmTransaction(connection, tx, signers, {
        skipPreflight: opts.skipPreflight,
        commitment: "confirmed",
        maxRetries: 2,
      });

      console.log(`[OK] TX confirmed (attempt ${attempt}): ${sig}`);
      return sig;
    } catch (err: any) {
      lastError = err;

      if (err instanceof SendTransactionError) {
        const logs = err.logs;
        console.error(
          `[FAIL] TX attempt ${attempt}/${opts.maxRetries} failed:`,
          err.message,
        );
        if (logs) {
          console.error("   Logs:", logs.slice(-5).join("\n   "));
        }
      } else {
        console.error(`[FAIL] TX attempt ${attempt}/${opts.maxRetries}:`, err.message);
      }

      if (attempt < opts.maxRetries!) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Transaction failed after all retries");
}

// ═══ SEND VERSIONED TX (for larger transactions) ═══
export async function sendVersionedTx(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: Keypair,
  additionalSigners: Keypair[] = [],
  options: TxOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_TX_OPTIONS, ...options };

  const allIxs = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: opts.computeUnits! }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: opts.priorityMicroLamports!,
    }),
    ...instructions,
  ];

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: allIxs,
  }).compileToV0Message();

  const vtx = new VersionedTransaction(messageV0);
  vtx.sign([payer, ...additionalSigners]);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    try {
      const sig = await connection.sendRawTransaction(vtx.serialize(), {
        skipPreflight: opts.skipPreflight,
        maxRetries: 2,
        preflightCommitment: "confirmed",
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      console.log(`[OK] Versioned TX confirmed (attempt ${attempt}): ${sig}`);
      return sig;
    } catch (err: any) {
      lastError = err;
      console.error(`[FAIL] Versioned TX attempt ${attempt}: ${err.message}`);

      if (attempt < opts.maxRetries!) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Versioned TX failed after all retries");
}

// ═══ KEYPAIR LOADER ═══
export function loadKeypair(path: string): Keypair {
  const raw = fs.readFileSync(path, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secretKey);
}

// ═══ AIRDROP (devnet only) ═══
export async function requestAirdrop(
  connection: Connection,
  publicKey: any,
  amount: number = 2,
): Promise<void> {
  try {
    const sig = await connection.requestAirdrop(
      publicKey,
      amount * 1e9, // lamports
    );
    await connection.confirmTransaction(sig, "confirmed");
    console.log(`[AIRDROP] ${amount} SOL to ${publicKey.toString()}`);
  } catch (err) {
    console.warn("Airdrop failed (may not be on devnet):", err);
  }
}

// ═══ LOGGING ═══
export function logStep(step: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] [STEP] ${step}`);
  if (details) {
    console.log("   ", JSON.stringify(details, null, 2));
  }
}

export function logSuccess(message: string): void {
  console.log(`\n[OK] ${message}`);
}

export function logError(message: string, error?: any): void {
  console.error(`\n[ERROR] ${message}`);
  if (error) {
    console.error("   Error:", error.message || error);
  }
}
