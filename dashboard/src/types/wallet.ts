export type WalletConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export type TransactionState =
  | "idle"
  | "building"
  | "signing"
  | "sending"
  | "confirming"
  | "confirmed"
  | "failed";

export interface VaultDepositParams {
  amount: number;
  vault: string;
}

export interface VaultWithdrawParams {
  amount: number;
  vault: string;
  directWithdraw?: boolean;
}

export interface WalletBalances {
  sol: number;
  usdc: number;
  lpTokens: number;
  vaultValue: number;
}
