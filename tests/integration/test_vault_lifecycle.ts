// tests/integration/test_vault_lifecycle.ts
// Vault state management lifecycle

import { StateManager } from "../../keeper/src/core/state-manager";

describe("Vault Lifecycle Integration", () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test("full position lifecycle", () => {
    // Open 3 positions
    for (const asset of ["SOL-PERP", "BTC-PERP", "ETH-PERP"]) {
      stateManager.addPosition({
        asset,
        side: "long",
        size: 0.15,
        entryPrice: 100,
        currentPrice: 100,
        unrealizedPnl: 0,
        leverage: 1,
        entryTimestamp: Date.now(),
      });
    }
    expect(stateManager.getOpenPositionCount()).toBe(3);

    // Close with profit
    const closed = stateManager.removePosition("SOL-PERP");
    expect(closed).not.toBeNull();
    stateManager.recordTradePnl(500);
    expect(stateManager.getState().dailyPnl).toBe(500);

    // Close with loss
    stateManager.removePosition("BTC-PERP");
    stateManager.recordTradePnl(-200);
    expect(stateManager.getState().dailyPnl).toBe(300);

    expect(stateManager.getOpenPositionCount()).toBe(1);
  });

  test("net delta tracking", () => {
    stateManager.addPosition({
      asset: "SOL-PERP",
      side: "long",
      size: 0.3,
      entryPrice: 150,
      currentPrice: 150,
      unrealizedPnl: 0,
      leverage: 1,
      entryTimestamp: Date.now(),
    });
    stateManager.addPosition({
      asset: "BTC-PERP",
      side: "short",
      size: 0.2,
      entryPrice: 60000,
      currentPrice: 60000,
      unrealizedPnl: 0,
      leverage: 1,
      entryTimestamp: Date.now(),
    });

    const delta = stateManager.getNetDelta();
    expect(delta).toBeCloseTo(0.1);
  });
});
