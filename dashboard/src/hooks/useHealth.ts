import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface HealthData {
  status: string;
  models_loaded: boolean;
  assets_tracked: number;
  coinglass_key_set: boolean;
  helius_rpc_set: boolean;
  timestamp: number;
}

export function useHealth() {
  return useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${SIGNAL_URL}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch {
        // Signal engine offline — return offline status silently
        return {
          status: "offline",
          models_loaded: false,
          assets_tracked: 0,
          coinglass_key_set: false,
          helius_rpc_set: false,
          timestamp: Date.now() / 1000,
        };
      }
    },
    refetchInterval: 30_000, // Poll every 30s instead of 15s
    retry: false, // Don't retry — just mark as offline
    staleTime: 25_000,
  });
}
