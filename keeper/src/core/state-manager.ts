// ═══════════════════════════════════════════════════════
// State Manager — Track vault state, positions, P&L
// M4: Added file-based state persistence
// ═══════════════════════════════════════════════════════

import { KeeperState, Position, VaultAllocation } from "../types";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../monitoring/logger";

const STATE_FILE = path.resolve(__dirname, "../../state/keeper-state.json");

export class StateManager {
  private state: KeeperState;

  constructor() {
    // M4: Try to load persisted state on startup
    this.state = this.loadPersistedState() || {
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
    this.persistState();
  }

  removePosition(asset: string): Position | null {
    const idx = this.state.positions.findIndex((p) => p.asset === asset);
    if (idx === -1) return null;
    const [removed] = this.state.positions.splice(idx, 1);
    this.persistState();
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
    this.persistState();
  }

  setLastRebalance(timestamp: number): void {
    this.state.lastRebalanceTimestamp = timestamp;
  }

  resetDailyPnl(): void {
    this.state.dailyPnl = 0;
    this.persistState();
  }

  resetMonthlyPnl(): void {
    this.state.monthlyPnl = 0;
    this.persistState();
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

  // ═══ M4: State Persistence ═══

  /**
   * Persist state to a JSON file so it survives restarts.
   * In production, replace with Redis: REDIS_URL env var → ioredis client.
   */
  persistState(): void {
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err: any) {
      // Non-fatal: don't crash the keeper if persistence fails
      logger.warn(`State persistence failed: ${err.message}`);
    }
  }

  private loadPersistedState(): KeeperState | null {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const parsed = JSON.parse(raw) as KeeperState;
        logger.info(`Loaded persisted state: ${parsed.positions.length} positions, ${parsed.totalTrades} total trades`);
        return parsed;
      }
    } catch (err: any) {
      logger.warn(`Failed to load persisted state: ${err.message}`);
    }
    return null;
  }
}
