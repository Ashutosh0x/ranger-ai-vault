// ═══════════════════════════════════════════════════════
// User Script: Deposit USDC into Vault
// ═══════════════════════════════════════════════════════
// User deposits USDC → receives LP tokens

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
  USER_KEYPAIR_PATH,
  VAULT_ADDRESS,
  DEPOSIT_AMOUNT,
} from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  // Parse optional --amount flag
  const args = process.argv.slice(2);
  const amountIdx = args.indexOf("--amount");
  const amountRaw = amountIdx !== -1
    ? Math.floor(parseFloat(args[amountIdx + 1]) * 1e6)
    : DEPOSIT_AMOUNT;

  logStep(`Depositing ${amountRaw / 1e6} USDC into vault`);

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const userKp = loadKeypair(USER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // Fetch vault state to show current NAV
  const vaultState = await client.fetchVaultAccount(vault);
  const currentShares = Number(vaultState.totalShares);
  const currentAssets = Number(vaultState.totalAssets);
  const navPerShare = currentShares > 0 ? currentAssets / currentShares : 1;

  logStep("Vault state before deposit", {
    totalAssets: currentAssets / 1e6,
    totalShares: currentShares / 1e6,
    navPerShare: navPerShare.toFixed(6),
  });

  const depositIx = await client.createUserDepositIx(
    {
      amount: BigInt(amountRaw),
    },
    {
      vault,
      user: userKp.publicKey,
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [depositIx],
    [userKp],
  );

  // Calculate estimated LP tokens received
  const estimatedShares = navPerShare > 0 ? amountRaw / navPerShare : amountRaw;

  logSuccess(`Deposited ${amountRaw / 1e6} USDC`);
  console.log(`   Estimated LP tokens: ${(estimatedShares / 1e6).toFixed(6)}`);
  console.log(`   TX: ${sig}`);
}

main().catch((err) => {
  logError("Failed to deposit", err);
  process.exit(1);
});
