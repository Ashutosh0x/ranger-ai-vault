// ═══════════════════════════════════════════════════════
// AI Attestation — Ed25519 signing of trade instructions
// ═══════════════════════════════════════════════════════
// Every trade TX is signed by the AI agent keypair.
// The vault program rejects unsigned trades.

import {
  Keypair,
  TransactionInstruction,
  Ed25519Program,
} from "@solana/web3.js";
import * as fs from "fs";
import * as crypto from "crypto";
import { VAULT_CONFIG } from "../config";
import { logger } from "../monitoring/logger";

export class AIAttestor {
  private agentKeypair: Keypair;

  constructor() {
    const keypairPath = VAULT_CONFIG.agentKeypairPath;
    if (fs.existsSync(keypairPath)) {
      const raw = fs.readFileSync(keypairPath, "utf-8");
      this.agentKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(raw)),
      );
      logger.info(`AI Agent pubkey: ${this.agentKeypair.publicKey.toString()}`);
    } else {
      // Generate ephemeral keypair for testing
      this.agentKeypair = Keypair.generate();
      logger.warn("Using ephemeral agent keypair — generate a persistent one for production");
    }
  }

  /**
   * Sign a trade instruction with the AI agent's Ed25519 keypair.
   * Returns an Ed25519 verification instruction to prepend to the TX.
   */
  createAttestationIx(
    tradeInstruction: TransactionInstruction,
  ): TransactionInstruction {
    const message = tradeInstruction.data;

    // Create Ed25519 verification instruction
    const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: this.agentKeypair.secretKey.slice(0, 32),
      message: Buffer.from(message),
    });

    logger.info("Trade attested with Ed25519 signature");
    return ed25519Ix;
  }

  /**
   * Sign arbitrary message with agent keypair.
   */
  signMessage(message: Buffer): Buffer {
    const signature = crypto.sign(
      null,
      message,
      {
        key: Buffer.from(this.agentKeypair.secretKey),
        format: "der",
        type: "pkcs8",
      },
    );
    return signature;
  }

  /**
   * Build an attested transaction: Ed25519 verify IX + trade IX.
   */
  buildAttestedInstructions(
    tradeInstructions: TransactionInstruction[],
  ): TransactionInstruction[] {
    const result: TransactionInstruction[] = [];

    for (const ix of tradeInstructions) {
      // Prepend attestation for each trade instruction
      const attestIx = this.createAttestationIx(ix);
      result.push(attestIx);
      result.push(ix);
    }

    return result;
  }

  getAgentPublicKey(): string {
    return this.agentKeypair.publicKey.toString();
  }
}
