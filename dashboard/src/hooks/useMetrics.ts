import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface MetricsData {
  nav_usdc: number;
  initial_nav: number;
  total_return_pct: number;
  realized_apy: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  high_water_mark: number;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  total_pnl_usd: number;
  uptime_hours: number;
  equity_curve: Array<{ timestamp: string; nav: number; benchmark?: number }>;
  timestamp: number;
}

export function useMetrics() {
  return useQuery<MetricsData>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
