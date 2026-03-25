// ═══════════════════════════════════════════════════════
// Admin Script: Update Vault Config
// ═══════════════════════════════════════════════════════
// Update vault configuration post-deployment:
// MaxCap, WithdrawalWaitingPeriod, fees

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
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
  const updateIx = await client.createUpdateVaultConfigIx(
    {
      newConfig: {
        maxCap: BigInt("10000000000000"),        // 10M USDC
        withdrawalWaitingPeriod: BigInt(0),
        performanceFeeBps: 1000,                  // 10%
        managementFeeBps: 200,                    // 2%
      },
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
