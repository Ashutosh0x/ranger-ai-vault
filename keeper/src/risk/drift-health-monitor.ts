// =================================================================
// Drift Health Monitor -- Real Drift SDK health monitoring
// =================================================================

import {
  DriftClient,
  User as DriftUser,
  QUOTE_PRECISION,
} from "@drift-labs/sdk";
import { logger } from "../monitoring/logger";

export interface DriftHealthState {
  healthRatio: number;
  totalCollateral: number;
  maintenanceMarginReq: number;
  unrealizedPnl: number;
  leverage: number;
  freeCollateral: number;
  isAtRisk: boolean;
  riskLevel: "safe" | "warning" | "critical" | "liquidation";
}

export class DriftHealthMonitor {
  private driftClient: DriftClient;
  private driftUser: DriftUser;
  private readonly HEALTH_CRITICAL = 10;
  private readonly HEALTH_WARNING = 20;
  private readonly MAX_LEVERAGE = 2.0;

  constructor(driftClient: DriftClient) {
    this.driftClient = driftClient;
    this.driftUser = driftClient.getUser();
  }

  async getHealthState(): Promise<DriftHealthState> {
    await this.driftUser.fetchAccounts();
    const health = this.driftUser.getHealth();
    const totalCollateral = this.driftUser.getTotalCollateral().toNumber() / QUOTE_PRECISION.toNumber();
    const maintenanceMarginReq = this.driftUser.getMaintenanceMarginRequirement().toNumber() / QUOTE_PRECISION.toNumber();
    const unrealizedPnl = this.driftUser.getUnrealizedPNL(true).toNumber() / QUOTE_PRECISION.toNumber();
    const freeCollateral = this.driftUser.getFreeCollateral().toNumber() / QUOTE_PRECISION.toNumber();
    const leverage = this.driftUser.getLeverage().toNumber() / 10000;

    let riskLevel: DriftHealthState["riskLevel"];
    if (health <= 0) riskLevel = "liquidation";
    else if (health < this.HEALTH_CRITICAL) riskLevel = "critical";
    else if (health < this.HEALTH_WARNING) riskLevel = "warning";
    else riskLevel = "safe";

    const isAtRisk = health < this.HEALTH_WARNING || leverage > this.MAX_LEVERAGE;

    if (riskLevel === "critical" || riskLevel === "liquidation") {
      logger.error(`DRIFT HEALTH ${riskLevel.toUpperCase()} -- health=${health}, leverage=${leverage.toFixed(2)}x`);
    } else if (riskLevel === "warning") {
      logger.warn(`Drift health warning -- health=${health}, leverage=${leverage.toFixed(2)}x`);
    } else {
      logger.debug(`Drift health: ${health}, leverage: ${leverage.toFixed(2)}x`);
    }

    return { healthRatio: health, totalCollateral, maintenanceMarginReq, unrealizedPnl, leverage, freeCollateral, isAtRisk, riskLevel };
  }

  async shouldEmergencyUnwind(): Promise<boolean> {
    const state = await this.getHealthState();
    return state.riskLevel === "critical" || state.riskLevel === "liquidation";
  }

  async shouldReducePositions(): Promise<boolean> {
    const state = await this.getHealthState();
    return state.isAtRisk;
  }

  getReductionFactor(state: DriftHealthState): number {
    if (state.healthRatio <= this.HEALTH_CRITICAL) return 1.0;
    if (state.healthRatio < this.HEALTH_WARNING) {
      return 1.0 - (state.healthRatio - this.HEALTH_CRITICAL) / (this.HEALTH_WARNING - this.HEALTH_CRITICAL);
    }
    if (state.leverage > this.MAX_LEVERAGE) return 1.0 - this.MAX_LEVERAGE / state.leverage;
    return 0.0;
  }
}
