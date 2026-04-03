"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { USDC_MINT, USDC_DECIMALS } from "@/lib/voltr-client";

interface WalletBalance {
  sol: number;
  usdc: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWalletBalance(): WalletBalance {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [sol, setSol] = useState(0);
  const [usdc, setUsdc] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSol(0);
      setUsdc(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const solBalance = await connection.getBalance(publicKey);
      setSol(solBalance / LAMPORTS_PER_SOL);

      try {
        const usdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        const tokenAccount = await getAccount(connection, usdcAta);
        setUsdc(Number(tokenAccount.amount) / 10 ** USDC_DECIMALS);
      } catch (e) {
        if (e instanceof TokenAccountNotFoundError) {
          setUsdc(0);
        } else {
          throw e;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  useEffect(() => {
    fetchBalances();

    if (!publicKey) return;

    const subId = connection.onAccountChange(publicKey, () => {
      fetchBalances();
    });

    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [fetchBalances, publicKey, connection]);

  return { sol, usdc, loading, error, refresh: fetchBalances };
}
