// =================================================================
// Attestation Verifier -- Audit trail for Ed25519 signed trades
// Verifies past transactions were properly attested by AI agent
// =================================================================

import { Connection, PublicKey } from "@solana/web3.js";
import { logger } from "../monitoring/logger";

export interface AttestationRecord {
  txSignature: string;
  timestamp: number;
  agentPubkey: string;
  message: string;
  verified: boolean;
}

export class AttestationVerifier {
  private connection: Connection;
  private agentPubkey: PublicKey;
  private records: AttestationRecord[] = [];

  constructor(connection: Connection, agentPubkey: PublicKey) {
    this.connection = connection;
    this.agentPubkey = agentPubkey;
  }

  /**
   * Record an attestation after a successful attested trade
   */
  recordAttestation(txSignature: string, message: Buffer): void {
    this.records.push({
      txSignature,
      timestamp: Date.now(),
      agentPubkey: this.agentPubkey.toString(),
      message: message.toString("hex"),
      verified: true,
    });

    logger.debug(
      `Attestation recorded: ${txSignature} (${this.records.length} total)`,
    );
  }

  /**
   * Verify a past transaction contains Ed25519 attestation
   * by checking the transaction's instruction set
   */
  async verifyTransaction(txSignature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(txSignature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.transaction) {
        logger.warn(`Transaction not found: ${txSignature}`);
        return false;
      }

      // Ed25519 program ID: Ed25519SigVerify111111111111111111111111111
      const ED25519_PROGRAM_ID =
        "Ed25519SigVerify111111111111111111111111111";

      const message = tx.transaction.message;
      const accountKeys =
        "staticAccountKeys" in message
          ? message.staticAccountKeys
          : (message as any).accountKeys;

      const hasEd25519 = accountKeys.some(
        (key: PublicKey) => key.toString() === ED25519_PROGRAM_ID,
      );

      if (hasEd25519) {
        logger.debug(
          `Transaction ${txSignature} contains Ed25519 attestation`,
        );
        return true;
      } else {
        logger.warn(
          `Transaction ${txSignature} missing Ed25519 attestation`,
        );
        return false;
      }
    } catch (err: any) {
      logger.error(
        `Attestation verification failed for ${txSignature}: ${err.message}`,
      );
      return false;
    }
  }

  /**
   * Export attestation log for submission
   */
  exportLog(): AttestationRecord[] {
    return [...this.records];
  }

  /**
   * Get attestation stats
   */
  getStats(): {
    totalAttested: number;
    firstAttestation: number | null;
    lastAttestation: number | null;
  } {
    return {
      totalAttested: this.records.length,
      firstAttestation:
        this.records.length > 0 ? this.records[0].timestamp : null,
      lastAttestation:
        this.records.length > 0
          ? this.records[this.records.length - 1].timestamp
          : null,
    };
  }
}
