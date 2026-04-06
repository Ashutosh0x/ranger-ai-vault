// ═══════════════════════════════════════════════════════
// Manager Script: Withdraw from Strategies
// ═══════════════════════════════════════════════════════
// Pulls funds back from strategies into vault idle balance.

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
  MANAGER_KEYPAIR_PATH,
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

  // Parse command-line: --strategy <name> --amount <usdc>
  const args = process.argv.slice(2);
  const strategyNameIdx = args.indexOf("--strategy");
  const amountIdx = args.indexOf("--amount");

  if (strategyNameIdx === -1 || amountIdx === -1) {
    console.log("Usage: ts-node manager-withdraw-strategies.ts --strategy <kamino|zeta-lend|zeta-perps> --amount <usdc>");
    process.exit(1);
  }

  const strategyName = args[strategyNameIdx + 1];
  const amountUsdc = parseFloat(args[amountIdx + 1]);
  const amountRaw = Math.floor(amountUsdc * 1e6);

  const strategyMap: Record<string, string> = {
    "kamino": KAMINO_STRATEGY_ADDRESS,
    "zeta-lend": ZETA_LEND_STRATEGY_ADDRESS,
    "zeta-perps": ZETA_PERPS_STRATEGY_ADDRESS,
  };

  const strategyAddress = strategyMap[strategyName];
  if (!strategyAddress) {
    logError(`Unknown strategy: ${strategyName}. Use kamino, zeta-lend, or zeta-perps.`);
    process.exit(1);
  }

  logStep(`Withdrawing ${amountUsdc} USDC from ${strategyName}`);

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const managerKp = loadKeypair(MANAGER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  const withdrawIx = await client.createManagerWithdrawStrategyIx(
    {
      amount: BigInt(amountRaw),
    },
    {
      vault,
      strategy: new PublicKey(strategyAddress),
      manager: managerKp.publicKey,
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [withdrawIx],
    [managerKp],
  );

  logSuccess(`Withdrew ${amountUsdc} USDC from ${strategyName}: ${sig}`);
}

main().catch((err) => {
  logError("Failed to withdraw from strategy", err);
  process.exit(1);
});
