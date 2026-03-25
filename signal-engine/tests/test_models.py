"""
Test Models -- Unit tests for momentum, mean-rev, and ensemble
"""
import pytest
import numpy as np
import pandas as pd

from src.models.momentum_model import MomentumModel
from src.models.meanrev_model import MeanRevModel
from src.config import FEATURE_COLUMNS


def make_training_data(n=500):
    """Generate synthetic training data."""
    X = pd.DataFrame(
        np.random.randn(n, len(FEATURE_COLUMNS)),
        columns=FEATURE_COLUMNS,
    )
    y = pd.Series(np.random.randn(n) * 0.01)
    return X, y


class TestMomentumModel:
    def test_train(self):
        X, y = make_training_data()
        model = MomentumModel()
        metrics = model.train(X, y)
        assert model.is_trained is True
        assert "rmse" in metrics
        assert "correlation" in metrics

    def test_predict(self):
        X, y = make_training_data()
        model = MomentumModel()
        model.train(X, y)
        features = {col: float(np.random.randn()) for col in FEATURE_COLUMNS}
        pred = model.predict(features)
        assert isinstance(pred, float)

    def test_predict_untrained(self):
        model = MomentumModel()
        features = {col: 0.0 for col in FEATURE_COLUMNS}
        pred = model.predict(features)
        assert pred == 0.0

    def test_feature_importance(self):
        X, y = make_training_data()
        model = MomentumModel()
        model.train(X, y)
        importance = model.get_feature_importance()
        assert len(importance) > 0
        assert all(v >= 0 for v in importance.values())


class TestMeanRevModel:
    def test_train(self):
        X, y = make_training_data()
        model = MeanRevModel()
        metrics = model.train(X, y)
        assert model.is_trained is True
        assert metrics["n_samples"] == 500

    def test_predict_batch(self):
        X, y = make_training_data(100)
        model = MeanRevModel()
        model.train(X, y)
        preds = model.predict_batch(X)
        assert len(preds) == 100
