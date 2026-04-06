// ═══════════════════════════════════════════════════════
// Admin Script: Update Vault Config
// ═══════════════════════════════════════════════════════
// Update vault configuration post-deployment:
// MaxCap, StartAtTs, fees

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { BN } from "@coral-xyz/anchor";
import {
  loadKeypair,
  sendAndConfirmOptimisedTx,
  logStep,
  logSuccess,
  logError,
} from "../helper";
import { RPC_URL, ADMIN_KEYPAIR_PATH, VAULT_ADDRESS } from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep("Updating vault config");

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // Customize these values as needed
  const updateIx = await client.createUpdateVaultIx(
    {
      maxCap: new BN("10000000000000"),              // 10M USDC
      startAtTs: new BN(Math.floor(Date.now() / 1000)),
      lockedProfitDegradationDuration: new BN(21600), // 6 hours
      managerPerformanceFee: 1000,                    // 10%
      adminPerformanceFee: 1000,                      // 10%
      managerManagementFee: 200,                      // 2%
      adminManagementFee: 200,                        // 2%
    },
    {
      vault,
      admin: adminKp.publicKey,
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [updateIx],
    [adminKp],
  );

  logSuccess(`Vault config updated: ${sig}`);
}

main().catch((err) => {
  logError("Failed to update vault config", err);
  process.exit(1);
});
