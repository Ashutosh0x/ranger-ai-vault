import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface LogEntry {
  timestamp: number;
  level: string;
  message: string;
  category: string;
}

export function useLogs(limit: number = 50) {
  return useQuery<LogEntry[]>({
    queryKey: ["logs", limit],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/logs?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 10_000,
  });
}
