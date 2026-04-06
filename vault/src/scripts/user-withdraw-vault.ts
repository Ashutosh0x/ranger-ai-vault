// ═══════════════════════════════════════════════════════
// User Script: Withdraw from Vault
// ═══════════════════════════════════════════════════════
// User burns LP tokens → receives USDC

import { Connection, PublicKey } from "@solana/web3.js";
import { VoltrClient } from "@voltr/vault-sdk";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import {
  loadKeypair,
  sendAndConfirmOptimisedTx,
  logStep,
  logSuccess,
  logError,
} from "../helper";
import { RPC_URL, USER_KEYPAIR_PATH, VAULT_ADDRESS, ASSET_MINT_ADDRESS } from "../variables";

async function main() {
  if (!VAULT_ADDRESS) {
    logError("VAULT_ADDRESS not set.");
    process.exit(1);
  }

  // Parse: --shares <amount> (LP tokens to burn)
  const args = process.argv.slice(2);
  const sharesIdx = args.indexOf("--shares");

  if (sharesIdx === -1) {
    console.log("Usage: ts-node user-withdraw-vault.ts --shares <lp_token_amount>");
    process.exit(1);
  }

  const sharesAmount = Math.floor(parseFloat(args[sharesIdx + 1]) * 1e6);

  logStep(`Withdrawing ${sharesAmount / 1e6} LP tokens from vault`);

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new VoltrClient(connection);
  const userKp = loadKeypair(USER_KEYPAIR_PATH);
  const vault = new PublicKey(VAULT_ADDRESS);
  const vaultAssetMint = new PublicKey(ASSET_MINT_ADDRESS);

  // Fetch vault state to estimate USDC output
  const vaultState = await client.fetchVaultAccount(vault);
  const totalAssets = Number((vaultState as Record<string, any>).asset?.totalValue ?? 0);

  // Get LP supply from the LP mint
  const lpMint = client.findVaultLpMint(vault);
  const lpMintInfo = await getMint(connection, lpMint);
  const totalShares = Number(lpMintInfo.supply);

  const navPerShare = totalShares > 0 ? totalAssets / totalShares : 1;
  const estimatedUsdc = (sharesAmount * navPerShare) / 1e6;

  logStep("Estimated withdrawal", {
    lpTokens: sharesAmount / 1e6,
    navPerShare: navPerShare.toFixed(6),
    estimatedUsdc: estimatedUsdc.toFixed(2),
  });

  const withdrawIx = await client.createWithdrawVaultIx(
    {
      amount: new BN(sharesAmount),
      isAmountInLp: true,
      isWithdrawAll: false,
    },
    {
      userAuthority: userKp.publicKey,
      vault,
      vaultAssetMint,
      assetTokenProgram: TOKEN_PROGRAM_ID,
    },
  );

  const sig = await sendAndConfirmOptimisedTx(
    connection,
    [withdrawIx],
    [userKp],
  );

  logSuccess(`Withdrew ~${estimatedUsdc.toFixed(2)} USDC`);
  console.log(`   LP tokens burned: ${sharesAmount / 1e6}`);
  console.log(`   TX: ${sig}`);
}

main().catch((err) => {
  logError("Failed to withdraw", err);
  process.exit(1);
});
