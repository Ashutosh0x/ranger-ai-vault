// keeper/tests/state-manager.test.ts
import { StateManager } from "../src/core/state-manager";

describe("StateManager", () => {
  let sm: StateManager;

  beforeEach(() => {
    sm = new StateManager();
  });

  test("initial state", () => {
    const state = sm.getState();
    expect(state.positions).toEqual([]);
    expect(state.totalTrades).toBe(0);
    expect(state.isRunning).toBe(false);
  });

  test("add and get position", () => {
    sm.addPosition({
      asset: "SOL-PERP",
      side: "long",
      size: 0.2,
      entryPrice: 150,
      currentPrice: 155,
      unrealizedPnl: 5,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    expect(sm.getOpenPositionCount()).toBe(1);
    const pos = sm.getPosition("SOL-PERP");
    expect(pos).not.toBeNull();
    expect(pos!.side).toBe("long");
  });

  test("remove position", () => {
    sm.addPosition({
      asset: "BTC-PERP",
      side: "short",
      size: 0.1,
      entryPrice: 60000,
      currentPrice: 59000,
      unrealizedPnl: 100,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    const removed = sm.removePosition("BTC-PERP");
    expect(removed).not.toBeNull();
    expect(sm.getOpenPositionCount()).toBe(0);
  });

  test("net delta calculation", () => {
    sm.addPosition({
      asset: "SOL-PERP",
      side: "long",
      size: 0.2,
      entryPrice: 150,
      currentPrice: 150,
      unrealizedPnl: 0,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    sm.addPosition({
      asset: "BTC-PERP",
      side: "short",
      size: 0.1,
      entryPrice: 60000,
      currentPrice: 60000,
      unrealizedPnl: 0,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    // Long 0.2 + Short -0.1 = 0.1
    expect(sm.getNetDelta()).toBeCloseTo(0.1);
  });

  test("record trade PnL", () => {
    sm.recordTradePnl(500);
    sm.recordTradePnl(-200);
    const state = sm.getState();
    expect(state.dailyPnl).toBe(300);
    expect(state.monthlyPnl).toBe(300);
  });
});
