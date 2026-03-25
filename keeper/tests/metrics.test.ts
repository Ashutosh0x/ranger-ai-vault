// keeper/tests/metrics.test.ts
import { MetricsCollector } from "../src/monitoring/metrics";

describe("MetricsCollector", () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector();
  });

  test("initial metrics are zero", () => {
    const result = metrics.compute();
    expect(result.totalTrades).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.sharpeRatio).toBe(0);
  });

  test("records trades", () => {
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
      pnlUsd: -50,
      pnlPct: -0.005,
      durationMs: 30000,
    });
    const result = metrics.compute();
    expect(result.totalTrades).toBe(2);
    expect(result.profitableTrades).toBe(1);
    expect(result.winRate).toBe(0.5);
  });

  test("daily returns affect sharpe", () => {
    for (let i = 0; i < 30; i++) {
      metrics.recordDailyReturn(0.001 + Math.random() * 0.002);
    }
    const result = metrics.compute();
    expect(result.sharpeRatio).toBeGreaterThan(0);
  });

  test("exportJSON produces valid JSON", () => {
    const json = metrics.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.totalTrades).toBe(0);
  });
});
