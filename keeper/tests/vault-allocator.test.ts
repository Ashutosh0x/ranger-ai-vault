// keeper/tests/vault-allocator.test.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { VaultAllocator } from "../src/execution/vault-allocator";

jest.mock("../src/config", () => ({
  VAULT_CONFIG: {
    strategies: [
      { name: "kamino-lending", address: "11111111111111111111111111111111", defaultPct: 0.5 },
      { name: "drift-perps", address: "22222222222222222222222222222222", defaultPct: 0.5 },
    ],
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    rewardTokenMint: null,
    rpcUrl: "https://api.devnet.solana.com",
    vaultAddress: "",
    managerKeypairPath: "",
    agentKeypairPath: "",
  },
  EXECUTION_PARAMS: {
    signalServerUrl: "http://localhost:8080",
    floorAllocationPct: 0.50,
    activeAllocationPct: 0.50,
    cronInterval: "*/15 * * * *",
    keeperSecret: "",
    assets: ["SOL-PERP", "BTC-PERP", "ETH-PERP"],
    minRebalanceUsdc: 10_000_000,
  },
  RISK_PARAMS: {
    maxDailyDrawdown: 0.03,
    maxLeverage: 2.0,
    maxMonthlyDrawdown: 0.08,
    maxNetDelta: 0.1,
    stopLossPerTrade: -0.005,
    takeProfitPerTrade: 0.015,
    maxConcurrentPositions: 3,
    kellyFraction: 0.25,
    minHealthRate: 1.5,
  },
  SIGNAL_THRESHOLDS: {
    longEntry: 0.6,
    shortEntry: -0.6,
    closeThreshold: 0.15,
    minConfidence: 0.3,
  },
}));

describe("VaultAllocator", () => {
  let allocator: VaultAllocator;

  beforeEach(() => {
    const mockConnection = new Connection("https://api.devnet.solana.com");
    const managerKp = Keypair.generate();
    const vaultAddress = Keypair.generate().publicKey;
    allocator = new VaultAllocator(mockConnection, managerKp, vaultAddress);
  });

  test("getStrategyBalances returns structured data", async () => {
    const balances = await allocator.getStrategyBalances();
    expect(balances).toHaveProperty("kamino");
    expect(balances).toHaveProperty("drift");
    expect(balances).toHaveProperty("idle");
    expect(typeof balances.kamino).toBe("number");
    expect(typeof balances.drift).toBe("number");
    expect(typeof balances.idle).toBe("number");
  });

  test("getVaultTVL returns positive number", async () => {
    const tvl = await allocator.getVaultTVL();
    expect(tvl).toBeGreaterThan(0);
  });

  test("getRebalanceEngine returns engine instance", () => {
    const engine = allocator.getRebalanceEngine();
    expect(engine).toBeTruthy();
    expect(typeof engine.rebalanceFromSignal).toBe("function");
    expect(typeof engine.emergencyMoveToSafe).toBe("function");
  });
});
