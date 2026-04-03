// types/settings.ts

export type ApiService =
  | "SIGNAL_ENGINE"
  | "HELIUS_RPC"
  | "COINGLASS"
  | "DRIFT"
  | "BIRDEYE"
  | "JUPITER"
  | "COBO_MPC"
  | "CUSTOM";

export type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";

export type KeyAction =
  | "CREATED"
  | "ROTATED"
  | "UPDATED"
  | "DEACTIVATED"
  | "REACTIVATED"
  | "DELETED"
  | "TESTED"
  | "TEST_FAILED";

export type ConnectionState =
  | "untested"
  | "testing"
  | "connected"
  | "error"
  | "timeout";

// ── Frontend-safe API key (never includes raw key) ──
export interface ApiKeyDisplay {
  id: string;
  name: string;
  service: ApiService;
  maskedKey: string;
  endpointUrl?: string | null;
  isActive: boolean;
  environment: Environment;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastRotatedAt: string | null;
  rotationCount: number;
  createdAt: string;
  updatedAt: string;
  connectionState?: ConnectionState;
}

// ── Create / Update payloads ──
export interface CreateApiKeyPayload {
  name: string;
  service: ApiService;
  apiKey: string;
  endpointUrl?: string;
  environment?: Environment;
  expiresAt?: string;
}

export interface UpdateApiKeyPayload {
  name?: string;
  apiKey?: string;
  endpointUrl?: string;
  isActive?: boolean;
  expiresAt?: string | null;
}

export interface RotateApiKeyPayload {
  newApiKey: string;
}

// ── History entry ──
export interface ApiKeyHistoryEntry {
  id: string;
  action: KeyAction;
  performedBy: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

// ── Connection test result ──
export interface ConnectionTestResult {
  service: ApiService;
  success: boolean;
  latencyMs: number;
  message: string;
  details?: Record<string, any>;
}

// ── Service metadata (static config) ──
export interface ServiceConfig {
  service: ApiService;
  label: string;
  description: string;
  docsUrl: string;
  icon: string;
  requiresUrl: boolean;
  testEndpoint?: string;
  rotationRecommendedDays: number;
}
