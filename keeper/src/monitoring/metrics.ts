// =================================================================
// Metrics Collector -- Sharpe, win rate, funding, performance
// =================================================================

import { logger } from "./logger";

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalFundingCollected: number;
  totalFeesSpent: number;
}

interface TradeRecord {
  timestamp: number;
  asset: string;
  direction: "long" | "short";
  pnlUsd: number;
  pnlPct: number;
  durationMs: number;
}

export class MetricsCollector {
  private trades: TradeRecord[] = [];
  private dailyReturns: number[] = [];
  private peakNAV: number = 0;
  private currentNAV: number = 0;
  private startTime: number = Date.now();
  private totalFunding: number = 0;
  private totalFees: number = 0;

  recordTrade(trade: TradeRecord): void {
    this.trades.push(trade);
    logger.debug(`Trade recorded: ${trade.asset} ${trade.direction} $${trade.pnlUsd.toFixed(2)}`);
  }

  recordDailyReturn(returnPct: number): void {
    this.dailyReturns.push(returnPct);
  }

  updateNAV(nav: number): void {
    this.currentNAV = nav;
    if (nav > this.peakNAV) this.peakNAV = nav;
  }

  addFunding(amount: number): void { this.totalFunding += amount; }
  addFees(amount: number): void { this.totalFees += amount; }

  compute(): PerformanceMetrics {
    const wins = this.trades.filter((t) => t.pnlUsd > 0);
    const losses = this.trades.filter((t) => t.pnlUsd <= 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;
    const grossProfit = wins.reduce((s, t) => s + t.pnlUsd, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlUsd, 0));

    const avgReturn = this.dailyReturns.length > 0 ? this.dailyReturns.reduce((a, b) => a + b, 0) / this.dailyReturns.length : 0;
    const stdReturn = this.stdDev(this.dailyReturns);
    const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365) : 0;

    const downsideReturns = this.dailyReturns.filter((r) => r < 0);
    const downsideDev = this.stdDev(downsideReturns);
    const sortino = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(365) : 0;

    let maxDD = 0, peak = 1, cumReturn = 1;
    for (const r of this.dailyReturns) {
      cumReturn *= 1 + r;
      if (cumReturn > peak) peak = cumReturn;
      const dd = (peak - cumReturn) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    const currentDD = this.peakNAV > 0 ? (this.peakNAV - this.currentNAV) / this.peakNAV : 0;
    const totalReturn = cumReturn - 1;
    const daysElapsed = (Date.now() - this.startTime) / (1000 * 60 * 60 * 24);
    const annualized = daysElapsed > 0 ? Math.pow(1 + totalReturn, 365 / daysElapsed) - 1 : 0;

    return {
      totalReturn, annualizedReturn: annualized, sharpeRatio: sharpe, sortinoRatio: sortino,
      maxDrawdown: maxDD, currentDrawdown: currentDD,
      winRate: this.trades.length > 0 ? wins.length / this.trades.length : 0,
      totalTrades: this.trades.length, profitableTrades: wins.length, avgWin, avgLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      totalFundingCollected: this.totalFunding, totalFeesSpent: this.totalFees,
    };
  }

  private stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  exportJSON(): string { return JSON.stringify(this.compute(), null, 2); }
}
