// keeper/tests/drift-executor.test.ts

import { DriftExecutor } from "../src/execution/drift-executor";
import { DriftClient } from "@drift-labs/sdk";
import { Connection } from "@solana/web3.js";

describe("DriftExecutor", () => {
  let executor: DriftExecutor;

  beforeEach(() => {
    const mockConnection = {} as Connection;
    const driftClient = new DriftClient(mockConnection);
    executor = new DriftExecutor(driftClient);
  });

  test("getOraclePrice returns valid prices", () => {
    const solPrice = executor.getOraclePrice("SOL-PERP");
    expect(solPrice).toBeGreaterThan(0);
    expect(solPrice).toBe(150);

    const btcPrice = executor.getOraclePrice("BTC-PERP");
    expect(btcPrice).toBe(65000);

    const ethPrice = executor.getOraclePrice("ETH-PERP");
    expect(ethPrice).toBe(3500);
  });

  test("getOraclePrice returns 0 for unknown asset", () => {
    const price = executor.getOraclePrice("UNKNOWN-PERP");
    expect(price).toBe(0);
  });

  test("openPosition validates asset", async () => {
    await expect(
      executor.openPosition({
        asset: "FAKE-PERP",
        direction: "long",
        sizeUsd: 1000,
      }),
    ).rejects.toThrow();
  });

  test("openPosition returns tx signature for valid params", async () => {
    const sig = await executor.openPosition({
      asset: "SOL-PERP",
      direction: "long",
      sizeUsd: 1000,
    });

    expect(sig).toBeTruthy();
    expect(typeof sig).toBe("string");
    expect(sig.startsWith("mock_tx_signature_")).toBe(true);
  });

  test("getPosition returns position info", async () => {
    const pos = await executor.getPosition("SOL-PERP");

    expect(pos).not.toBeNull();
    expect(pos!.asset).toBe("SOL-PERP");
    expect(pos!.markPrice).toBeGreaterThan(0);
  });

  test("getPosition returns null for unknown asset", async () => {
    const pos = await executor.getPosition("FAKE-PERP");
    expect(pos).toBeNull();
  });

  test("getAllPositions returns array", async () => {
    const positions = await executor.getAllPositions();
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBe(3);
  });

  test("getFundingRate returns number", () => {
    const rate = executor.getFundingRate("SOL-PERP");
    expect(typeof rate).toBe("number");
  });
});
