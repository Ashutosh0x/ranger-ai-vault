"""
Test Signal Server -- FastAPI endpoint tests
"""
import pytest
from fastapi.testclient import TestClient

from src.signal_server import app
from src.config import KEEPER_SECRET

client = TestClient(app)

HEADERS = {"X-Keeper-Secret": KEEPER_SECRET} if KEEPER_SECRET else {}


class TestHealthEndpoint:
    def test_health_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "assets_tracked" in data


class TestSignalEndpoint:
    def test_valid_asset(self):
        resp = client.get("/signal", params={"asset": "SOL-PERP"}, headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert data["asset"] == "SOL-PERP"
        assert "signal" in data
        assert "confidence" in data

    def test_invalid_asset(self):
        resp = client.get("/signal", params={"asset": "INVALID"}, headers=HEADERS)
        assert resp.status_code == 422

    def test_no_auth(self):
        if KEEPER_SECRET:
            resp = client.get("/signal", params={"asset": "SOL-PERP"})
            assert resp.status_code == 403


class TestRiskEndpoint:
    def test_risk_ok(self):
        resp = client.get("/risk", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert "daily_drawdown_pct" in data
        assert "net_delta" in data


class TestAllSignals:
    def test_all_signals(self):
        resp = client.get("/signals/all", headers=HEADERS)
        assert resp.status_code == 200
