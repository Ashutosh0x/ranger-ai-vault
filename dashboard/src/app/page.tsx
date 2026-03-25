"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Ranger AI Vault — Live Performance</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Value Locked" value="$0.00" subtitle="USDC" accent />
        <MetricCard title="Current APY" value="--%" subtitle="Estimated" />
        <MetricCard title="NAV per Share" value="1.000000" subtitle="LP Token" />
        <MetricCard title="Active Positions" value="0" subtitle="Drift Perps" />
      </div>

      {/* Strategy Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Strategy Allocation</h2>
          <div className="space-y-4">
            <AllocationBar label="Kamino Lending (Floor)" pct={50} color="#06D6A0" />
            <AllocationBar label="Drift Lend" pct={25} color="#0CA5EA" />
            <AllocationBar label="Drift Perps (Active)" pct={25} color="#FFD166" />
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Engine Status</h2>
          <div className="space-y-3">
            <StatusRow label="Signal Server" status="offline" />
            <StatusRow label="Keeper Bot" status="offline" />
            <StatusRow label="ML Models" status="not_loaded" />
            <StatusRow label="Risk Monitor" status="offline" />
          </div>
        </div>
      </div>

      {/* Live Signals */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Live Signals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-vault-border">
                <th className="text-left py-3 px-4">Asset</th>
                <th className="text-right py-3 px-4">Signal</th>
                <th className="text-right py-3 px-4">Confidence</th>
                <th className="text-right py-3 px-4">Regime</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {["SOL-PERP", "BTC-PERP", "ETH-PERP"].map((asset) => (
                <tr key={asset} className="border-b border-vault-border/30 hover:bg-white/5">
                  <td className="py-3 px-4 font-medium">{asset}</td>
                  <td className="py-3 px-4 text-right text-gray-500">--</td>
                  <td className="py-3 px-4 text-right text-gray-500">--</td>
                  <td className="py-3 px-4 text-right text-gray-500">--</td>
                  <td className="py-3 px-4 text-right text-gray-500">Waiting</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric-card ${accent ? "glow-accent" : ""}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${accent ? "text-vault-accent" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function AllocationBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 bg-vault-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: "online" | "offline" | "not_loaded";
}) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    not_loaded: "bg-yellow-500",
  };
  const labels = {
    online: "Online",
    offline: "Offline",
    not_loaded: "Not Loaded",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        <span className="text-xs text-gray-400">{labels[status]}</span>
      </div>
    </div>
  );
}
