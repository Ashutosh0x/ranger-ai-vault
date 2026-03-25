// ═══════════════════════════════════════════════════════
// Admin Script: Add LP Token Metadata
// ═══════════════════════════════════════════════════════
// Sets name, symbol, and URI for the vault's LP token
// so it displays properly in wallets and explorers.

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
import { LP_TOKEN_METADATA } from "../constants";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep("Adding LP token metadata");

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  const addMetadataIx = await client.createAddLpMetadataIx(
    {
      name: LP_TOKEN_METADATA.name,
      symbol: LP_TOKEN_METADATA.symbol,
      uri: LP_TOKEN_METADATA.uri || "",
    },
    {
      vault,
      admin: adminKp.publicKey,
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [addMetadataIx],
    [adminKp],
  );

  logSuccess(`LP metadata set: ${sig}`);
  console.log(`   Name:   ${LP_TOKEN_METADATA.name}`);
  console.log(`   Symbol: ${LP_TOKEN_METADATA.symbol}`);
}

main().catch((err) => {
  logError("Failed to add LP metadata", err);
  process.exit(1);
});
