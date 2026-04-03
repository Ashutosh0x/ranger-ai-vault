"use client";

import {
  Connection,
  Transaction,
  VersionedTransaction,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export interface TxResult {
  signature: TransactionSignature;
  confirmed: boolean;
  error?: string;
}

/**
 * Sign, send, and confirm a transaction via the user's wallet.
 */
export async function signSendConfirm(
  connection: Connection,
  wallet: WalletContextState,
  transaction: Transaction | VersionedTransaction,
  options?: {
    commitment?: Commitment;
    skipPreflight?: boolean;
    maxRetries?: number;
  }
): Promise<TxResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    if (transaction instanceof Transaction) {
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
    }

    const signed = await wallet.signTransaction(transaction);

    const signature = await connection.sendRawTransaction(
      signed.serialize(),
      {
        skipPreflight: options?.skipPreflight ?? false,
        maxRetries: options?.maxRetries ?? 3,
        preflightCommitment: "confirmed",
      }
    );

    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      options?.commitment ?? "confirmed"
    );

    if (confirmation.value.err) {
      return {
        signature,
        confirmed: false,
        error: JSON.stringify(confirmation.value.err),
      };
    }

    return { signature, confirmed: true };
  } catch (err: any) {
    if (err.message?.includes("User rejected")) {
      return {
        signature: "",
        confirmed: false,
        error: "Transaction rejected by user",
      };
    }
    throw err;
  }
}
