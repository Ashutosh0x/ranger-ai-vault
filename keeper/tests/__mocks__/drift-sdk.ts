// Mock Drift SDK for unit tests -- no network calls

import { PublicKey, Keypair } from "@solana/web3.js";

export class BN {
  private value: number;
  constructor(v: number | string) {
    this.value = typeof v === "string" ? parseInt(v) : v;
  }
  toNumber() { return this.value; }
  gt(other: BN) { return this.value > other.toNumber(); }
  eq(other: BN) { return this.value === other.toNumber(); }
  abs() { return new BN(Math.abs(this.value)); }
  static from(v: number) { return new BN(v); }
}

export const BASE_PRECISION = new BN(1e9);
export const PRICE_PRECISION = new BN(1e6);
export const QUOTE_PRECISION = new BN(1e6);

export const PositionDirection = {
  LONG: { long: {} },
  SHORT: { short: {} },
};

export const OrderType = {
  MARKET: { market: {} },
  LIMIT: { limit: {} },
};

export const MarketType = {
  PERP: { perp: {} },
  SPOT: { spot: {} },
};

export function getMarketOrderParams(params: any) {
  return params;
}

export function calculateEntryPrice(position: any) {
  return new BN(100 * 1e6);
}

export class Wallet {
  publicKey: PublicKey;
  constructor(kp: Keypair) { this.publicKey = kp.publicKey; }
  async signTransaction(tx: any) { return tx; }
  async signAllTransactions(txs: any[]) { return txs; }
}

export class User {
  getHealth() { return 50; }
  getTotalCollateral() { return new BN(10000 * 1e6); }
  getMaintenanceMarginRequirement() { return new BN(2000 * 1e6); }
  getUnrealizedPNL(_: boolean, __?: number) { return new BN(500 * 1e6); }
  getFreeCollateral() { return new BN(5000 * 1e6); }
  getLeverage() { return new BN(15000); }
  getPerpPosition(marketIndex: number) {
    return {
      baseAssetAmount: new BN(1 * 1e9),
      settledPnl: new BN(100 * 1e6),
    };
  }
  async fetchAccounts() {}
}

export class DriftClient {
  private user: User;
  constructor(_: any) { this.user = new User(); }
  getUser() { return this.user; }
  async subscribe() {}
  async unsubscribe() {}
  getOracleDataForPerpMarket(marketIndex: number) {
    const prices: Record<number, number> = { 0: 150, 1: 65000, 2: 3500 };
    return { price: new BN((prices[marketIndex] || 100) * 1e6) };
  }
  getPerpMarketAccount(marketIndex: number) {
    return { amm: { lastFundingRate: new BN(100) } };
  }
  async placePerpOrder(params: any) {
    return "mock_tx_signature_" + Date.now();
  }
}
