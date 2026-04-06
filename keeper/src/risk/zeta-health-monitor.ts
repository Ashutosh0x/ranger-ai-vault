// =================================================================
// Zeta Health Monitor -- Real Zeta SDK health monitoring
// =================================================================

import {
  ZetaClient,
  User as ZetaUser,
  QUOTE_PRECISION,
} from "@zetamarkets/sdk";
import { logger } from "../monitoring/logger";

export interface ZetaHealthState {
  healthRatio: number;
  totalCollateral: number;
  maintenanceMarginReq: number;
  unrealizedPnl: number;
  leverage: number;
  freeCollateral: number;
  isAtRisk: boolean;
  riskLevel: "safe" | "warning" | "critical" | "liquidation";
}

export class ZetaHealthMonitor {
  private zetaClient: ZetaClient;
  private zetaUser: ZetaUser;
  private readonly HEALTH_CRITICAL = 10;
  private readonly HEALTH_WARNING = 20;
  private readonly MAX_LEVERAGE = 2.0;

  constructor(zetaClient: ZetaClient) {
    this.zetaClient = zetaClient;
    this.zetaUser = zetaClient.getUser();
  }

  async getHealthState(): Promise<ZetaHealthState> {
    await this.zetaUser.fetchAccounts();
    const health = this.zetaUser.getHealth();
    const totalCollateral = this.zetaUser.getTotalCollateral().toNumber() / QUOTE_PRECISION.toNumber();
    const maintenanceMarginReq = this.zetaUser.getMaintenanceMarginRequirement().toNumber() / QUOTE_PRECISION.toNumber();
    const unrealizedPnl = this.zetaUser.getUnrealizedPNL(true).toNumber() / QUOTE_PRECISION.toNumber();
    const freeCollateral = this.zetaUser.getFreeCollateral().toNumber() / QUOTE_PRECISION.toNumber();
    const leverage = this.zetaUser.getLeverage().toNumber() / 10000;

    let riskLevel: ZetaHealthState["riskLevel"];
    if (health <= 0) riskLevel = "liquidation";
    else if (health < this.HEALTH_CRITICAL) riskLevel = "critical";
    else if (health < this.HEALTH_WARNING) riskLevel = "warning";
    else riskLevel = "safe";

    const isAtRisk = health < this.HEALTH_WARNING || leverage > this.MAX_LEVERAGE;

    if (riskLevel === "critical" || riskLevel === "liquidation") {
      logger.error(`DRIFT HEALTH ${riskLevel.toUpperCase()} -- health=${health}, leverage=${leverage.toFixed(2)}x`);
    } else if (riskLevel === "warning") {
      logger.warn(`Zeta health warning -- health=${health}, leverage=${leverage.toFixed(2)}x`);
    } else {
      logger.debug(`Zeta health: ${health}, leverage: ${leverage.toFixed(2)}x`);
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

  getReductionFactor(state: ZetaHealthState): number {
    if (state.healthRatio <= this.HEALTH_CRITICAL) return 1.0;
    if (state.healthRatio < this.HEALTH_WARNING) {
      return 1.0 - (state.healthRatio - this.HEALTH_CRITICAL) / (this.HEALTH_WARNING - this.HEALTH_CRITICAL);
    }
    if (state.leverage > this.MAX_LEVERAGE) return 1.0 - this.MAX_LEVERAGE / state.leverage;
    return 0.0;
  }
}
