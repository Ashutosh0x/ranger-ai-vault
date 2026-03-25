// ═══════════════════════════════════════════════════════
// Signal Client — HTTP client to Python signal server
// ═══════════════════════════════════════════════════════

import axios, { AxiosInstance } from "axios";
import { EXECUTION_PARAMS } from "../config";
import { SignalResponse, RiskResponse } from "../types";

export class SignalClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: EXECUTION_PARAMS.signalServerUrl,
      timeout: 10_000,
      headers: {
        "X-Keeper-Secret": EXECUTION_PARAMS.keeperSecret,
      },
    });
  }

  async getSignal(asset: string): Promise<SignalResponse> {
    const { data } = await this.client.get<SignalResponse>("/signal", {
      params: { asset },
    });
    return data;
  }

  async getAllSignals(): Promise<Record<string, any>> {
    const { data } = await this.client.get("/signals/all");
    return data;
  }

  async getRisk(): Promise<RiskResponse> {
    const { data } = await this.client.get<RiskResponse>("/risk");
    return data;
  }

  async updateNav(nav: number): Promise<void> {
    await this.client.post("/risk/update-nav", null, {
      params: { nav },
    });
  }

  async updateDelta(asset: string, delta: number): Promise<void> {
    await this.client.post("/risk/update-delta", null, {
      params: { asset, delta },
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      const { data } = await this.client.get("/health");
      return data?.status === "ok";
    } catch {
      return false;
    }
  }
}
