import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface PositionsData {
  positions: Record<string, {
    direction: string;
    size_usd: number;
    entry_price: number;
    unrealized_pnl: number;
    delta: number;
  }>;
  net_delta: number;
  within_limit: boolean;
  timestamp: number;
}

export function usePositions() {
  return useQuery<PositionsData>({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/positions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 15_000,
  });
}
