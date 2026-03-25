// ═══════════════════════════════════════════════════════
// Keeper Entry Point
// ═══════════════════════════════════════════════════════

import { CronJob } from "cron";
import { KeeperLoop } from "./core/keeper-loop";
import { EXECUTION_PARAMS } from "./config";
import { logger } from "./monitoring/logger";

async function main() {
  logger.info("═══════════════════════════════════════════");
  logger.info("🤖 RANGER AI VAULT — KEEPER BOT");
  logger.info("═══════════════════════════════════════════");
  logger.info(`Signal server: ${EXECUTION_PARAMS.signalServerUrl}`);
  logger.info(`Cron interval: ${EXECUTION_PARAMS.cronInterval}`);
  logger.info(`Assets: ${EXECUTION_PARAMS.assets.join(", ")}`);
  logger.info(`Floor allocation: ${EXECUTION_PARAMS.floorAllocationPct * 100}%`);
  logger.info(`Active allocation: ${EXECUTION_PARAMS.activeAllocationPct * 100}%`);

  const keeper = new KeeperLoop();

  // Run initial tick
  logger.info("Running initial tick...");
  await keeper.tick();

  // Setup cron job
  const job = new CronJob(
    EXECUTION_PARAMS.cronInterval,
    async () => {
      try {
        await keeper.tick();
      } catch (err: any) {
        logger.error(`Cron tick error: ${err.message}`);
      }
    },
    null,
    true,
    "UTC",
  );

  logger.info("✅ Keeper started — running every 15 minutes");

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Shutting down keeper...");
    job.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Shutting down keeper...");
    job.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
