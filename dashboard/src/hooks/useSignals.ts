import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface SignalData {
  signal: number;
  confidence: number;
  momentum_component: number;
  meanrev_component: number;
  regime: string;
}

export function useSignals() {
  return useQuery<Record<string, SignalData>>({
    queryKey: ["signals"],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/signals/all`);
      if (!res.ok) throw new Error(`Signal server error: HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    retry: 2,
  });
}

export function useSignal(asset: string) {
  return useQuery<SignalData & { asset: string; features: Record<string, number>; timestamp: number }>({
    queryKey: ["signal", asset],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/signal?asset=${asset}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    enabled: !!asset,
  });
}
