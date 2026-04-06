# Strategy Document — Ranger AI Vault

## Strategy #3: AI-Powered Momentum + Mean-Reversion Hybrid

### Thesis
Markets oscillate between trend-following and mean-reverting regimes. By using an ML ensemble that detects the current regime and switches strategies accordingly, we can capture alpha in both conditions while maintaining strict risk controls.

### Novel Feature: Liquidation Heatmap Alpha
We incorporate real-time liquidation data from Coinglass as ML features:
- **Liquidation clusters act as price magnets** — large concentrations of leverage liquidation orders attract price action
- **Imbalance ratio** identifies which side (long/short) is more vulnerable
- **Proximity scoring** detects when price is near a major cluster, increasing mean-reversion probability

### Capital Allocation
- **Engine A (50%)**: Kamino Lending — USDC → 8-10% base APY (floor yield, always positive)
- **Engine B (50%)**: Zeta Perps — ML signal-driven, momentum + mean-reversion blend

### Signal Pipeline
1. Fetch data: funding rates, OI, volume, liquidation heatmap, oracle prices
2. Engineer 15 features (7 from liquidation data)
3. Run XGBoost ensemble: 40% momentum + 60% mean-reversion
4. Dynamic regime detection adjusts weights
5. Kelly criterion position sizing with fractional (0.25×) scaling
6. Pre-trade risk validation (drawdown, delta, VaR)

### Risk Guardrails
- 3% daily / 8% monthly max drawdown → halt all trading
- 2× max leverage, 0.10 max net delta
- -0.5% stop loss / +1.5% take profit per trade
- Ed25519 attestation prevents rogue trades

### Target Performance
- **APY**: 15-25% (blended floor + active)
- **Sharpe**: > 1.5
- **Max Drawdown**: < 8%
