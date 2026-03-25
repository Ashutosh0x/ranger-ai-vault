// ═══════════════════════════════════════════════════════
// Query Script: Strategy Positions
// ═══════════════════════════════════════════════════════
// Queries all strategy allocations and displays breakdown.

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { logStep, logSuccess, logError } from "../helper";
import {
  RPC_URL,
  VAULT_ADDRESS,
  KAMINO_STRATEGY_ADDRESS,
  DRIFT_LEND_STRATEGY_ADDRESS,
  DRIFT_PERPS_STRATEGY_ADDRESS,
} from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const vault = new PublicKey(VAULT_ADDRESS);

  logStep("Fetching strategy positions...");

  const vaultState = await client.fetchVaultAccount(vault);
  const totalAssets = Number(vaultState.totalAssets);

  const strategies = [
    { name: "Kamino Lending (Floor)", address: KAMINO_STRATEGY_ADDRESS },
    { name: "Drift Lend (Fallback)", address: DRIFT_LEND_STRATEGY_ADDRESS },
    { name: "Drift Perps (Active)", address: DRIFT_PERPS_STRATEGY_ADDRESS },
  ].filter((s) => s.address);

  console.log("\n══════════════════════════════════════════");
  console.log("📊 STRATEGY POSITIONS");
  console.log("══════════════════════════════════════════");

  let totalAllocated = 0;

  for (const strategy of strategies) {
    try {
      const strategyState = await client.fetchStrategyAccount(
        new PublicKey(strategy.address),
      );
      const currentAssets = Number((strategyState as any).currentAssets || 0);
      const pct = totalAssets > 0 ? ((currentAssets / totalAssets) * 100).toFixed(1) : "0.0";
      totalAllocated += currentAssets;

      console.log(`\n   📌 ${strategy.name}`);
      console.log(`      Address:  ${strategy.address}`);
      console.log(`      Assets:   ${(currentAssets / 1e6).toFixed(2)} USDC (${pct}%)`);
    } catch (err: any) {
      console.log(`\n   📌 ${strategy.name}`);
      console.log(`      Address:  ${strategy.address}`);
      console.log(`      Status:   Unable to fetch (${err.message})`);
    }
  }

  const idleAssets = totalAssets - totalAllocated;
  console.log(`\n   💰 Idle (unallocated)`);
  console.log(`      Assets:   ${(idleAssets / 1e6).toFixed(2)} USDC (${totalAssets > 0 ? ((idleAssets / totalAssets) * 100).toFixed(1) : "0.0"}%)`);
  console.log(`\n   📈 Total:    ${(totalAssets / 1e6).toFixed(2)} USDC`);
  console.log("══════════════════════════════════════════");

  logSuccess("Strategy positions fetched");
}

main().catch((err) => {
  logError("Failed to fetch strategy positions", err);
  process.exit(1);
});
