// ═══════════════════════════════════════════════════════
// Manager Script: Deposit to Strategies
// ═══════════════════════════════════════════════════════
// Allocates USDC from vault idle balance into strategies.
// Default split: 50% Kamino, 25% Zeta Lend, 25% Zeta Perps

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
  KAMINO_ALLOCATION,
  ZETA_LEND_ALLOCATION,
  ZETA_PERPS_ALLOCATION,
} from "../variables";

interface Allocation {
  name: string;
  strategyAddress: string;
  amount: number;
}

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep("Depositing to strategies");

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const managerKp = loadKeypair(MANAGER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  const allocations: Allocation[] = [
    {
      name: "Kamino Lending",
      strategyAddress: KAMINO_STRATEGY_ADDRESS,
      amount: KAMINO_ALLOCATION,
    },
    {
      name: "Zeta Lend",
      strategyAddress: ZETA_LEND_STRATEGY_ADDRESS,
      amount: ZETA_LEND_ALLOCATION,
    },
    {
      name: "Zeta Perps",
      strategyAddress: ZETA_PERPS_STRATEGY_ADDRESS,
      amount: ZETA_PERPS_ALLOCATION,
    },
  ].filter((a) => a.strategyAddress);

  for (const alloc of allocations) {
    logStep(`Depositing ${alloc.amount / 1e6} USDC to ${alloc.name}`);

    const depositIx = await client.createManagerDepositStrategyIx(
      {
        amount: BigInt(alloc.amount),
      },
      {
        vault,
        strategy: new PublicKey(alloc.strategyAddress),
        manager: managerKp.publicKey,
      },
    );

    const sig = await sendAndConfirmOptimisedTx(
      connection,
      [depositIx],
      [managerKp],
    );

    logSuccess(
      `${alloc.name}: ${alloc.amount / 1e6} USDC deposited → ${sig}`,
    );
  }

  logSuccess("All strategy deposits complete!");
}

main().catch((err) => {
  logError("Failed to deposit to strategies", err);
  process.exit(1);
});
