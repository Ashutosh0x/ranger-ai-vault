// hooks/useApiKeys.ts
"use client";

import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getAllApiKeys,
  createApiKey as storeCreate,
  updateApiKey as storeUpdate,
  rotateApiKey as storeRotate,
  deleteApiKey as storeDelete,
  getKeyHistory as storeHistory,
} from "@/lib/api-key-store";
import type {
  ApiKeyDisplay,
  CreateApiKeyPayload,
  UpdateApiKeyPayload,
  RotateApiKeyPayload,
  ApiKeyHistoryEntry,
} from "@/types/settings";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  const refresh = useCallback(() => {
    try {
      setKeys(getAllApiKeys());
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createKey = useCallback(
    async (payload: CreateApiKeyPayload): Promise<ApiKeyDisplay> => {
      const key = storeCreate(payload, walletAddress);
      refresh();
      return key;
    },
    [walletAddress, refresh]
  );

  const updateKey = useCallback(
    async (id: string, payload: UpdateApiKeyPayload): Promise<ApiKeyDisplay> => {
      const key = storeUpdate(id, payload, walletAddress);
      refresh();
      return key;
    },
    [walletAddress, refresh]
  );

  const rotateKey = useCallback(
    async (id: string, payload: RotateApiKeyPayload): Promise<ApiKeyDisplay> => {
      const key = storeRotate(id, payload, walletAddress);
      refresh();
      return key;
    },
    [walletAddress, refresh]
  );

  const deleteKey = useCallback(
    async (id: string): Promise<void> => {
      storeDelete(id, walletAddress);
      refresh();
    },
    [walletAddress, refresh]
  );

  const getHistory = useCallback(
    async (id: string): Promise<ApiKeyHistoryEntry[]> => {
      return storeHistory(id);
    },
    []
  );

  return {
    keys,
    isLoading,
    error,
    createKey,
    updateKey,
    rotateKey,
    deleteKey,
    getHistory,
    refresh,
  };
}
