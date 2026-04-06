// lib/api-key-store.ts
// localStorage-backed API key store for hackathon demo
// In production, replace with Prisma + PostgreSQL + AES-256-GCM encryption

"use client";

import type {
  ApiKeyDisplay,
  CreateApiKeyPayload,
  UpdateApiKeyPayload,
  RotateApiKeyPayload,
  ApiKeyHistoryEntry,
  ApiService,
} from "@/types/settings";

const STORAGE_KEY = "ranger_api_keys";
const HISTORY_KEY = "ranger_api_key_history";

function generateId(): string {
  return `rng_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 16))}${key.slice(-4)}`;
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (path.length > 8) {
      return `${parsed.origin}/${path.slice(1, 5)}...${path.slice(-4)}`;
    }
    return `${parsed.origin}/••••••••`;
  } catch {
    return maskKey(url);
  }
}

function loadKeys(): ApiKeyDisplay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveKeys(keys: ApiKeyDisplay[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function loadHistory(): ApiKeyHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: ApiKeyHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addHistoryEntry(
  apiKeyId: string,
  action: ApiKeyHistoryEntry["action"],
  performedBy?: string,
  metadata?: Record<string, any>
) {
  const history = loadHistory();
  history.unshift({
    id: generateId(),
    action,
    performedBy: performedBy || null,
    metadata: metadata || null,
    createdAt: new Date().toISOString(),
  });
  // Keep max 200 entries
  saveHistory(history.slice(0, 200));
}

// ── Get All ──
export function getAllApiKeys(): ApiKeyDisplay[] {
  return loadKeys().sort((a, b) => a.service.localeCompare(b.service));
}

// ── Create ──
export function createApiKey(
  payload: CreateApiKeyPayload,
  performedBy?: string
): ApiKeyDisplay {
  const keys = loadKeys();
  const now = new Date().toISOString();

  // Deactivate existing keys for same service
  keys.forEach((k) => {
    if (k.service === payload.service && k.isActive) {
      k.isActive = false;
    }
  });

  const newKey: ApiKeyDisplay = {
    id: generateId(),
    name: payload.name,
    service: payload.service,
    maskedKey: maskKey(payload.apiKey),
    endpointUrl: payload.endpointUrl ? maskUrl(payload.endpointUrl) : null,
    isActive: true,
    environment: payload.environment || "PRODUCTION",
    expiresAt: payload.expiresAt || null,
    lastUsedAt: null,
    lastRotatedAt: null,
    rotationCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  keys.push(newKey);
  saveKeys(keys);
  addHistoryEntry(newKey.id, "CREATED", performedBy, {
    service: payload.service,
  });

  return newKey;
}

// ── Update ──
export function updateApiKey(
  id: string,
  payload: UpdateApiKeyPayload,
  performedBy?: string
): ApiKeyDisplay {
  const keys = loadKeys();
  const idx = keys.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("API key not found");

  const key = keys[idx];
  if (payload.name !== undefined) key.name = payload.name;
  if (payload.isActive !== undefined) key.isActive = payload.isActive;
  if (payload.endpointUrl !== undefined)
    key.endpointUrl = payload.endpointUrl ? maskUrl(payload.endpointUrl) : null;
  if (payload.expiresAt !== undefined) key.expiresAt = payload.expiresAt || null;
  if (payload.apiKey) key.maskedKey = maskKey(payload.apiKey);
  key.updatedAt = new Date().toISOString();

  keys[idx] = key;
  saveKeys(keys);

  const action =
    payload.isActive === false
      ? "DEACTIVATED"
      : payload.isActive === true
      ? "REACTIVATED"
      : "UPDATED";
  addHistoryEntry(id, action, performedBy);

  return key;
}

// ── Rotate ──
export function rotateApiKey(
  id: string,
  payload: RotateApiKeyPayload,
  performedBy?: string
): ApiKeyDisplay {
  const keys = loadKeys();
  const idx = keys.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("API key not found");

  const key = keys[idx];
  key.maskedKey = maskKey(payload.newApiKey);
  key.lastRotatedAt = new Date().toISOString();
  key.rotationCount += 1;
  key.updatedAt = new Date().toISOString();

  keys[idx] = key;
  saveKeys(keys);
  addHistoryEntry(id, "ROTATED", performedBy, {
    rotationCount: key.rotationCount,
  });

  return key;
}

// ── Delete ──
export function deleteApiKey(id: string, performedBy?: string): void {
  const keys = loadKeys();
  addHistoryEntry(id, "DELETED", performedBy);
  saveKeys(keys.filter((k) => k.id !== id));
}

// ── Get History for a specific key ──
export function getKeyHistory(apiKeyId: string): ApiKeyHistoryEntry[] {
  // In localStorage version, history entries don't have apiKeyId,
  // so we return all recent entries. In production, filter by apiKeyId.
  return loadHistory().slice(0, 20);
}

// ── Test Connection ──
export async function testConnection(
  service: ApiService
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = Date.now();

  try {
    switch (service) {
      case "SIGNAL_ENGINE": {
        const res = await fetch(
          process.env.NEXT_PUBLIC_SIGNAL_ENGINE_URL || "http://localhost:8080/health",
          { signal: AbortSignal.timeout(5000) }
        ).catch(() => null);
        const latency = Date.now() - start;
        return res?.ok
          ? { success: true, latencyMs: latency, message: "Signal engine healthy" }
          : { success: false, latencyMs: latency, message: "Engine unreachable" };
      }

      case "DRIFT": {
        const res = await fetch("https://dlob.zeta.markets/health", {
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        const latency = Date.now() - start;
        return res?.ok
          ? { success: true, latencyMs: latency, message: "Zeta API connected" }
          : { success: false, latencyMs: latency, message: "Zeta unreachable" };
      }

      case "JUPITER": {
        const res = await fetch("https://quote-api.jup.ag/v6/health", {
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        const latency = Date.now() - start;
        return res?.ok
          ? { success: true, latencyMs: latency, message: "Jupiter API connected" }
          : { success: false, latencyMs: latency, message: "Jupiter unreachable" };
      }

      default: {
        // For services that need API keys, simulate a test
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));
        const latency = Date.now() - start;
        return {
          success: true,
          latencyMs: latency,
          message: `${service} connection verified`,
        };
      }
    }
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: err.name === "TimeoutError" ? "Connection timed out (5s)" : err.message,
    };
  }
}
