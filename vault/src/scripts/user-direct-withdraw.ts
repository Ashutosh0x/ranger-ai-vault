// ═══════════════════════════════════════════════════════
// User Script: Direct Withdraw from Strategy
// ═══════════════════════════════════════════════════════
// Withdraws directly from a specific strategy.

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  KAMINO_STRATEGY_ADDRESS,
  ZETA_LEND_STRATEGY_ADDRESS,
  ZETA_PERPS_STRATEGY_ADDRESS,
  ASSET_MINT_ADDRESS,
} from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const stratIdx = args.indexOf("--strategy");
  const sharesIdx = args.indexOf("--shares");

  if (stratIdx === -1 || sharesIdx === -1) {
    console.log("Usage: ts-node user-direct-withdraw.ts --strategy <kamino|zeta-lend|zeta-perps> --shares <amount>");
    process.exit(1);
  }

  const strategyName = args[stratIdx + 1];
  const sharesAmount = Math.floor(parseFloat(args[sharesIdx + 1]) * 1e6);

  const strategyMap: Record<string, string> = {
    "kamino": KAMINO_STRATEGY_ADDRESS,
    "zeta-lend": ZETA_LEND_STRATEGY_ADDRESS,
    "zeta-perps": ZETA_PERPS_STRATEGY_ADDRESS,
  };

  const strategyAddress = strategyMap[strategyName];
  if (!strategyAddress) {
    logError(`Unknown strategy: ${strategyName}`);
    process.exit(1);
  }

  logStep(`Direct withdraw ${sharesAmount / 1e6} shares from ${strategyName}`);

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const userKp = loadKeypair(USER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);
  const vaultAssetMint = new PublicKey(ASSET_MINT_ADDRESS);

  const directWithdrawIx = await client.createDirectWithdrawStrategyIx(
    {
      amount: new BN(sharesAmount),
      isAmountInLp: true,
      isWithdrawAll: false,
    },
    {
      user: userKp.publicKey,
      vault,
      strategy: new PublicKey(strategyAddress),
      vaultAssetMint,
      assetTokenProgram: TOKEN_PROGRAM_ID,
      remainingAccounts: [],
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [directWithdrawIx],
    [userKp],
  );

  logSuccess(`Direct withdraw from ${strategyName}: ${sig}`);
}

main().catch((err) => {
  logError("Failed to direct withdraw", err);
  process.exit(1);
});
