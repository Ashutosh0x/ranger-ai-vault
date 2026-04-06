"""
Zeta Markets Data Fetcher
Fetches funding rates, OI, volume, oracle prices from Zeta API.
"""

import requests
import pandas as pd
import numpy as np
from typing import Dict, Optional
from src.config import ZETA_API_BASE, ZETA_MARKET_MAP


class ZetaFetcher:
    """Fetch market data from Zeta Markets's REST API."""

    def __init__(self):
        self.base_url = ZETA_API_BASE
        self.session = requests.Session()
        self.session.headers.update({"accept": "application/json"})

    def get_funding_rates(
        self, asset: str, limit: int = 100
    ) -> pd.DataFrame:
        """
        Fetch historical funding rates.
        Zeta API: /fundingRates?marketIndex=N
        APR = fundingRatePct * 24 * 365
        """
        market_info = ZETA_MARKET_MAP.get(asset)
        if not market_info:
            raise ValueError(f"Unknown asset: {asset}")

        url = f"{self.base_url}/fundingRates"
        params = {
            "marketIndex": market_info["market_index"],
            "limit": limit,
        }

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if not data:
                return pd.DataFrame()

            df = pd.DataFrame(data)
            if "ts" in df.columns:
                df["timestamp"] = pd.to_datetime(df["ts"], unit="s")
            if "fundingRate" in df.columns:
                df["funding_rate"] = df["fundingRate"].astype(float) / 1e9
            if "fundingRateLong" in df.columns:
                df["funding_rate_long"] = df["fundingRateLong"].astype(float) / 1e9
            if "fundingRateShort" in df.columns:
                df["funding_rate_short"] = df["fundingRateShort"].astype(float) / 1e9

            return df
        except Exception as e:
            print(f"[WARN] Zeta funding rate fetch error for {asset}: {e}")
            return pd.DataFrame()

    def get_oracle_price(self, asset: str) -> Optional[float]:
        """Get current oracle price from Zeta."""
        market_info = ZETA_MARKET_MAP.get(asset)
        if not market_info:
            return None

        url = f"{self.base_url}/perpMarketInfo"
        try:
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            markets = resp.json()

            for market in markets:
                if market.get("marketIndex") == market_info["market_index"]:
                    return float(market.get("oraclePrice", 0)) / 1e6
        except Exception as e:
            print(f"[WARN] Zeta oracle price fetch error for {asset}: {e}")
        return None

    def get_market_data(self, asset: str) -> Dict:
        """Get comprehensive market data for an asset."""
        market_info = ZETA_MARKET_MAP.get(asset)
        if not market_info:
            return {}

        url = f"{self.base_url}/perpMarketInfo"
        try:
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            markets = resp.json()

            for market in markets:
                if market.get("marketIndex") == market_info["market_index"]:
                    return {
                        "oracle_price": float(market.get("oraclePrice", 0)) / 1e6,
                        "mark_price": float(market.get("markPrice", 0)) / 1e6,
                        "open_interest": float(market.get("openInterest", 0)) / 1e9,
                        "volume_24h": float(market.get("volume24h", 0)) / 1e6,
                        "base_asset_amount_long": float(market.get("baseAssetAmountLong", 0)) / 1e9,
                        "base_asset_amount_short": float(market.get("baseAssetAmountShort", 0)) / 1e9,
                        "last_funding_rate": float(market.get("lastFundingRate", 0)) / 1e9,
                    }
        except Exception as e:
            print(f"[WARN] Zeta market data fetch error for {asset}: {e}")
        return {}

    def get_ohlcv(
        self, asset: str, resolution: str = "60", limit: int = 500
    ) -> pd.DataFrame:
        """
        Get OHLCV candle data.
        Resolution: "60" = 1h, "900" = 15m, "3600" = 1h, "86400" = 1d
        """
        market_info = ZETA_MARKET_MAP.get(asset)
        if not market_info:
            return pd.DataFrame()

        url = f"{self.base_url}/candles"
        params = {
            "marketIndex": market_info["market_index"],
            "resolution": resolution,
            "limit": limit,
        }

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if not data:
                return pd.DataFrame()

            df = pd.DataFrame(data)
            if "start" in df.columns:
                df["timestamp"] = pd.to_datetime(df["start"], unit="s")
            for col in ["open", "high", "low", "close", "volume"]:
                if col in df.columns:
                    df[col] = df[col].astype(float)

            return df.sort_values("timestamp").reset_index(drop=True)
        except Exception as e:
            print(f"[WARN] Zeta OHLCV fetch error for {asset}: {e}")
            return pd.DataFrame()

    def get_trades(self, asset: str, limit: int = 100) -> pd.DataFrame:
        """Fetch recent trades."""
        market_info = ZETA_MARKET_MAP.get(asset)
        if not market_info:
            return pd.DataFrame()

        url = f"{self.base_url}/trades"
        params = {
            "marketIndex": market_info["market_index"],
            "marketType": "perp",
            "limit": limit,
        }

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return pd.DataFrame(data) if data else pd.DataFrame()
        except Exception as e:
            print(f"[WARN] Zeta trades fetch error for {asset}: {e}")
            return pd.DataFrame()

    def compute_funding_features(self, asset: str) -> Dict[str, float]:
        """Compute funding-rate-derived features."""
        df = self.get_funding_rates(asset, limit=50)

        if df.empty or "funding_rate" not in df.columns:
            return {
                "funding_rate_1h": 0.0,
                "funding_rate_8h_ma": 0.0,
            }

        rates = df["funding_rate"].values

        return {
            "funding_rate_1h": float(rates[-1]) if len(rates) > 0 else 0.0,
            "funding_rate_8h_ma": float(np.mean(rates[-8:])) if len(rates) >= 8 else float(np.mean(rates)),
        }

    def compute_volume_features(self, asset: str) -> Dict[str, float]:
        """Compute volume-derived features."""
        market_data = self.get_market_data(asset)

        vol_24h = market_data.get("volume_24h", 0)
        oi = market_data.get("open_interest", 0)
        long_oi = market_data.get("base_asset_amount_long", 0)
        short_oi = market_data.get("base_asset_amount_short", 0)

        return {
            "volume_ratio": vol_24h / oi if oi > 0 else 0.0,
            "oi_change_1h": 0.0,  # Need historical OI for delta
            "long_short_ratio": long_oi / short_oi if short_oi > 0 else 1.0,
        }

    def compute_basis_spread(self, asset: str) -> float:
        """Compute basis (mark - oracle) spread."""
        market_data = self.get_market_data(asset)
        mark = market_data.get("mark_price", 0)
        oracle = market_data.get("oracle_price", 0)

        if oracle > 0:
            return (mark - oracle) / oracle
        return 0.0


# Singleton
_fetcher: Optional[ZetaFetcher] = None


def get_zeta_fetcher() -> ZetaFetcher:
    global _fetcher
    if _fetcher is None:
        _fetcher = ZetaFetcher()
    return _fetcher
