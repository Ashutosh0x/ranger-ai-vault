// ═══════════════════════════════════════════════════════
// Query Script: Vault State
// ═══════════════════════════════════════════════════════
// Fetches and displays current vault TVL, NAV, shares, fees.

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

  logStep("Fetching vault state...");

  const vaultState = await client.fetchVaultAccount(vault);

  const totalAssets = Number(vaultState.totalAssets);
  const totalShares = Number(vaultState.totalShares);
  const navPerShare = totalShares > 0 ? totalAssets / totalShares : 1;

  console.log("\n══════════════════════════════════════════");
  console.log("🏦 VAULT STATE");
  console.log("══════════════════════════════════════════");
  console.log(`   Address:           ${VAULT_ADDRESS}`);
  console.log(`   Admin:             ${vaultState.admin?.toString()}`);
  console.log(`   Manager:           ${vaultState.manager?.toString()}`);
  console.log(`   Asset Mint:        ${vaultState.assetMint?.toString()}`);
  console.log(`   Total Assets:      ${(totalAssets / 1e6).toFixed(2)} USDC`);
  console.log(`   Total Shares:      ${(totalShares / 1e6).toFixed(6)}`);
  console.log(`   NAV per Share:     ${navPerShare.toFixed(6)}`);
  console.log(`   Performance Fee:   ${(vaultState as any).performanceFeeBps / 100}%`);
  console.log(`   Management Fee:    ${(vaultState as any).managementFeeBps / 100}%`);
  console.log("══════════════════════════════════════════");

  logSuccess("Vault state fetched successfully");
}

main().catch((err) => {
  logError("Failed to fetch vault state", err);
  process.exit(1);
});
