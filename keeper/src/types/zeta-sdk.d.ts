// =================================================================
// Custom type declarations for @zetamarkets/sdk
// The SDK's API surface has changed across versions. This declaration
// file provides the type shapes our code expects, allowing TypeScript
// compilation to succeed while skipLibCheck handles the rest.
// =================================================================

declare module "@zetamarkets/sdk" {
  import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

  export class BN {
    constructor(value: number | string | BN);
    toNumber(): number;
    gt(other: BN): boolean;
    eq(other: BN): boolean;
    abs(): BN;
    static max(a: BN, b: BN): BN;
    static min(a: BN, b: BN): BN;
  }

  export const BASE_PRECISION: BN;
  export const PRICE_PRECISION: BN;
  export const QUOTE_PRECISION: BN;

  export class Wallet {
    constructor(keypair: Keypair);
    publicKey: PublicKey;
    signTransaction(tx: Transaction): Promise<Transaction>;
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  }

  export enum PositionDirection {
    LONG = "long",
    SHORT = "short",
  }

  export enum OrderType {
    MARKET = "market",
    LIMIT = "limit",
  }

  export enum MarketType {
    PERP = "perp",
    SPOT = "spot",
  }

  export interface PerpPosition {
    baseAssetAmount: BN;
    quoteAssetAmount: BN;
    settledPnl?: BN;
    lastCumulativeFundingRate: BN;
  }

  export interface OrderParams {
    marketIndex: number;
    direction: PositionDirection;
    baseAssetAmount: BN;
    marketType: MarketType;
    reduceOnly: boolean;
    orderType?: OrderType;
    price?: BN;
  }

  export function getMarketOrderParams(params: {
    marketIndex: number;
    direction: PositionDirection;
    baseAssetAmount: BN;
    marketType: MarketType;
    reduceOnly?: boolean;
  }): OrderParams;

  export function calculateEntryPrice(position: PerpPosition): BN;

  export interface OracleData {
    price: BN;
    slot: number;
    confidence: BN;
    twap: BN;
  }

  export interface PerpMarketAccount {
    amm: {
      lastFundingRate: BN;
      oraclePrice: BN;
    };
  }

  export class User {
    fetchAccounts(): Promise<void>;
    getPerpPosition(marketIndex: number): PerpPosition | null;
    getHealth(): number;
    getTotalCollateral(): BN;
    getMaintenanceMarginRequirement(): BN;
    getUnrealizedPNL(unrealized: boolean, marketIndex?: number): BN;
    getFreeCollateral(): BN;
    getLeverage(): BN;
  }

  export interface ZetaClientConfig {
    connection: Connection;
    wallet: Wallet;
    env: "devnet" | "mainnet-beta";
  }

  export class ZetaClient {
    constructor(config: ZetaClientConfig);
    subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
    getUser(): User;
    placePerpOrder(params: OrderParams): Promise<string>;
    getOracleDataForPerpMarket(marketIndex: number): OracleData;
    getPerpMarketAccount(marketIndex: number): PerpMarketAccount | null;
  }
}
