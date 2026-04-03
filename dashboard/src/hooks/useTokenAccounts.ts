"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface TokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  uiBalance: number;
}

export function useTokenAccounts() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [accounts, setAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey || !connected) {
      setAccounts([]);
      return;
    }

    setLoading(true);

    connection
      .getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })
      .then(({ value }) => {
        const parsed = value.map((acc) => {
          const info = acc.account.data.parsed.info;
          return {
            mint: info.mint,
            balance: Number(info.tokenAmount.amount),
            decimals: info.tokenAmount.decimals,
            uiBalance: info.tokenAmount.uiAmount ?? 0,
          };
        });
        setAccounts(parsed.filter((a) => a.balance > 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection, publicKey, connected]);

  return { accounts, loading };
}
