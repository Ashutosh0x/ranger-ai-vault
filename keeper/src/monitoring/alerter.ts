// =================================================================
// Alerter -- Telegram alerts on critical events
// =================================================================

import { logger } from "./logger";

export class Alerter {
  private telegramBotToken: string | null;
  private telegramChatId: string | null;
  private enabled: boolean;

  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || null;
    this.enabled = !!(this.telegramBotToken && this.telegramChatId);

    if (this.enabled) {
      logger.info("Telegram alerts enabled");
    } else {
      logger.warn("Telegram alerts disabled -- set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    }
  }

  async send(message: string): Promise<void> {
    logger.info(`[ALERT] ${message}`);
    if (!this.enabled) return;

    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    } catch (err: any) {
      logger.error(`Telegram alert failed: ${err.message}`);
    }
  }

  async sendCritical(message: string): Promise<void> {
    await this.send(`*CRITICAL*\n${message}`);
  }

  async sendWarning(message: string): Promise<void> {
    await this.send(`*WARNING*\n${message}`);
  }

  async sendInfo(message: string): Promise<void> {
    await this.send(message);
  }

  async sendTradeAlert(asset: string, direction: string, sizeUsd: number, reason: string): Promise<void> {
    await this.send(
      `*Trade Executed*\nAsset: ${asset}\nDirection: ${direction}\nSize: $${sizeUsd.toFixed(2)}\nReason: ${reason}`,
    );
  }
}
