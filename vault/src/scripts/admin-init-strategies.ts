// ═══════════════════════════════════════════════════════
// Admin Script: Initialize Strategies
// ═══════════════════════════════════════════════════════
// Initializes 3 strategies in the vault:
// 1. Kamino Lending (USDC floor yield)
// 2. Zeta Lend (fallback yield)
// 3. Zeta Perps (active trading engine)

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import {
  loadKeypair,
  sendAndConfirmOptimisedTx,
  logStep,
  logSuccess,
  logError,
} from "../helper";
import { RPC_URL, ADMIN_KEYPAIR_PATH, VAULT_ADDRESS, MANAGER_KEYPAIR_PATH } from "../variables";
import {
  ZETA_ADAPTOR_PROGRAM_ID,
  KAMINO_ADAPTOR_PROGRAM_ID,
  KAMINO_LENDING_PROGRAM_ID,
  KAMINO_MAIN_MARKET,
  KAMINO_USDC_RESERVE,
  ZETA_PROGRAM_ID,
  ZETA_STATE,
  USDC_MINT,
} from "../constants";

interface StrategyInit {
  name: string;
  adaptorProgram: PublicKey;
  remainingAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
}

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set. Run admin-init-vault.ts first.");
    process.exit(1);
  }

  logStep("Initializing strategies", { vault: VAULT_ADDRESS });

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const managerKp = loadKeypair(MANAGER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // Define strategies
  const strategies: StrategyInit[] = [
    {
      name: "Kamino Lending (USDC floor yield)",
      adaptorProgram: KAMINO_ADAPTOR_PROGRAM_ID,
      remainingAccounts: [
        { pubkey: KAMINO_LENDING_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: KAMINO_MAIN_MARKET, isSigner: false, isWritable: true },
        { pubkey: KAMINO_USDC_RESERVE, isSigner: false, isWritable: true },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      ],
    },
    {
      name: "Zeta Lend (fallback yield)",
      adaptorProgram: ZETA_ADAPTOR_PROGRAM_ID,
      remainingAccounts: [
        { pubkey: ZETA_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ZETA_STATE, isSigner: false, isWritable: true },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      ],
    },
    {
      name: "Zeta Perps (active trading engine)",
      adaptorProgram: ZETA_ADAPTOR_PROGRAM_ID,
      remainingAccounts: [
        { pubkey: ZETA_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ZETA_STATE, isSigner: false, isWritable: true },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      ],
    },
  ];

  const strategyAddresses: string[] = [];

  for (const strategyDef of strategies) {
    logStep(`Initializing: ${strategyDef.name}`, {
      adaptor: strategyDef.adaptorProgram.toString(),
    });

    const strategyKp = Keypair.generate();

    const initStrategyIx = await client.createInitializeStrategyIx(
      {
        // Instruction discriminator depends on adaptor type
        instructionDiscriminator: Buffer.alloc(8),
      },
      {
        payer: adminKp.publicKey,
        vault,
        manager: managerKp.publicKey,
        strategy: strategyKp.publicKey,
        adaptorProgram: strategyDef.adaptorProgram,
        remainingAccounts: strategyDef.remainingAccounts,
      },
    );

    const sig = await sendAndConfirmOptimisedTx(
      connection,
      [initStrategyIx],
      [adminKp, strategyKp],
    );

    strategyAddresses.push(strategyKp.publicKey.toString());
    logSuccess(`${strategyDef.name} initialized: ${strategyKp.publicKey.toString()}`);
    console.log(`   TX: ${sig}`);
  }

  console.log("\n══════════════════════════════════════════");
  console.log("STRATEGY ADDRESSES (update .env):");
  console.log(`   KAMINO_STRATEGY_ADDRESS=${strategyAddresses[0]}`);
  console.log(`   ZETA_LEND_STRATEGY_ADDRESS=${strategyAddresses[1]}`);
  console.log(`   ZETA_PERPS_STRATEGY_ADDRESS=${strategyAddresses[2]}`);
  console.log("══════════════════════════════════════════");
}

main().catch((err) => {
  logError("Failed to initialize strategies", err);
  process.exit(1);
});
