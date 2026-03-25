// ═══════════════════════════════════════════════════════
// Manager Script: Rebalance Between Engines
// ═══════════════════════════════════════════════════════
// Called by keeper when signal changes.
// Moves funds between Engine A (Kamino) and Engine B (Drift).

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
  DRIFT_PERPS_STRATEGY_ADDRESS,
} from "../variables";

async function main() {
  // Parse: --kamino-pct <0-100> --drift-pct <0-100>
  const args = process.argv.slice(2);
  const kaminoPctIdx = args.indexOf("--kamino-pct");
  const driftPctIdx = args.indexOf("--drift-pct");

  let kaminoPct = 50;
  let driftPct = 50;

  if (kaminoPctIdx !== -1) kaminoPct = parseInt(args[kaminoPctIdx + 1]);
  if (driftPctIdx !== -1) driftPct = parseInt(args[driftPctIdx + 1]);

  if (kaminoPct + driftPct !== 100) {
    logError("Kamino + Drift percentages must sum to 100");
    process.exit(1);
  }

  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  logStep(`Rebalancing: Kamino=${kaminoPct}%, Drift=${driftPct}%`);

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
    targetDrift: (totalAssets * driftPct) / 100 / 1e6,
  });

  const targetKamino = Math.floor((totalAssets * kaminoPct) / 100);
  const targetDrift = Math.floor((totalAssets * driftPct) / 100);

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

  if (DRIFT_PERPS_STRATEGY_ADDRESS) {
    try {
      const withdrawDriftIx = await client.createManagerWithdrawStrategyIx(
        { amount: BigInt(totalAssets) },
        {
          vault,
          strategy: new PublicKey(DRIFT_PERPS_STRATEGY_ADDRESS),
          manager: managerKp.publicKey,
        },
      );
      await sendAndConfirmOptimisedTx(connection, [withdrawDriftIx], [managerKp]);
      logStep("Withdrew from Drift");
    } catch (err: any) {
      logStep("Drift withdraw skipped (may be empty)");
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

  if (DRIFT_PERPS_STRATEGY_ADDRESS && targetDrift > 0) {
    const depositDriftIx = await client.createManagerDepositStrategyIx(
      { amount: BigInt(targetDrift) },
      {
        vault,
        strategy: new PublicKey(DRIFT_PERPS_STRATEGY_ADDRESS),
        manager: managerKp.publicKey,
      },
    );
    await sendAndConfirmOptimisedTx(connection, [depositDriftIx], [managerKp]);
    logStep(`Deposited ${targetDrift / 1e6} USDC to Drift`);
  }

  logSuccess(`Rebalanced: Kamino=${kaminoPct}% (${targetKamino / 1e6} USDC), Drift=${driftPct}% (${targetDrift / 1e6} USDC)`);
}

main().catch((err) => {
  logError("Failed to rebalance", err);
  process.exit(1);
});
