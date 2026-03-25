// tests/integration/test_full_flow.ts
// End-to-end: signal fetch -> risk check -> trade decision

import { SignalClient } from "../../keeper/src/core/signal-client";
import { StateManager } from "../../keeper/src/core/state-manager";
import { RiskChecker } from "../../keeper/src/risk/risk-checker";
import { SIGNAL_THRESHOLDS, RISK_PARAMS } from "../../keeper/src/config";

describe("Full Flow Integration", () => {
  let signalClient: SignalClient;
  let stateManager: StateManager;
  let riskChecker: RiskChecker;

  beforeAll(() => {
    signalClient = new SignalClient();
    stateManager = new StateManager();
    riskChecker = new RiskChecker(stateManager);
  });

  test("state manager initializes clean", () => {
    const state = stateManager.getState();
    expect(state.positions).toEqual([]);
    expect(state.isRunning).toBe(false);
    expect(state.dailyPnl).toBe(0);
  });

  test("risk checker allows first trade", () => {
    const action = {
      type: "open_long" as const,
      asset: "SOL-PERP",
      size: 0.1,
      signal: 0.7,
      confidence: 0.6,
      reason: "test",
    };
    expect(riskChecker.preTradeCheck(action)).toBe(true);
  });

  test("position flow: add -> check -> remove", () => {
    stateManager.addPosition({
      asset: "SOL-PERP",
      side: "long",
      size: 0.2,
      entryPrice: 150,
      currentPrice: 155,
      unrealizedPnl: 10,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    expect(stateManager.getOpenPositionCount()).toBe(1);

    const removed = stateManager.removePosition("SOL-PERP");
    expect(removed).not.toBeNull();
    expect(stateManager.getOpenPositionCount()).toBe(0);
  });

  test("config values are within safe bounds", () => {
    expect(RISK_PARAMS.maxDailyDrawdown).toBeLessThanOrEqual(0.05);
    expect(RISK_PARAMS.maxLeverage).toBeLessThanOrEqual(3.0);
    expect(SIGNAL_THRESHOLDS.longEntry).toBe(-SIGNAL_THRESHOLDS.shortEntry);
  });
});
