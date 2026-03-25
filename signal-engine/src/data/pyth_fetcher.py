"""
Pyth Network Oracle Price Fetcher
Real-time and historical price feeds via Hermes API.
"""

import requests
from typing import Optional, Dict
from src.config import PYTH_API_BASE, PYTH_FEED_IDS


class PythFetcher:
    """Fetch oracle prices from Pyth Network's Hermes API."""

    def __init__(self):
        self.base_url = PYTH_API_BASE
        self.session = requests.Session()

    def get_price(self, asset: str) -> Optional[float]:
        """Get current oracle price for an asset."""
        feed_id = PYTH_FEED_IDS.get(asset)
        if not feed_id:
            return None

        url = f"{self.base_url}/api/latest_price_feeds"
        params = {"ids[]": feed_id}

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if data and len(data) > 0:
                price_data = data[0].get("price", {})
                price = float(price_data.get("price", 0))
                expo = int(price_data.get("expo", 0))
                return price * (10 ** expo)
        except Exception as e:
            print(f"[WARN] Pyth price fetch error for {asset}: {e}")
        return None

    def get_all_prices(self) -> Dict[str, float]:
        """Get prices for all tracked assets."""
        prices = {}
        feed_ids = list(PYTH_FEED_IDS.values())

        url = f"{self.base_url}/api/latest_price_feeds"
        params = [("ids[]", fid) for fid in feed_ids]

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            for item in data:
                feed_id = item.get("id", "")
                price_data = item.get("price", {})
                price = float(price_data.get("price", 0))
                expo = int(price_data.get("expo", 0))
                actual_price = price * (10 ** expo)

                # Map feed ID back to asset name
                for asset_name, asset_feed in PYTH_FEED_IDS.items():
                    if asset_feed.replace("0x", "") == feed_id.replace("0x", ""):
                        prices[asset_name] = actual_price
                        break
        except Exception as e:
            print(f"[WARN] Pyth batch price fetch error: {e}")

        return prices

    def get_price_with_confidence(self, asset: str) -> Optional[Dict]:
        """Get price with confidence interval."""
        feed_id = PYTH_FEED_IDS.get(asset)
        if not feed_id:
            return None

        url = f"{self.base_url}/api/latest_price_feeds"
        params = {"ids[]": feed_id}

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if data and len(data) > 0:
                price_data = data[0].get("price", {})
                price = float(price_data.get("price", 0))
                conf = float(price_data.get("conf", 0))
                expo = int(price_data.get("expo", 0))

                return {
                    "price": price * (10 ** expo),
                    "confidence": conf * (10 ** expo),
                    "publish_time": price_data.get("publish_time"),
                }
        except Exception as e:
            print(f"[WARN] Pyth price+conf fetch error for {asset}: {e}")
        return None


# Singleton
_fetcher: Optional[PythFetcher] = None


def get_pyth_fetcher() -> PythFetcher:
    global _fetcher
    if _fetcher is None:
        _fetcher = PythFetcher()
    return _fetcher
