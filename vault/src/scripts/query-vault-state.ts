// ═══════════════════════════════════════════════════════
// Query Script: Vault State
// ═══════════════════════════════════════════════════════
// Fetches and displays current vault TVL, NAV, shares, fees.

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { getMint } from "@solana/spl-token";
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

  const vs = vaultState as Record<string, any>;
  const totalAssets = Number(vs.asset?.totalValue ?? 0);

  // Get LP supply from the LP mint
  const lpMint = client.findVaultLpMint(vault);
  const lpMintInfo = await getMint(connection, lpMint);
  const totalShares = Number(lpMintInfo.supply);

  const navPerShare = totalShares > 0 ? totalAssets / totalShares : 1;

  // Access nested fee configuration
  const feeConfig = vs.feeConfiguration ?? {};
  const managerPerfFee = feeConfig?.managerPerformanceFee ?? 0;
  const adminPerfFee = feeConfig?.adminPerformanceFee ?? 0;
  const managerMgmtFee = feeConfig?.managerManagementFee ?? 0;
  const adminMgmtFee = feeConfig?.adminManagementFee ?? 0;

  console.log("\n══════════════════════════════════════════");
  console.log("VAULT STATE");
  console.log("══════════════════════════════════════════");
  console.log(`   Address:           ${VAULT_ADDRESS}`);
  console.log(`   Admin:             ${vaultState.admin?.toString()}`);
  console.log(`   Manager:           ${vaultState.manager?.toString()}`);
  console.log(`   Asset Mint:        ${vs.asset?.mint?.toString()}`);
  console.log(`   Total Assets:      ${(totalAssets / 1e6).toFixed(2)} USDC`);
  console.log(`   Total Shares:      ${(totalShares / 1e6).toFixed(6)}`);
  console.log(`   NAV per Share:     ${navPerShare.toFixed(6)}`);
  console.log(`   Mgr Perf Fee:      ${managerPerfFee / 100}%`);
  console.log(`   Admin Perf Fee:    ${adminPerfFee / 100}%`);
  console.log(`   Mgr Mgmt Fee:      ${managerMgmtFee / 100}%`);
  console.log(`   Admin Mgmt Fee:    ${adminMgmtFee / 100}%`);
  console.log("══════════════════════════════════════════");

  logSuccess("Vault state fetched successfully");
}

main().catch((err) => {
  logError("Failed to fetch vault state", err);
  process.exit(1);
});
