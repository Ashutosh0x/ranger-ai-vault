"""
Coinglass Fetcher — Real liquidation heatmap data.
Replaces the non-existent Ranger heatmap API.
KEY DIFFERENTIATOR: Uses Coinglass liquidation data as ML features.
"""

import os
import time
import requests
from typing import Dict, Optional, List
from dataclasses import dataclass, field


@dataclass
class LiquidationCluster:
    price: float
    total_liq_value: float
    leverage: int
    side: str  # "long" or "short"
    distance_from_current_pct: float


@dataclass
class HeatmapFeatures:
    nearest_long_liq_distance: float
    nearest_short_liq_distance: float
    long_liq_density_5pct: float
    short_liq_density_5pct: float
    liq_imbalance_ratio: float
    largest_cluster_side: str
    largest_cluster_distance: float
    magnetic_pull_direction: int  # -1 (bearish), 0 (neutral), +1 (bullish)


class CoinglassClient:
    """
    Real liquidation data from Coinglass API.
    Free tier: 30 requests/minute.
    """

    V2_BASE_URL = "https://open-api.coinglass.com/public/v2"
    V3_BASE_URL = "https://open-api-v3.coinglass.com/api"

    ASSET_MAP = {
        "SOL-PERP": "SOL",
        "BTC-PERP": "BTC",
        "ETH-PERP": "ETH",
    }

    EXCHANGE_MAP = {
        "SOL-PERP": "Binance",
        "BTC-PERP": "Binance",
        "ETH-PERP": "Binance",
    }

    def __init__(self):
        self.api_key = os.environ.get("COINGLASS_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "COINGLASS_API_KEY not set. "
                "Get one at https://www.coinglass.com/pricing — "
                "free tier gives 30 calls/min"
            )
        self.session = requests.Session()
        self.session.headers.update({
            "accept": "application/json",
            "CG-API-KEY": self.api_key,
            "coinglassSecret": self.api_key,
        })
        self._last_call_time = 0.0

    def _rate_limit(self):
        """Conservative: 1 call per 2 seconds (free tier safe)."""
        elapsed = time.time() - self._last_call_time
        if elapsed < 2.0:
            time.sleep(2.0 - elapsed)
        self._last_call_time = time.time()

    def _get_v2(self, endpoint: str, params: dict) -> dict:
        self._rate_limit()
        url = f"{self.V2_BASE_URL}/{endpoint}"
        resp = self.session.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if str(data.get("code", "0")) != "0":
            raise ValueError(f"Coinglass API error: {data.get('msg')}")
        return data.get("data", {})

    def _get_v3(self, endpoint: str, params: dict) -> dict:
        self._rate_limit()
        url = f"{self.V3_BASE_URL}/{endpoint}"
        resp = self.session.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if str(data.get("code", "0")) != "0":
            raise ValueError(f"Coinglass API error: {data.get('msg')}")
        return data.get("data", {})

    def get_liquidation_heatmap(self, asset: str, interval: str = "12h") -> Dict:
        """Fetch liquidation heatmap data."""
        symbol = self.ASSET_MAP.get(asset, asset)
        try:
            return self._get_v2("liqHeatmap", {
                "symbol": symbol,
                "interval": interval,
            })
        except Exception:
            pass

        # Fallback: liquidation map
        return self._get_v2("liqMap", {
            "symbol": f"{symbol}USDT",
            "exchange": self.EXCHANGE_MAP.get(asset, "Binance"),
        })

    def get_aggregated_liquidations(self, asset: str) -> Dict:
        """Aggregated liquidation history across exchanges."""
        symbol = self.ASSET_MAP.get(asset, asset)
        return self._get_v3("futures/liquidation/aggregated-history", {
            "coin": symbol,
            "interval": "1h",
        })

    def get_open_interest(self, asset: str) -> Dict:
        """Get open interest data."""
        symbol = self.ASSET_MAP.get(asset, asset)
        return self._get_v3("futures/openInterest/history", {
            "coin": symbol,
            "interval": "1h",
        })

    def get_funding_rates(self, asset: str) -> Dict:
        """Get funding rate data from Coinglass."""
        symbol = self.ASSET_MAP.get(asset, asset)
        return self._get_v3("futures/funding/history", {
            "coin": symbol,
            "interval": "1h",
        })

    def compute_heatmap_features(
        self, asset: str, current_price: float
    ) -> HeatmapFeatures:
        """
        THE KEY DIFFERENTIATOR.
        Transforms raw liquidation data into ML-ready features.

        Why this works as alpha:
        - Large liquidation clusters act as "magnets" — price tends to sweep them
        - Asymmetric liq density predicts short-term directional bias
        - Proximity to clusters increases mean-reversion probability
        """
        raw_data = self.get_liquidation_heatmap(asset)

        long_clusters: List[LiquidationCluster] = []
        short_clusters: List[LiquidationCluster] = []

        entries = raw_data
        if isinstance(raw_data, dict) and "data" in raw_data:
            entries = raw_data["data"]
        if not isinstance(entries, dict):
            entries = {}

        for price_str, liq_entries in entries.items():
            try:
                price = float(price_str)
            except (ValueError, TypeError):
                continue

            items = liq_entries if isinstance(liq_entries, list) else [liq_entries]
            for entry in items:
                if not isinstance(entry, (list, tuple)) or len(entry) < 3:
                    continue

                liq_price = float(entry[0])
                liq_value = float(entry[1])
                leverage = int(entry[2]) if entry[2] else 10

                distance_pct = abs((liq_price - current_price) / current_price) * 100

                cluster = LiquidationCluster(
                    price=liq_price,
                    total_liq_value=liq_value,
                    leverage=leverage,
                    side="long" if liq_price < current_price else "short",
                    distance_from_current_pct=distance_pct,
                )

                if liq_price < current_price:
                    long_clusters.append(cluster)
                else:
                    short_clusters.append(cluster)

        long_clusters.sort(key=lambda c: c.distance_from_current_pct)
        short_clusters.sort(key=lambda c: c.distance_from_current_pct)

        nearest_long = long_clusters[0].distance_from_current_pct if long_clusters else 100.0
        nearest_short = short_clusters[0].distance_from_current_pct if short_clusters else 100.0

        long_density_5pct = sum(
            c.total_liq_value for c in long_clusters if c.distance_from_current_pct <= 5.0
        )
        short_density_5pct = sum(
            c.total_liq_value for c in short_clusters if c.distance_from_current_pct <= 5.0
        )

        total_density = long_density_5pct + short_density_5pct
        imbalance = long_density_5pct / total_density if total_density > 0 else 0.5

        all_clusters = long_clusters + short_clusters
        if all_clusters:
            largest = max(all_clusters, key=lambda c: c.total_liq_value)
            largest_side = largest.side
            largest_distance = largest.distance_from_current_pct
        else:
            largest_side = "neutral"
            largest_distance = 100.0

        # Magnetic pull direction
        if short_density_5pct > long_density_5pct * 1.5:
            magnetic_pull = 1   # Bullish — likely to sweep shorts
        elif long_density_5pct > short_density_5pct * 1.5:
            magnetic_pull = -1  # Bearish — likely to sweep longs
        else:
            magnetic_pull = 0

        return HeatmapFeatures(
            nearest_long_liq_distance=nearest_long,
            nearest_short_liq_distance=nearest_short,
            long_liq_density_5pct=long_density_5pct,
            short_liq_density_5pct=short_density_5pct,
            liq_imbalance_ratio=imbalance,
            largest_cluster_side=largest_side,
            largest_cluster_distance=largest_distance,
            magnetic_pull_direction=magnetic_pull,
        )


# Singleton
_client: Optional[CoinglassClient] = None


def get_coinglass_client() -> CoinglassClient:
    global _client
    if _client is None:
        _client = CoinglassClient()
    return _client
