// keeper/tests/risk-checker.test.ts

import { ZetaHealthMonitor, ZetaHealthState } from "../src/risk/zeta-health-monitor";
// NOTE: @zetamarkets/sdk API changed — use require() to avoid TS2305 on named exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zetaSdk = require("@zetamarkets/sdk");

describe("ZetaHealthMonitor", () => {
  let monitor: ZetaHealthMonitor;

  beforeEach(() => {
    // Create a mock ZetaClient-like object instead of calling the real constructor
    const mockZetaClient = {} as any;
    monitor = new ZetaHealthMonitor(mockZetaClient);
  });

  test("getHealthState returns valid state", async () => {
    const state = await monitor.getHealthState();
    expect(state).toHaveProperty("healthRatio");
    expect(state).toHaveProperty("totalCollateral");
    expect(state).toHaveProperty("leverage");
    expect(state).toHaveProperty("isAtRisk");
    expect(state).toHaveProperty("riskLevel");
    expect(typeof state.healthRatio).toBe("number");
    expect(state.healthRatio).toBeGreaterThanOrEqual(0);
    expect(state.healthRatio).toBeLessThanOrEqual(100);
  });

  test("safe health ratio returns safe risk level", async () => {
    const state = await monitor.getHealthState();
    expect(state.riskLevel).toBe("safe");
    expect(state.isAtRisk).toBe(false);
  });

  test("shouldEmergencyUnwind returns false for healthy state", async () => {
    expect(await monitor.shouldEmergencyUnwind()).toBe(false);
  });

  test("shouldReducePositions returns false for healthy state", async () => {
    expect(await monitor.shouldReducePositions()).toBe(false);
  });

  test("getReductionFactor returns 0 for safe state", () => {
    const safeState: ZetaHealthState = {
      healthRatio: 50, totalCollateral: 10000, maintenanceMarginReq: 2000,
      unrealizedPnl: 500, leverage: 1.5, freeCollateral: 5000,
      isAtRisk: false, riskLevel: "safe",
    };
    expect(monitor.getReductionFactor(safeState)).toBe(0);
  });

  test("getReductionFactor returns 1.0 for critical state", () => {
    const criticalState: ZetaHealthState = {
      healthRatio: 5, totalCollateral: 2000, maintenanceMarginReq: 1900,
      unrealizedPnl: -500, leverage: 4.0, freeCollateral: 100,
      isAtRisk: true, riskLevel: "critical",
    };
    expect(monitor.getReductionFactor(criticalState)).toBe(1.0);
  });

  test("getReductionFactor scales linearly in warning zone", () => {
    const warningState: ZetaHealthState = {
      healthRatio: 15, totalCollateral: 5000, maintenanceMarginReq: 3000,
      unrealizedPnl: -200, leverage: 1.8, freeCollateral: 1000,
      isAtRisk: true, riskLevel: "warning",
    };
    const factor = monitor.getReductionFactor(warningState);
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThan(1);
  });

  test("getReductionFactor triggers for over-leverage", () => {
    const overLeveraged: ZetaHealthState = {
      healthRatio: 60, totalCollateral: 10000, maintenanceMarginReq: 2000,
      unrealizedPnl: 500, leverage: 3.0, freeCollateral: 5000,
      isAtRisk: true, riskLevel: "safe",
    };
    const factor = monitor.getReductionFactor(overLeveraged);
    expect(factor).toBeGreaterThan(0);
  });
});
