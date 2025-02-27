import { JobScannerService } from "../lib/services/JobScannerService";
import { logger } from "../lib/utils/logger";

async function main() {
  try {
    const scanner = new JobScannerService();

    // Handle graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM signal. Shutting down...");
      await scanner.stop();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT signal. Shutting down...");
      await scanner.stop();
      process.exit(0);
    });

    // Start the scanner
    logger.info("Starting job scanner service...");
    await scanner.start();
    logger.info("Job scanner service started successfully");
  } catch (error) {
    logger.error("Error starting job scanner service:", error);
    process.exit(1);
  }
}

main();
