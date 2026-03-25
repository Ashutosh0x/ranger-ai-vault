// keeper/tests/attestation.test.ts

import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { AttestationVerifier } from "../src/attestation/attestation-verifier";

describe("AttestationVerifier", () => {
  let verifier: AttestationVerifier;
  let agentKp: Keypair;

  beforeEach(() => {
    agentKp = Keypair.generate();
    const mockConnection = {
      getTransaction: jest.fn().mockResolvedValue(null),
    } as unknown as Connection;
    verifier = new AttestationVerifier(mockConnection, agentKp.publicKey);
  });

  test("recordAttestation stores record", () => {
    const stats = verifier.getStats();
    expect(stats.totalAttested).toBe(0);

    verifier.recordAttestation("fake_sig_123", Buffer.from("test_message"));

    const statsAfter = verifier.getStats();
    expect(statsAfter.totalAttested).toBe(1);
    expect(statsAfter.firstAttestation).toBeTruthy();
    expect(statsAfter.lastAttestation).toBeTruthy();
  });

  test("exportLog returns all records", () => {
    verifier.recordAttestation("sig_1", Buffer.from("msg_1"));
    verifier.recordAttestation("sig_2", Buffer.from("msg_2"));
    verifier.recordAttestation("sig_3", Buffer.from("msg_3"));

    const log = verifier.exportLog();
    expect(log.length).toBe(3);
    expect(log[0].txSignature).toBe("sig_1");
    expect(log[2].txSignature).toBe("sig_3");
    expect(log[0].verified).toBe(true);
  });

  test("verifyTransaction returns false for non-existent tx", async () => {
    const result = await verifier.verifyTransaction("nonexistent_sig");
    expect(result).toBe(false);
  });

  test("getStats returns null timestamps when empty", () => {
    const stats = verifier.getStats();
    expect(stats.totalAttested).toBe(0);
    expect(stats.firstAttestation).toBeNull();
    expect(stats.lastAttestation).toBeNull();
  });

  test("exportLog returns copy (not reference)", () => {
    verifier.recordAttestation("sig_1", Buffer.from("msg_1"));
    const log1 = verifier.exportLog();
    const log2 = verifier.exportLog();
    expect(log1).not.toBe(log2);
    expect(log1).toEqual(log2);
  });
});
