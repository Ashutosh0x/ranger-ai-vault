"""
Liquidation Features — Transform Coinglass data into ML-ready features.
KEY DIFFERENTIATOR: Uses liquidation heatmap as alpha signal.
"""

from typing import Dict
from src.data.coinglass_fetcher import get_coinglass_client


def get_liquidation_features(asset: str, current_price: float) -> Dict[str, float]:
    """
    Returns liquidation-derived features for ML model.
    Uses real Coinglass API data.
    """
    client = get_coinglass_client()

    try:
        features = client.compute_heatmap_features(asset, current_price)

        return {
            "liq_nearest_long_dist": features.nearest_long_liq_distance,
            "liq_nearest_short_dist": features.nearest_short_liq_distance,
            "liq_long_density_5pct": features.long_liq_density_5pct,
            "liq_short_density_5pct": features.short_liq_density_5pct,
            "liq_imbalance_ratio": features.liq_imbalance_ratio,
            "liq_magnetic_pull": float(features.magnetic_pull_direction),
            "liq_largest_cluster_dist": features.largest_cluster_distance,
            # Composite: proximity score (higher = closer to clusters)
            "liq_proximity_score": 1.0 / (
                1.0 + min(
                    features.nearest_long_liq_distance,
                    features.nearest_short_liq_distance,
                )
            ),
        }
    except Exception as e:
        # Graceful degradation: return neutral features if API fails
        print(f"[WARN] Coinglass API error for {asset}: {e}")
        return _neutral_features()


def _neutral_features() -> Dict[str, float]:
    """Return neutral features when data is unavailable."""
    return {
        "liq_nearest_long_dist": 50.0,
        "liq_nearest_short_dist": 50.0,
        "liq_long_density_5pct": 0.0,
        "liq_short_density_5pct": 0.0,
        "liq_imbalance_ratio": 0.5,
        "liq_magnetic_pull": 0.0,
        "liq_largest_cluster_dist": 50.0,
        "liq_proximity_score": 0.0,
    }
