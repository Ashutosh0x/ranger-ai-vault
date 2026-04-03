// hooks/useConnectionTest.ts
"use client";

import { useState, useCallback } from "react";
import { testConnection } from "@/lib/api-key-store";
import type { ApiService } from "@/types/settings";

interface TestResult {
  success: boolean;
  latencyMs: number;
  message: string;
}

export function useConnectionTest() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testService = useCallback(
    async (service: ApiService): Promise<TestResult> => {
      setTesting((prev) => ({ ...prev, [service]: true }));

      try {
        const result = await testConnection(service);
        setResults((prev) => ({ ...prev, [service]: result }));
        return result;
      } catch (err: any) {
        const result: TestResult = {
          success: false,
          latencyMs: 0,
          message: err.message || "Test failed",
        };
        setResults((prev) => ({ ...prev, [service]: result }));
        return result;
      } finally {
        setTesting((prev) => ({ ...prev, [service]: false }));
      }
    },
    []
  );

  const testAll = useCallback(
    async (services: ApiService[]) => {
      await Promise.allSettled(services.map((s) => testService(s)));
    },
    [testService]
  );

  return { results, testing, testService, testAll };
}
