// ═══════════════════════════════════════════════════════
// Admin Script: Add LP Token Metadata
// ═══════════════════════════════════════════════════════
// NOTE: createAddLpMetadataIx does not exist in vault-sdk v0.1.6.
// This script is a placeholder for future SDK versions that support
// LP token metadata. For now, LP token metadata must be set via
// other means (e.g., Metaplex token-metadata program directly).

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import {
  loadKeypair,
  logStep,
  logSuccess,
  logError,
} from "../helper";
import { RPC_URL, ADMIN_KEYPAIR_PATH, VAULT_ADDRESS } from "../variables";
import { RANGER_VAULT_CONFIG } from "../constants";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep("LP token metadata setup");

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // The vault-sdk v0.1.6 does not include createAddLpMetadataIx.
  // LP metadata (name, symbol, URI) would need to be set using
  // the Metaplex token-metadata program or a future SDK version.
  console.log("\n[WARNING] createAddLpMetadataIx is not available in vault-sdk v0.1.6");
  console.log("   LP token metadata must be set via Metaplex token-metadata program.");
  console.log(`   Intended Name:   ${RANGER_VAULT_CONFIG.name}`);
  console.log(`   Intended Symbol: ${RANGER_VAULT_CONFIG.symbol}`);

  // Fetch vault to verify it exists
  const vaultState = await client.fetchVaultAccount(vault);
  logSuccess(`Vault verified: admin=${vaultState.admin?.toString()}`);
  console.log("   LP metadata setup skipped (SDK limitation).");
}

main().catch((err) => {
  logError("Failed to add LP metadata", err);
  process.exit(1);
});
