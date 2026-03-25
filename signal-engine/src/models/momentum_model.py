"""
Momentum Model — XGBRegressor for 1h forward price momentum.
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from typing import Optional, Dict
from src.config import MODEL_PARAMS, FEATURE_COLUMNS


class MomentumModel:
    """Predicts 1-hour forward momentum (directional move)."""

    def __init__(self):
        params = MODEL_PARAMS["momentum"]
        self.model = XGBRegressor(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            learning_rate=params["learning_rate"],
            subsample=params["subsample"],
            colsample_bytree=params["colsample_bytree"],
            reg_alpha=params["reg_alpha"],
            reg_lambda=params["reg_lambda"],
            min_child_weight=params["min_child_weight"],
            objective="reg:squarederror",
            random_state=42,
        )
        self.is_trained = False
        self.feature_importance: Dict[str, float] = {}

    def train(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Train the momentum model.
        X: Feature matrix (FEATURE_COLUMNS)
        y: 1h forward return (target)
        """
        self.model.fit(X, y)
        self.is_trained = True

        # Store feature importance
        importance = self.model.feature_importances_
        cols = X.columns.tolist() if hasattr(X, "columns") else FEATURE_COLUMNS
        self.feature_importance = dict(zip(cols, importance))

        # Training metrics
        train_pred = self.model.predict(X)
        mse = np.mean((y - train_pred) ** 2)
        rmse = np.sqrt(mse)
        corr = np.corrcoef(y, train_pred)[0, 1] if len(y) > 1 else 0.0

        return {
            "rmse": float(rmse),
            "correlation": float(corr),
            "n_samples": len(y),
        }

    def predict(self, features: Dict[str, float]) -> float:
        """Predict momentum signal from feature dict."""
        if not self.is_trained:
            return 0.0

        X = pd.DataFrame([features])[FEATURE_COLUMNS]
        pred = self.model.predict(X)[0]
        return float(pred)

    def predict_batch(self, X: pd.DataFrame) -> np.ndarray:
        """Predict for a batch of feature vectors."""
        if not self.is_trained:
            return np.zeros(len(X))
        return self.model.predict(X[FEATURE_COLUMNS])

    def get_feature_importance(self) -> Dict[str, float]:
        """Return feature importance ranking."""
        return dict(sorted(
            self.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True,
        ))
