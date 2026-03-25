"""
Data Store — Local cache using Parquet files.
Stores fetched data for training and backtesting.
"""

import os
import pandas as pd
from typing import Optional
from src.config import DATA_CACHE_DIR


class DataStore:
    """Simple Parquet-based local data cache."""

    def __init__(self, cache_dir: str = DATA_CACHE_DIR):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _path(self, name: str) -> str:
        return os.path.join(self.cache_dir, f"{name}.parquet")

    def save(self, name: str, df: pd.DataFrame) -> None:
        """Save DataFrame to Parquet."""
        path = self._path(name)
        df.to_parquet(path, index=False)
        print(f"[DATA] Saved {len(df)} rows to {path}")

    def load(self, name: str) -> Optional[pd.DataFrame]:
        """Load DataFrame from Parquet."""
        path = self._path(name)
        if os.path.exists(path):
            df = pd.read_parquet(path)
            print(f"[DATA] Loaded {len(df)} rows from {path}")
            return df
        return None

    def exists(self, name: str) -> bool:
        return os.path.exists(self._path(name))

    def append(self, name: str, df: pd.DataFrame) -> None:
        """Append new data to existing cache."""
        existing = self.load(name)
        if existing is not None:
            combined = pd.concat([existing, df], ignore_index=True)
            # Deduplicate by timestamp if present
            if "timestamp" in combined.columns:
                combined = combined.drop_duplicates(subset=["timestamp"])
                combined = combined.sort_values("timestamp").reset_index(drop=True)
            self.save(name, combined)
        else:
            self.save(name, df)

    def get_latest_timestamp(self, name: str) -> Optional[pd.Timestamp]:
        """Get most recent timestamp from cached data."""
        df = self.load(name)
        if df is not None and "timestamp" in df.columns:
            return pd.Timestamp(df["timestamp"].max())
        return None

    def clear(self, name: str) -> None:
        """Delete cached data."""
        path = self._path(name)
        if os.path.exists(path):
            os.remove(path)
            print(f"[DATA] Cleared {path}")

    def list_cached(self) -> list:
        """List all cached datasets."""
        files = [f.replace(".parquet", "") for f in os.listdir(self.cache_dir) if f.endswith(".parquet")]
        return sorted(files)


# Singleton
_store: Optional[DataStore] = None


def get_data_store() -> DataStore:
    global _store
    if _store is None:
        _store = DataStore()
    return _store
