// ═══════════════════════════════════════════════════════
// User Script: Direct Withdraw from Strategy
// ═══════════════════════════════════════════════════════
// Withdraws directly from a specific strategy.

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
  KAMINO_STRATEGY_ADDRESS,
  ZETA_LEND_STRATEGY_ADDRESS,
  ZETA_PERPS_STRATEGY_ADDRESS,
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

  const directWithdrawIx = await client.createUserDirectWithdrawIx(
    {
      shares: BigInt(sharesAmount),
    },
    {
      vault,
      strategy: new PublicKey(strategyAddress),
      user: userKp.publicKey,
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
