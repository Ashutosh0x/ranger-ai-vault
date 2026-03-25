// tests/integration/test_emergency_unwind.ts
// Emergency unwind flow

import { StateManager } from "../../keeper/src/core/state-manager";
import { MetricsCollector } from "../../keeper/src/monitoring/metrics";

describe("Emergency Unwind Integration", () => {
  let stateManager: StateManager;
  let metrics: MetricsCollector;

  beforeEach(() => {
    stateManager = new StateManager();
    metrics = new MetricsCollector();
  });

  test("emergency close all positions", () => {
    // Setup: 3 open positions
    for (const asset of ["SOL-PERP", "BTC-PERP", "ETH-PERP"]) {
      stateManager.addPosition({
        asset,
        side: "long",
        size: 0.15,
        entryPrice: 100,
        currentPrice: 95,
        unrealizedPnl: -50,
        leverage: 1.5,
        entryTimestamp: Date.now(),
      });
    }
    expect(stateManager.getOpenPositionCount()).toBe(3);

    // Emergency: close all
    const positions = stateManager.getAllPositions();
    for (const pos of positions) {
      const closed = stateManager.removePosition(pos.asset);
      if (closed) {
        stateManager.recordTradePnl(closed.unrealizedPnl);
        metrics.recordTrade({
          timestamp: Date.now(),
          asset: closed.asset,
          direction: closed.side,
          pnlUsd: closed.unrealizedPnl,
          pnlPct: closed.unrealizedPnl / (closed.size * closed.entryPrice),
          durationMs: Date.now() - closed.entryTimestamp,
        });
      }
    }

    expect(stateManager.getOpenPositionCount()).toBe(0);
    expect(stateManager.getState().dailyPnl).toBe(-150); // 3 x -50

    const stats = metrics.compute();
    expect(stats.totalTrades).toBe(3);
    expect(stats.profitableTrades).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  test("metrics track trade history correctly", () => {
    metrics.recordTrade({
      timestamp: Date.now(),
      asset: "SOL-PERP",
      direction: "long",
      pnlUsd: 100,
      pnlPct: 0.01,
      durationMs: 60000,
    });
    metrics.recordTrade({
      timestamp: Date.now(),
      asset: "BTC-PERP",
      direction: "short",
      pnlUsd: -40,
      pnlPct: -0.004,
      durationMs: 30000,
    });

    const stats = metrics.compute();
    expect(stats.totalTrades).toBe(2);
    expect(stats.profitableTrades).toBe(1);
    expect(stats.winRate).toBe(0.5);
  });
});
