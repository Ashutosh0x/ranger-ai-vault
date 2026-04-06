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
import nacl from "tweetnacl";
import { VAULT_CONFIG } from "../config";
import { logger } from "../monitoring/logger";

export class AIAttestor {
  private agentKeypair: Keypair;

  constructor() {
    const keypairPath = VAULT_CONFIG.agentKeypairPath;
    if (!fs.existsSync(keypairPath)) {
      throw new Error(
        `FATAL: Agent keypair not found at '${keypairPath}'. ` +
        `Generate with: solana-keygen new --no-passphrase -o ${keypairPath}`,
      );
    }
    const raw = fs.readFileSync(keypairPath, "utf-8");
    this.agentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(raw)),
    );
    logger.info(`AI Agent pubkey: ${this.agentKeypair.publicKey.toString()}`);
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
   * Sign arbitrary message with agent keypair using Ed25519 (nacl).
   */
  signMessage(message: Buffer): Buffer {
    const signature = nacl.sign.detached(
      new Uint8Array(message),
      this.agentKeypair.secretKey,
    );
    return Buffer.from(signature);
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
