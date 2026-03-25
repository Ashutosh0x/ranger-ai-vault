// =================================================================
// Position Tracker -- Track entry prices, unrealized PnL,
// stop-loss / take-profit per trade
// =================================================================

import { DriftExecutor, PositionInfo } from "../execution/drift-executor";
import { logger } from "../monitoring/logger";
import { RISK_PARAMS } from "../config";

export interface TrackedPosition {
  asset: string;
  direction: "long" | "short";
  entryPrice: number;
  entryTime: number;
  sizeUsd: number;
  currentPnlPct: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  shouldClose: boolean;
  closeReason: string | null;
}

export class PositionTracker {
  private driftExecutor: DriftExecutor;
  private trackedEntries: Map<
    string,
    { entryPrice: number; entryTime: number; direction: string }
  > = new Map();

  constructor(driftExecutor: DriftExecutor) {
    this.driftExecutor = driftExecutor;
  }

  /**
   * Record when we open a new position
   */
  recordEntry(
    asset: string,
    entryPrice: number,
    direction: string,
  ): void {
    this.trackedEntries.set(asset, {
      entryPrice,
      entryTime: Date.now(),
      direction,
    });
    logger.info(
      `Position tracked: ${direction} ${asset} @ $${entryPrice.toFixed(2)}`,
    );
  }

  /**
   * Remove tracking when position is closed
   */
  recordExit(asset: string): void {
    this.trackedEntries.delete(asset);
    logger.info(`Position untracked: ${asset}`);
  }

  /**
   * Check all positions against stop-loss and take-profit levels
   * Returns list of positions that should be closed
   */
  async checkAllPositions(): Promise<TrackedPosition[]> {
    const allPositions = await this.driftExecutor.getAllPositions();
    const results: TrackedPosition[] = [];

    for (const pos of allPositions) {
      const tracked = this.trackedEntries.get(pos.asset);
      const entryPrice = tracked?.entryPrice || pos.entryPrice;
      const entryTime = tracked?.entryTime || Date.now();

      // Calculate PnL percentage
      let pnlPct: number;
      if (pos.direction === "long") {
        pnlPct = (pos.markPrice - entryPrice) / entryPrice;
      } else {
        pnlPct = (entryPrice - pos.markPrice) / entryPrice;
      }

      // Calculate stop-loss and take-profit prices
      let stopLossPrice: number;
      let takeProfitPrice: number;

      if (pos.direction === "long") {
        stopLossPrice =
          entryPrice * (1 + RISK_PARAMS.stopLossPerTrade);
        takeProfitPrice =
          entryPrice * (1 + RISK_PARAMS.takeProfitPerTrade);
      } else {
        stopLossPrice =
          entryPrice * (1 - RISK_PARAMS.stopLossPerTrade);
        takeProfitPrice =
          entryPrice * (1 - RISK_PARAMS.takeProfitPerTrade);
      }

      // Determine if position should be closed
      let shouldClose = false;
      let closeReason: string | null = null;

      if (pnlPct <= RISK_PARAMS.stopLossPerTrade) {
        shouldClose = true;
        closeReason = `Stop-loss hit: ${(pnlPct * 100).toFixed(2)}% <= ${(RISK_PARAMS.stopLossPerTrade * 100).toFixed(2)}%`;
      } else if (pnlPct >= RISK_PARAMS.takeProfitPerTrade) {
        shouldClose = true;
        closeReason = `Take-profit hit: ${(pnlPct * 100).toFixed(2)}% >= ${(RISK_PARAMS.takeProfitPerTrade * 100).toFixed(2)}%`;
      }

      results.push({
        asset: pos.asset,
        direction: pos.direction,
        entryPrice,
        entryTime,
        sizeUsd: pos.sizeUsd,
        currentPnlPct: pnlPct,
        stopLossPrice,
        takeProfitPrice,
        shouldClose,
        closeReason,
      });

      if (shouldClose) {
        logger.warn(`${pos.asset}: ${closeReason}`);
      }
    }

    return results;
  }

  /**
   * Get count of currently open positions
   */
  async getOpenPositionCount(): Promise<number> {
    const positions = await this.driftExecutor.getAllPositions();
    return positions.length;
  }

  /**
   * Get total unrealized PnL across all positions
   */
  async getTotalUnrealizedPnl(): Promise<number> {
    const positions = await this.driftExecutor.getAllPositions();
    return positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  }
}
