import { useQuery } from "@tanstack/react-query";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

export interface BacktestData {
  total_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  total_pnl_usd: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  annualized_return: number;
  initial_capital: number;
  final_equity: number;
  total_return_pct: number;
  avg_hold_periods: number;
  equity_curve_raw: Array<{ candle: number; equity: number }>;
  generated_at: string;
  assets: string[];
  walk_forward: boolean;
}

export function useBacktest() {
  return useQuery<BacktestData>({
    queryKey: ["backtest"],
    queryFn: async () => {
      const res = await fetch(`${SIGNAL_URL}/backtest/results`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: Infinity, // Backtest results don't change often
    retry: 1,
  });
}
