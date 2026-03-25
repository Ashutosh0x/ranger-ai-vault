// Mock Voltr SDK for unit tests

import { PublicKey } from "@solana/web3.js";

export class VoltrClient {
  constructor(_connection: any) {}

  async fetchVaultAccount(_vault: PublicKey) {
    return {
      totalAssets: BigInt(100_000_000_000),
      totalShares: BigInt(100_000_000_000),
      idleAssets: BigInt(5_000_000_000),
    };
  }

  async fetchStrategyAccount(_strategy: PublicKey) {
    return {
      currentAssets: BigInt(45_000_000_000),
    };
  }

  async createRefreshReceiptIx(params: any) {
    return { programId: PublicKey.default, keys: [], data: Buffer.from([]) };
  }

  async createManagerDepositStrategyIx(params: any) {
    return { programId: PublicKey.default, keys: [], data: Buffer.from([]) };
  }

  async createManagerWithdrawStrategyIx(params: any) {
    return { programId: PublicKey.default, keys: [], data: Buffer.from([]) };
  }
}
