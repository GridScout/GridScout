import logger from "@gridscout/logger";

import cron from "node-cron";

export type CronJobOptions = {
  schedule: string; // Cron schedule string (format: "* * * * *")
  runOnStart?: boolean; // Option to run immediately on startup
};

export default class CronJob {
  name: string;
  task: () => void;
  options: CronJobOptions;

  constructor(name: string, options: CronJobOptions, task: () => void) {
    this.name = name;
    this.options = options;
    this.task = task;
  }

  start() {
    logger.info(`Starting cron job: ${this.name} (${this.options.schedule})`);

    // Schedule the job
    cron.schedule(this.options.schedule, this.task);

    // Run immediately if enabled
    if (this.options.runOnStart) {
      logger.info(`Executing ${this.name} immediately`);
      this.task();
    }
  }
}
