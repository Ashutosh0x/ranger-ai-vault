"use client";

export default function PositionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Positions</h1>
        <p className="text-gray-400 mt-1">Active Drift perp positions managed by the AI keeper</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Open Positions</p>
          <p className="text-2xl font-bold mt-2">0</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Unrealized P&L</p>
          <p className="text-2xl font-bold mt-2">$0.00</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Realized P&L (Today)</p>
          <p className="text-2xl font-bold mt-2">$0.00</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Net Delta</p>
          <p className="text-2xl font-bold mt-2">0.000</p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-vault-border">
                <th className="text-left py-3 px-4">Asset</th>
                <th className="text-right py-3 px-4">Side</th>
                <th className="text-right py-3 px-4">Size (USDC)</th>
                <th className="text-right py-3 px-4">Entry Price</th>
                <th className="text-right py-3 px-4">Current Price</th>
                <th className="text-right py-3 px-4">Unrealized P&L</th>
                <th className="text-right py-3 px-4">Leverage</th>
                <th className="text-right py-3 px-4">Attested</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-8 px-4 text-center text-gray-500" colSpan={8}>
                  No open positions — keeper is idle or signal server offline
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade History */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-vault-border">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Asset</th>
                <th className="text-right py-3 px-4">Action</th>
                <th className="text-right py-3 px-4">Size</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">P&L</th>
                <th className="text-right py-3 px-4">Signal</th>
                <th className="text-right py-3 px-4">TX</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-8 px-4 text-center text-gray-500" colSpan={8}>
                  No trade history yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
