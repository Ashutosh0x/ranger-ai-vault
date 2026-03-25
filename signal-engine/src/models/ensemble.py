"""
Ensemble Model — Weighted combination of momentum and mean-reversion.
Signal = 0.4 * momentum + 0.6 * meanrev (mean-rev weighted heavier).
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict, Optional

from src.models.momentum_model import MomentumModel
from src.models.meanrev_model import MeanRevModel
from src.models.model_registry import get_model_registry
from src.features.feature_engineer import get_feature_engineer
from src.config import MODEL_PARAMS, SIGNAL_THRESHOLDS


@dataclass
class SignalResult:
    signal: float           # Combined signal (-1 to 1)
    confidence: float       # 0 to 1
    momentum_raw: float     # Raw momentum model output
    meanrev_raw: float      # Raw mean-reversion model output
    feature_values: Dict[str, float]
    regime: str            # "trending", "ranging", or "volatile"


class EnsembleModel:
    """
    Ensemble combiner: weighted blend of momentum and mean-reversion.
    - Includes regime detection to adjust weights dynamically.
    - Outputs a signal between -1 and 1.
    """

    def __init__(self):
        self.momentum = MomentumModel()
        self.meanrev = MeanRevModel()
        self.feature_engineer = get_feature_engineer()
        self.weights = MODEL_PARAMS["ensemble_weights"]

        # Try to load saved models
        registry = get_model_registry()
        mom_loaded = registry.load_model("momentum")
        mrev_loaded = registry.load_model("meanrev")

        if mom_loaded:
            self.momentum.model = mom_loaded
            self.momentum.is_trained = True
        if mrev_loaded:
            self.meanrev.model = mrev_loaded
            self.meanrev.is_trained = True

    def predict(self, asset: str) -> SignalResult:
        """
        Full prediction pipeline:
        1. Fetch features
        2. Run both models
        3. Blend with weights
        4. Detect regime
        5. Apply confidence scoring
        """
        # Compute features
        features = self.feature_engineer.compute_features(asset)

        # Model predictions
        mom_pred = self.momentum.predict(features)
        mrev_pred = self.meanrev.predict(features)

        # Detect regime
        regime = self._detect_regime(features)

        # Dynamic weight adjustment based on regime
        if regime == "trending":
            mom_weight = 0.6  # Favor momentum in trends
            mrev_weight = 0.4
        elif regime == "ranging":
            mom_weight = 0.3  # Favor mean-rev in ranges
            mrev_weight = 0.7
        else:
            mom_weight = self.weights["momentum"]
            mrev_weight = self.weights["meanrev"]

        # Blend
        raw_signal = mom_weight * mom_pred + mrev_weight * mrev_pred

        # Normalize to [-1, 1]
        signal = float(np.clip(np.tanh(raw_signal * 3), -1, 1))

        # Confidence scoring
        confidence = self._compute_confidence(mom_pred, mrev_pred, features)

        return SignalResult(
            signal=signal,
            confidence=confidence,
            momentum_raw=mom_pred,
            meanrev_raw=mrev_pred,
            feature_values=features,
            regime=regime,
        )

    def _detect_regime(self, features: Dict[str, float]) -> str:
        """
        Detect market regime based on features.
        - Trending: strong momentum + low mean-rev signals
        - Ranging: high BB z-score + high liq proximity
        - Volatile: high ATR-equivalent signals
        """
        bb_zscore = abs(features.get("bollinger_zscore", 0))
        momentum_1h = abs(features.get("price_momentum_1h", 0))
        liq_proximity = features.get("liq_proximity_score", 0)

        if momentum_1h > 0.02 and bb_zscore > 1.5:
            return "trending"
        elif bb_zscore < 0.5 and liq_proximity > 0.3:
            return "ranging"
        elif bb_zscore > 2.0:
            return "volatile"
        else:
            return "neutral"

    def _compute_confidence(
        self,
        mom_pred: float,
        mrev_pred: float,
        features: Dict[str, float],
    ) -> float:
        """
        Confidence = agreement between models + feature quality.
        Higher when both models agree on direction.
        """
        # Agreement: both models pointing same direction
        if mom_pred * mrev_pred > 0:
            agreement = min(abs(mom_pred), abs(mrev_pred)) / max(abs(mom_pred), abs(mrev_pred), 0.001)
        else:
            agreement = 0.0

        # Signal strength
        signal_strength = min(abs(mom_pred) + abs(mrev_pred), 1.0)

        # Liquidation proximity bonus (higher confidence near liq clusters)
        liq_bonus = features.get("liq_proximity_score", 0) * 0.2

        confidence = 0.4 * agreement + 0.4 * signal_strength + 0.2 * liq_bonus
        return float(np.clip(confidence, 0, 1))

    def get_all_signals(self) -> Dict[str, SignalResult]:
        """Get signals for all tracked assets."""
        from src.config import ASSETS
        results = {}
        for asset in ASSETS:
            try:
                results[asset] = self.predict(asset)
            except Exception as e:
                print(f"[WARN] Signal error for {asset}: {e}")
                results[asset] = SignalResult(
                    signal=0.0,
                    confidence=0.0,
                    momentum_raw=0.0,
                    meanrev_raw=0.0,
                    feature_values={},
                    regime="unknown",
                )
        return results
