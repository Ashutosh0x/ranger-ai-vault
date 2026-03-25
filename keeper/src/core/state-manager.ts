// ═══════════════════════════════════════════════════════
// State Manager — Track vault state, positions, P&L
// ═══════════════════════════════════════════════════════

import { KeeperState, Position, VaultAllocation } from "../types";

export class StateManager {
  private state: KeeperState;

  constructor() {
    this.state = {
      positions: [],
      lastRebalanceTimestamp: 0,
      dailyPnl: 0,
      monthlyPnl: 0,
      totalTrades: 0,
      isRunning: false,
    };
  }

  getState(): KeeperState {
    return { ...this.state };
  }

  addPosition(position: Position): void {
    this.state.positions.push(position);
    this.state.totalTrades++;
  }

  removePosition(asset: string): Position | null {
    const idx = this.state.positions.findIndex((p) => p.asset === asset);
    if (idx === -1) return null;
    const [removed] = this.state.positions.splice(idx, 1);
    return removed;
  }

  getPosition(asset: string): Position | null {
    return this.state.positions.find((p) => p.asset === asset) || null;
  }

  getAllPositions(): Position[] {
    return [...this.state.positions];
  }

  getOpenPositionCount(): number {
    return this.state.positions.length;
  }

  updatePositionPrice(asset: string, currentPrice: number): void {
    const pos = this.state.positions.find((p) => p.asset === asset);
    if (pos) {
      pos.currentPrice = currentPrice;
      const direction = pos.side === "long" ? 1 : -1;
      pos.unrealizedPnl = (currentPrice / pos.entryPrice - 1) * direction * pos.size;
    }
  }

  recordTradePnl(pnl: number): void {
    this.state.dailyPnl += pnl;
    this.state.monthlyPnl += pnl;
  }

  setLastRebalance(timestamp: number): void {
    this.state.lastRebalanceTimestamp = timestamp;
  }

  resetDailyPnl(): void {
    this.state.dailyPnl = 0;
  }

  resetMonthlyPnl(): void {
    this.state.monthlyPnl = 0;
  }

  setRunning(running: boolean): void {
    this.state.isRunning = running;
  }

  getNetDelta(): number {
    return this.state.positions.reduce((sum, p) => {
      const direction = p.side === "long" ? 1 : -1;
      return sum + direction * p.size;
    }, 0);
  }

  getTotalUnrealizedPnl(): number {
    return this.state.positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  }
}
