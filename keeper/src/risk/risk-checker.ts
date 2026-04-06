// ═══════════════════════════════════════════════════════
// Risk Checker — Pre-trade risk validation
// ═══════════════════════════════════════════════════════

import { StateManager } from "../core/state-manager";
import { RISK_PARAMS } from "../config";
import { TradeAction } from "../types";
import { logger } from "../monitoring/logger";

export class RiskChecker {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Pre-trade risk validation.
   * Returns true if the trade is allowed.
   */
  preTradeCheck(action: TradeAction): boolean {
    // Skip checks for close actions
    if (action.type === "close" || action.type === "reduce") {
      return true;
    }

    // Check max concurrent positions
    if (this.stateManager.getOpenPositionCount() >= RISK_PARAMS.maxConcurrentPositions) {
      logger.warn(`Risk: Max concurrent positions (${RISK_PARAMS.maxConcurrentPositions}) reached`);
      return false;
    }

    // Check if already have a position in this asset
    if (this.stateManager.getPosition(action.asset)) {
      logger.warn(`Risk: Already have position in ${action.asset}`);
      return false;
    }

    // Check daily drawdown (as percentage — dailyPnl is in USD, compare as fraction)
    const state = this.stateManager.getState();
    if (state.dailyPnl < -RISK_PARAMS.maxDailyDrawdown) {
      logger.warn(`Risk: Daily drawdown limit reached (${(state.dailyPnl * 100).toFixed(2)}%)`);
      return false;
    }

    // Check monthly drawdown
    if (state.monthlyPnl < -RISK_PARAMS.maxMonthlyDrawdown) {
      logger.warn(`Risk: Monthly drawdown limit reached (${(state.monthlyPnl * 100).toFixed(2)}%)`);
      return false;
    }

    // Check net delta
    const netDelta = this.stateManager.getNetDelta();
    const proposedDelta = action.type === "open_long" ? action.size : -action.size;
    if (Math.abs(netDelta + proposedDelta) > RISK_PARAMS.maxNetDelta) {
      logger.warn(`Risk: Net delta would exceed limit (current: ${netDelta.toFixed(3)}, proposed: ${proposedDelta.toFixed(3)})`);
      return false;
    }

    // Check minimum confidence
    if (action.confidence < 0.3) {
      logger.warn("Risk: Confidence too low");
      return false;
    }

    logger.debug(`Risk check passed for ${action.type} ${action.asset}`);
    return true;
  }

  /**
   * Check if trading should be halted entirely.
   */
  shouldHaltTrading(): boolean {
    const state = this.stateManager.getState();

    // Check DRY_RUN mode
    if (process.env.DRY_RUN === "true") {
      return true;
    }

    return (
      state.dailyPnl < -RISK_PARAMS.maxDailyDrawdown ||
      state.monthlyPnl < -RISK_PARAMS.maxMonthlyDrawdown
    );
  }

  /**
   * Check stop-loss and take-profit for open positions.
   */
  checkPositionLimits(): TradeAction[] {
    const actions: TradeAction[] = [];

    for (const pos of this.stateManager.getAllPositions()) {
      if (pos.entryPrice <= 0 || pos.currentPrice <= 0) continue;

      const direction = pos.side === "long" ? 1 : -1;
      const pnlPct = (pos.currentPrice / pos.entryPrice - 1) * direction;

      if (pnlPct <= RISK_PARAMS.stopLossPerTrade) {
        actions.push({
          type: "close",
          asset: pos.asset,
          size: pos.size,
          signal: 0,
          confidence: 1,
          reason: `stop_loss (${(pnlPct * 100).toFixed(2)}%)`,
        });
      } else if (pnlPct >= RISK_PARAMS.takeProfitPerTrade) {
        actions.push({
          type: "close",
          asset: pos.asset,
          size: pos.size,
          signal: 0,
          confidence: 1,
          reason: `take_profit (${(pnlPct * 100).toFixed(2)}%)`,
        });
      }
    }

    return actions;
  }
}
