import logger from "@gridscout/logger";

import CronJob from "./structures/cronJob.js";

import { readdir } from "node:fs/promises";
import path from "node:path";

export const loadJobs = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        // Load all the files inside the tasks folder recursively
        const commandFiles = await readdir(path.join(__dirname, "./tasks"), {
          recursive: true,
        });

        // For each file, import it, then add it to the commands collection
        for (const file of commandFiles) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          if (file.endsWith(".d.ts")) continue;

          const jobModule = await import(`./tasks/${file}`);
          const job: CronJob = jobModule.default;

          if (job instanceof CronJob) {
            job.start();
          }

          logger.info(`Loaded job: ${job.name}`);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
};
