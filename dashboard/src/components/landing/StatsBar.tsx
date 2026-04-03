"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { CountUp } from "@/components/motion/CountUp";
import { useMetrics, useRisk, usePositions } from "@/hooks";

export function StatsBar() {
  const { data: metrics } = useMetrics();
  const { data: risk } = useRisk();
  const { data: positions } = usePositions();

  const posCount =
    positions?.positions != null
      ? Object.keys(positions.positions).length
      : 0;

  return (
    <section className="border-y border-vault-border glass-card !rounded-none">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Total NAV
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp
                  value={metrics?.nav_usdc ?? 0}
                  prefix="$"
                  decimals={2}
                />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Annualized APY
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp
                  value={(metrics?.realized_apy ?? 0) * 100}
                  suffix="%"
                  decimals={2}
                />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Sharpe Ratio
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp value={metrics?.sharpe_ratio ?? 0} decimals={2} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Max Drawdown
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp
                  value={risk?.max_drawdown_pct ?? 0}
                  prefix="-"
                  suffix="%"
                  decimals={2}
                />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Win Rate
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp
                  value={(metrics?.win_rate ?? 0) * 100}
                  suffix="%"
                  decimals={1}
                />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Active Positions
              </p>
              <p className="text-lg font-bold text-white tabular-nums">
                <CountUp value={posCount} decimals={0} />
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
