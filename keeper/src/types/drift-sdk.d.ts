// =================================================================
// Custom type declarations for @drift-labs/sdk
// DriftExecutor is a STUB — these types enable compilation without
// requiring the full Drift SDK type surface.
// =================================================================

declare module "@drift-labs/sdk" {
  import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

  export class Wallet {
    constructor(keypair: Keypair);
    publicKey: PublicKey;
    signTransaction(tx: Transaction): Promise<Transaction>;
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  }

  export class BulkAccountLoader {
    constructor(connection: Connection, commitment: string, pollingFrequency: number);
  }

  export class BaseTxSender {}

  export interface DriftClientConfig {
    connection: Connection;
    wallet: Wallet;
    accountSubscription: {
      type: string;
      accountLoader: BulkAccountLoader;
    };
    env: "devnet" | "mainnet-beta";
  }

  export class DriftClient {
    constructor(config: DriftClientConfig);
    subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
  }
}
