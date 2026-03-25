// keeper/tests/keeper-loop.test.ts

describe("KeeperLoop", () => {
  test("config has required risk parameters", () => {
    const config = jest.requireActual("../src/config");
    expect(config.RISK_PARAMS).toBeDefined();
    expect(config.RISK_PARAMS.maxDailyDrawdown).toBeLessThanOrEqual(0.05);
    expect(config.RISK_PARAMS.maxDailyDrawdown).toBeGreaterThan(0);
    expect(config.RISK_PARAMS.maxLeverage).toBeLessThanOrEqual(3.0);
    expect(config.RISK_PARAMS.maxLeverage).toBeGreaterThan(1.0);
    expect(config.RISK_PARAMS.stopLossPerTrade).toBeLessThan(0);
    expect(config.RISK_PARAMS.takeProfitPerTrade).toBeGreaterThan(0);
  });

  test("config has required execution parameters", () => {
    const config = jest.requireActual("../src/config");
    expect(config.EXECUTION_PARAMS).toBeDefined();
    expect(config.EXECUTION_PARAMS.assets).toContain("SOL-PERP");
    expect(config.EXECUTION_PARAMS.assets).toContain("BTC-PERP");
    expect(config.EXECUTION_PARAMS.assets).toContain("ETH-PERP");
    expect(config.EXECUTION_PARAMS.floorAllocationPct).toBeGreaterThanOrEqual(0.3);
    expect(
      config.EXECUTION_PARAMS.floorAllocationPct + config.EXECUTION_PARAMS.activeAllocationPct,
    ).toBeCloseTo(1.0);
  });

  test("signal thresholds are symmetric", () => {
    const config = jest.requireActual("../src/config");
    if (config.SIGNAL_THRESHOLDS) {
      expect(Math.abs(config.SIGNAL_THRESHOLDS.longEntry)).toBe(
        Math.abs(config.SIGNAL_THRESHOLDS.shortEntry),
      );
    }
  });
});
