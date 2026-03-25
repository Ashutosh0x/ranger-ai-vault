"""
Helius Fetcher — Historical transaction data and webhooks.
Uses Helius RPC for enhanced Solana data access.
"""

import os
import requests
from typing import Optional, Dict, List
from src.config import HELIUS_RPC_URL


class HeliusFetcher:
    """Fetch enhanced Solana data via Helius APIs."""

    def __init__(self):
        self.rpc_url = os.environ.get("HELIUS_RPC_URL", HELIUS_RPC_URL)
        self.api_key = self._extract_api_key()
        self.base_url = f"https://api.helius.xyz/v0"
        self.session = requests.Session()

    def _extract_api_key(self) -> str:
        """Extract API key from RPC URL."""
        if "api-key=" in self.rpc_url:
            return self.rpc_url.split("api-key=")[1]
        return ""

    def get_transaction_history(
        self, address: str, limit: int = 100
    ) -> List[Dict]:
        """Get parsed transaction history for an address."""
        url = f"{self.base_url}/addresses/{address}/transactions"
        params = {"api-key": self.api_key, "limit": limit}

        try:
            resp = self.session.get(url, params=params, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[WARN] Helius tx history error: {e}")
            return []

    def get_enhanced_transaction(self, signature: str) -> Optional[Dict]:
        """Get enhanced/parsed transaction details."""
        url = f"{self.base_url}/transactions"
        params = {"api-key": self.api_key}
        payload = {"transactions": [signature]}

        try:
            resp = self.session.post(url, json=payload, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            return data[0] if data else None
        except Exception as e:
            print(f"[WARN] Helius enhanced tx error: {e}")
            return None

    def get_token_balances(self, address: str) -> List[Dict]:
        """Get all token balances for an address."""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                address,
                {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
                {"encoding": "jsonParsed"},
            ],
        }

        try:
            resp = self.session.post(self.rpc_url, json=payload, timeout=15)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            return result.get("value", [])
        except Exception as e:
            print(f"[WARN] Helius token balance error: {e}")
            return []


# Singleton
_fetcher: Optional[HeliusFetcher] = None


def get_helius_fetcher() -> HeliusFetcher:
    global _fetcher
    if _fetcher is None:
        _fetcher = HeliusFetcher()
    return _fetcher
