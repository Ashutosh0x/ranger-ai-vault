// ═══════════════════════════════════════════════════════
// Query Script: Performance Metrics
// ═══════════════════════════════════════════════════════
// Computes NAV, returns, high water mark, estimated APY.

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { logStep, logSuccess, logError } from "../helper";
import { RPC_URL, VAULT_ADDRESS } from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const vault = new PublicKey(VAULT_ADDRESS);

  logStep("Computing performance metrics...");

  const vaultState = await client.fetchVaultAccount(vault);

  const totalAssets = Number(vaultState.totalAssets);
  const totalShares = Number(vaultState.totalShares);
  const navPerShare = totalShares > 0 ? totalAssets / totalShares : 1.0;

  // Calculate returns (assuming initial NAV = 1.0)
  const totalReturn = navPerShare - 1.0;
  const totalReturnPct = totalReturn * 100;

  // Estimate APY (simple annualization)
  // In production, use actual time-weighted calculation
  const startDate = Number((vaultState as any).startDate || Math.floor(Date.now() / 1000));
  const now = Math.floor(Date.now() / 1000);
  const daysElapsed = Math.max((now - startDate) / 86400, 1);
  const dailyReturn = totalReturn / daysElapsed;
  const estimatedApy = dailyReturn * 365 * 100;

  console.log("\n══════════════════════════════════════════");
  console.log("📈 PERFORMANCE METRICS");
  console.log("══════════════════════════════════════════");
  console.log(`   NAV per Share:      ${navPerShare.toFixed(6)}`);
  console.log(`   Total Return:       ${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(4)}%`);
  console.log(`   Days Elapsed:       ${daysElapsed.toFixed(1)}`);
  console.log(`   Daily Return:       ${(dailyReturn * 100).toFixed(4)}%`);
  console.log(`   Estimated APY:      ${estimatedApy >= 0 ? "+" : ""}${estimatedApy.toFixed(2)}%`);
  console.log(`   Total Assets:       ${(totalAssets / 1e6).toFixed(2)} USDC`);
  console.log(`   Total LP Supply:    ${(totalShares / 1e6).toFixed(6)}`);
  console.log("══════════════════════════════════════════");

  // APY threshold check (hackathon requirement: min 10%)
  if (estimatedApy >= 10) {
    console.log("\n   ✅ APY meets hackathon minimum (10%)");
  } else {
    console.log(`\n   ⚠️  APY below hackathon minimum (10%). Current: ${estimatedApy.toFixed(2)}%`);
  }

  logSuccess("Performance metrics computed");
}

main().catch((err) => {
  logError("Failed to compute performance", err);
  process.exit(1);
});
