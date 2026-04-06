import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface RiskData {
  var_95_1d: number;
  daily_drawdown_pct: number;
  monthly_drawdown_pct: number;
  net_delta: number;
  breach: boolean;
  drawdown_reduction_factor: number;
  max_drawdown_pct: number;
  zeta_health_rate: number;
  timestamp: number;
}

export function useRisk() {
  return useQuery<RiskData>({
    queryKey: ["risk"],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/risk`);
      if (!res.ok) throw new Error(`Risk endpoint error: HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60_000,
    retry: 2,
  });
}
