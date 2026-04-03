const BASE = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

// ── Signal Engine ────────────────────────────────────────
export const fetchHealth = () =>
  fetch(`${BASE}/health`).then((r) => r.json());

export const fetchMetrics = () =>
  fetch(`${BASE}/metrics`).then((r) => r.json());

export const fetchSignals = () =>
  fetch(`${BASE}/signals`).then((r) => r.json());

export const fetchPositions = () =>
  fetch(`${BASE}/positions`).then((r) => r.json());

export const fetchRisk = () =>
  fetch(`${BASE}/risk`).then((r) => r.json());

export const fetchBacktest = () =>
  fetch(`${BASE}/backtest/results`).then((r) => r.json());

export const fetchLogs = (limit = 100) =>
  fetch(`${BASE}/logs?limit=${limit}`).then((r) => r.json());

export const fetchAttestations = () =>
  fetch(`${BASE}/logs/attestations`).then((r) => r.json());

export const fetchFeatures = () =>
  fetch(`${BASE}/features`).then((r) => r.json());

// ── Next.js API Proxies ──────────────────────────────────
export const fetchVaultState = () =>
  fetch(`/api/vault-state`).then((r) => r.json());

export const fetchHealthProxy = () =>
  fetch(`/api/health`).then((r) => r.json());

export const fetchMetricsProxy = () =>
  fetch(`/api/metrics`).then((r) => r.json());
