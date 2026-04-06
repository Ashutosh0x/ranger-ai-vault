// ═══════════════════════════════════════════════════════
// Manager Script: Rebalance Between Engines
// ═══════════════════════════════════════════════════════
// Called by keeper when signal changes.
// Moves funds between Engine A (Kamino) and Engine B (Zeta).

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
  ZETA_PERPS_STRATEGY_ADDRESS,
} from "../variables";

async function main() {
  // Parse: --kamino-pct <0-100> --zeta-pct <0-100>
  const args = process.argv.slice(2);
  const kaminoPctIdx = args.indexOf("--kamino-pct");
  const zetaPctIdx = args.indexOf("--zeta-pct");

  let kaminoPct = 50;
  let zetaPct = 50;

  if (kaminoPctIdx !== -1) kaminoPct = parseInt(args[kaminoPctIdx + 1]);
  if (zetaPctIdx !== -1) zetaPct = parseInt(args[zetaPctIdx + 1]);

  if (kaminoPct + zetaPct !== 100) {
    logError("Kamino + Zeta percentages must sum to 100");
    process.exit(1);
  }

  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep(`Rebalancing: Kamino=${kaminoPct}%, Zeta=${zetaPct}%`);

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const managerKp = loadKeypair(MANAGER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);

  // Fetch current vault state
  const vaultState = await client.fetchVaultAccount(vault);
  const totalAssets = Number(vaultState.totalAssets);

  logStep("Current vault state", {
    totalAssets: totalAssets / 1e6,
    targetKamino: (totalAssets * kaminoPct) / 100 / 1e6,
    targetZeta: (totalAssets * zetaPct) / 100 / 1e6,
  });

  const targetKamino = Math.floor((totalAssets * kaminoPct) / 100);
  const targetZeta = Math.floor((totalAssets * zetaPct) / 100);

  // Step 1: Withdraw everything from both strategies
  if (KAMINO_STRATEGY_ADDRESS) {
    try {
      const withdrawKaminoIx = await client.createManagerWithdrawStrategyIx(
        { amount: BigInt(totalAssets) }, // Withdraw max
        {
          vault,
          strategy: new PublicKey(KAMINO_STRATEGY_ADDRESS),
          manager: managerKp.publicKey,
        },
      );
      await sendAndConfirmOptimisedTx(connection, [withdrawKaminoIx], [managerKp]);
      logStep("Withdrew from Kamino");
    } catch (err: any) {
      logStep("Kamino withdraw skipped (may be empty)");
    }
  }

  if (ZETA_PERPS_STRATEGY_ADDRESS) {
    try {
      const withdrawZetaIx = await client.createManagerWithdrawStrategyIx(
        { amount: BigInt(totalAssets) },
        {
          vault,
          strategy: new PublicKey(ZETA_PERPS_STRATEGY_ADDRESS),
          manager: managerKp.publicKey,
        },
      );
      await sendAndConfirmOptimisedTx(connection, [withdrawZetaIx], [managerKp]);
      logStep("Withdrew from Zeta");
    } catch (err: any) {
      logStep("Zeta withdraw skipped (may be empty)");
    }
  }

  // Step 2: Re-deposit at new allocations
  if (KAMINO_STRATEGY_ADDRESS && targetKamino > 0) {
    const depositKaminoIx = await client.createManagerDepositStrategyIx(
      { amount: BigInt(targetKamino) },
      {
        vault,
        strategy: new PublicKey(KAMINO_STRATEGY_ADDRESS),
        manager: managerKp.publicKey,
      },
    );
    await sendAndConfirmOptimisedTx(connection, [depositKaminoIx], [managerKp]);
    logStep(`Deposited ${targetKamino / 1e6} USDC to Kamino`);
  }

  if (ZETA_PERPS_STRATEGY_ADDRESS && targetZeta > 0) {
    const depositZetaIx = await client.createManagerDepositStrategyIx(
      { amount: BigInt(targetZeta) },
      {
        vault,
        strategy: new PublicKey(ZETA_PERPS_STRATEGY_ADDRESS),
        manager: managerKp.publicKey,
      },
    );
    await sendAndConfirmOptimisedTx(connection, [depositZetaIx], [managerKp]);
    logStep(`Deposited ${targetZeta / 1e6} USDC to Zeta`);
  }

  logSuccess(`Rebalanced: Kamino=${kaminoPct}% (${targetKamino / 1e6} USDC), Zeta=${zetaPct}% (${targetZeta / 1e6} USDC)`);
}

main().catch((err) => {
  logError("Failed to rebalance", err);
  process.exit(1);
});
