// =================================================================
// Zeta Executor -- Opens/closes perp positions on Zeta protocol
// This is the file that actually TRADES on-chain
// =================================================================

import {
  ZetaClient,
  User as ZetaUser,
  PositionDirection,
  OrderType,
  MarketType,
  BN,
  BASE_PRECISION,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  getMarketOrderParams,
  PerpPosition,
  calculateEntryPrice,
} from "@zetamarkets/sdk";
import { PublicKey } from "@solana/web3.js";
import { logger } from "../monitoring/logger";

export interface OpenPositionParams {
  asset: string;
  direction: "long" | "short";
  sizeUsd: number;
  reduceOnly?: boolean;
}

export interface PositionInfo {
  asset: string;
  marketIndex: number;
  direction: "long" | "short";
  sizeBase: number;
  sizeUsd: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  fundingAccrued: number;
  leverage: number;
}

// Zeta market indexes for perps
const MARKET_INDEX_MAP: Record<string, number> = {
  "SOL-PERP": 0,
  "BTC-PERP": 1,
  "ETH-PERP": 2,
};

export class ZetaExecutor {
  private zetaClient: ZetaClient;
  private zetaUser: ZetaUser;

  constructor(zetaClient: ZetaClient) {
    this.zetaClient = zetaClient;
    this.zetaUser = zetaClient.getUser();
  }

  // =================================================================
  // OPEN POSITION
  // =================================================================

  async openPosition(params: OpenPositionParams): Promise<string> {
    const { asset, direction, sizeUsd, reduceOnly } = params;
    const marketIndex = MARKET_INDEX_MAP[asset];

    if (marketIndex === undefined) {
      throw new Error(
        `Unknown asset: ${asset}. Valid: ${Object.keys(MARKET_INDEX_MAP).join(", ")}`,
      );
    }

    // Get current oracle price to compute base size
    const oraclePrice =
      this.zetaClient.getOracleDataForPerpMarket(marketIndex);
    const oraclePriceNum =
      oraclePrice.price.toNumber() / PRICE_PRECISION.toNumber();

    if (oraclePriceNum <= 0) {
      throw new Error(`Invalid oracle price for ${asset}: ${oraclePriceNum}`);
    }

    // Convert USD size to base asset amount
    const baseSize = sizeUsd / oraclePriceNum;
    const baseSizeBN = new BN(
      Math.floor(baseSize * BASE_PRECISION.toNumber()),
    );

    const perpDirection =
      direction === "long"
        ? PositionDirection.LONG
        : PositionDirection.SHORT;

    logger.info(
      `Opening ${direction} ${asset}: $${sizeUsd.toFixed(2)} ` +
        `(${baseSize.toFixed(6)} base @ $${oraclePriceNum.toFixed(2)})`,
    );

    const orderParams = getMarketOrderParams({
      marketIndex,
      direction: perpDirection,
      baseAssetAmount: baseSizeBN,
      marketType: MarketType.PERP,
      reduceOnly: reduceOnly || false,
    });

    const txSig = await this.zetaClient.placePerpOrder(orderParams);

    logger.info(`Position opened [${asset} ${direction}]: ${txSig}`);
    return txSig;
  }

  // =================================================================
  // CLOSE POSITION
  // =================================================================

  async closePosition(asset: string): Promise<string | null> {
    const marketIndex = MARKET_INDEX_MAP[asset];
    if (marketIndex === undefined) {
      throw new Error(`Unknown asset: ${asset}`);
    }

    const perpPosition = this.zetaUser.getPerpPosition(marketIndex);
    if (!perpPosition || perpPosition.baseAssetAmount.eq(new BN(0))) {
      logger.debug(`No open position for ${asset}, nothing to close`);
      return null;
    }

    const isLong = perpPosition.baseAssetAmount.gt(new BN(0));
    const closeDirection = isLong
      ? PositionDirection.SHORT
      : PositionDirection.LONG;

    const closeSize = perpPosition.baseAssetAmount.abs();

    logger.info(
      `Closing ${isLong ? "long" : "short"} ${asset}: ` +
        `${(closeSize.toNumber() / BASE_PRECISION.toNumber()).toFixed(6)} base`,
    );

    const orderParams = getMarketOrderParams({
      marketIndex,
      direction: closeDirection,
      baseAssetAmount: closeSize,
      marketType: MarketType.PERP,
      reduceOnly: true,
    });

    const txSig = await this.zetaClient.placePerpOrder(orderParams);

    logger.info(`Position closed [${asset}]: ${txSig}`);
    return txSig;
  }

  // =================================================================
  // CLOSE ALL POSITIONS (emergency)
  // =================================================================

  async closeAllPositions(): Promise<string[]> {
    const txSigs: string[] = [];
    const assets = Object.keys(MARKET_INDEX_MAP);

    for (const asset of assets) {
      try {
        const sig = await this.closePosition(asset);
        if (sig) txSigs.push(sig);
      } catch (err: any) {
        logger.error(`Failed to close ${asset}: ${err.message}`);
      }
    }

    return txSigs;
  }

  // =================================================================
  // QUERY POSITIONS
  // =================================================================

  async getPosition(asset: string): Promise<PositionInfo | null> {
    const marketIndex = MARKET_INDEX_MAP[asset];
    if (marketIndex === undefined) return null;

    await this.zetaUser.fetchAccounts();
    const perpPosition = this.zetaUser.getPerpPosition(marketIndex);

    if (!perpPosition || perpPosition.baseAssetAmount.eq(new BN(0))) {
      return null;
    }

    const oraclePrice =
      this.zetaClient.getOracleDataForPerpMarket(marketIndex);
    const markPriceNum =
      oraclePrice.price.toNumber() / PRICE_PRECISION.toNumber();

    const baseAmount =
      perpPosition.baseAssetAmount.toNumber() / BASE_PRECISION.toNumber();
    const isLong = baseAmount > 0;

    const entryPrice = calculateEntryPrice(perpPosition);
    const entryPriceNum =
      entryPrice.toNumber() / PRICE_PRECISION.toNumber();

    const unrealizedPnl =
      this.zetaUser.getUnrealizedPNL(true, marketIndex).toNumber() /
      QUOTE_PRECISION.toNumber();

    const fundingAccrued =
      perpPosition.settledPnl?.toNumber
        ? perpPosition.settledPnl.toNumber() / QUOTE_PRECISION.toNumber()
        : 0;

    return {
      asset,
      marketIndex,
      direction: isLong ? "long" : "short",
      sizeBase: Math.abs(baseAmount),
      sizeUsd: Math.abs(baseAmount) * markPriceNum,
      entryPrice: entryPriceNum,
      markPrice: markPriceNum,
      unrealizedPnl,
      fundingAccrued,
      leverage: this.zetaUser.getLeverage().toNumber() / 10000,
    };
  }

  async getAllPositions(): Promise<PositionInfo[]> {
    const positions: PositionInfo[] = [];
    for (const asset of Object.keys(MARKET_INDEX_MAP)) {
      const pos = await this.getPosition(asset);
      if (pos) positions.push(pos);
    }
    return positions;
  }

  // =================================================================
  // MARKET DATA
  // =================================================================

  getOraclePrice(asset: string): number {
    const marketIndex = MARKET_INDEX_MAP[asset];
    if (marketIndex === undefined) return 0;
    const oracle =
      this.zetaClient.getOracleDataForPerpMarket(marketIndex);
    return oracle.price.toNumber() / PRICE_PRECISION.toNumber();
  }

  getFundingRate(asset: string): number {
    const marketIndex = MARKET_INDEX_MAP[asset];
    if (marketIndex === undefined) return 0;
    try {
      const market =
        this.zetaClient.getPerpMarketAccount(marketIndex);
      if (!market) return 0;
      return (
        market.amm.lastFundingRate.toNumber() /
        PRICE_PRECISION.toNumber()
      );
    } catch {
      return 0;
    }
  }
}
