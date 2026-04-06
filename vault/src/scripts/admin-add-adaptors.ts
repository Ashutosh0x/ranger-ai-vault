// ═══════════════════════════════════════════════════════
// Admin Script: Add Adaptors
// ═══════════════════════════════════════════════════════
// Adds Zeta and Kamino adaptors to the vault.
// Must be run after admin-init-vault.ts

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
import {
  ZETA_ADAPTOR_PROGRAM_ID,
  KAMINO_ADAPTOR_PROGRAM_ID,
} from "../constants";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set. Run admin-init-vault.ts first.");
    process.exit(1);
  }

  logStep("Adding adaptors to vault", { vault: VAULT_ADDRESS });

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // Add Zeta Adaptor
  logStep("Adding Zeta Adaptor...", {
    adaptor: ZETA_ADAPTOR_PROGRAM_ID.toString(),
  });

  const addZetaAdaptorIx = await client.createAddAdaptorIx({
    vault,
    admin: adminKp.publicKey,
    adaptorProgram: ZETA_ADAPTOR_PROGRAM_ID,
  });

  const sig1 = await sendAndConfirmOptimisedTx(
    connection,
    [addZetaAdaptorIx],
    [adminKp],
  );
  logSuccess(`Zeta Adaptor added: ${sig1}`);

  // Add Kamino Adaptor
  logStep("Adding Kamino Adaptor...", {
    adaptor: KAMINO_ADAPTOR_PROGRAM_ID.toString(),
  });

  const addKaminoAdaptorIx = await client.createAddAdaptorIx({
    vault,
    admin: adminKp.publicKey,
    adaptorProgram: KAMINO_ADAPTOR_PROGRAM_ID,
  });

  const sig2 = await sendAndConfirmOptimisedTx(
    connection,
    [addKaminoAdaptorIx],
    [adminKp],
  );
  logSuccess(`Kamino Adaptor added: ${sig2}`);

  logSuccess("Both adaptors added successfully!");
}

main().catch((err) => {
  logError("Failed to add adaptors", err);
  process.exit(1);
});
