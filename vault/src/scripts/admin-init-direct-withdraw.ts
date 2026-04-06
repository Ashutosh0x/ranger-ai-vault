// ═══════════════════════════════════════════════════════
// Admin Script: Initialize Direct Withdraw
// ═══════════════════════════════════════════════════════
// Enables direct withdrawal for each strategy.

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
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
  VAULT_ADDRESS,
  KAMINO_STRATEGY_ADDRESS,
  ZETA_LEND_STRATEGY_ADDRESS,
  ZETA_PERPS_STRATEGY_ADDRESS,
} from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep("Initializing direct withdraw for strategies");

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const adminKp = loadKeypair(ADMIN_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  const strategyAddresses = [
    { name: "Kamino Lending", address: KAMINO_STRATEGY_ADDRESS },
    { name: "Zeta Lend", address: ZETA_LEND_STRATEGY_ADDRESS },
    { name: "Zeta Perps", address: ZETA_PERPS_STRATEGY_ADDRESS },
  ].filter((s) => s.address);

  for (const strategy of strategyAddresses) {
    logStep(`Enabling direct withdraw: ${strategy.name}`);

    const initDirectWithdrawIx = await client.createInitDirectWithdrawIx({
      vault,
      strategy: new PublicKey(strategy.address),
      admin: adminKp.publicKey,
    });

    const sig = await sendAndConfirmOptimisedTx(
      connection,
      [initDirectWithdrawIx],
      [adminKp],
    );

    logSuccess(`${strategy.name} direct withdraw enabled: ${sig}`);
  }

  logSuccess("All direct withdrawals initialized!");
}

main().catch((err) => {
  logError("Failed to init direct withdraw", err);
  process.exit(1);
});
