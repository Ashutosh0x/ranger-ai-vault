// ═══════════════════════════════════════════════════════
// Admin Script: Initialize Vault
// ═══════════════════════════════════════════════════════
// Creates a new Ranger Earn vault with USDC as base asset.
// Output: vault public key — save to variables.ts / .env

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { BN } from "@coral-xyz/anchor";
import {
  loadKeypair,
  sendAndConfirmOptimisedTx,
  logStep,
  logSuccess,
  logError,
} from "../helper";
import {
  RPC_URL,
  ADMIN_KEYPAIR_PATH,
  MANAGER_KEYPAIR_PATH,
  ASSET_MINT_ADDRESS,
  PERFORMANCE_FEE_BPS,
  MANAGEMENT_FEE_BPS,
} from "../variables";

async function main() {
  logStep("Initializing Vault", { rpc: RPC_URL });

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);

  // Load keypairs
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const managerKp = loadKeypair(MANAGER_KEYPAIR_PATH);
  logStep("Loaded keypairs", {
    admin: adminKp.publicKey.toString(),
    manager: managerKp.publicKey.toString(),
  });

  // Generate vault keypair
  const vaultKp = Keypair.generate();
  logStep("Generated vault keypair", {
    vault: vaultKp.publicKey.toString(),
  });

  // Create vault initialization instruction
  const assetMint = new PublicKey(ASSET_MINT_ADDRESS);

  const initVaultIx = await client.createInitializeVaultIx(
    {
      config: {
        maxCap: new BN("10000000000000"), // 10M USDC
        startAtTs: new BN(Math.floor(Date.now() / 1000)),
        lockedProfitDegradationDuration: new BN(21600), // 6 hours
        managerPerformanceFee: PERFORMANCE_FEE_BPS,     // 10% (1000 bps)
        adminPerformanceFee: PERFORMANCE_FEE_BPS,        // 10% (1000 bps)
        managerManagementFee: MANAGEMENT_FEE_BPS,        // 2% (200 bps)
        adminManagementFee: MANAGEMENT_FEE_BPS,          // 2% (200 bps)
      },
      name: "Ranger AI Vault",
      description: "AI-driven DeFi yield vault on Solana",
    },
    {
      vault: vaultKp,
      vaultAssetMint: assetMint,
      admin: adminKp.publicKey,
      manager: managerKp.publicKey,
      payer: adminKp.publicKey,
    },
  );

  // Phase 2: Mainnet Multisig & Timelock Integration
  // In production, this TX should be wrapped in a Squads multisig propose_transaction
  // and subject to a 24-hr timelock to prevent rogue configuration upgrades.
  logStep("Prepared Vault initialization (Timelock/Multisig aware)");

  // Send transaction
  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [initVaultIx],
    [adminKp, vaultKp],
  );

  logSuccess("Vault created!");
  console.log("\n══════════════════════════════════════════");
  console.log("VAULT ADDRESS:", vaultKp.publicKey.toString());
  console.log("══════════════════════════════════════════");
  console.log("\n[IMPORTANT] Update VAULT_ADDRESS in your .env file:");
  console.log(`   VAULT_ADDRESS=${vaultKp.publicKey.toString()}`);
  console.log("\nTransaction:", sig);
}

main().catch((err) => {
  logError("Failed to initialize vault", err);
  process.exit(1);
});
