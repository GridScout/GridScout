import logger from "@gridscout/logger";

import { client } from "../index.js";
import Event from "../structures/event.js";

import path from "node:path";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadEvents = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        // Load all the files inside the event folder recursively
        const eventFiles = await readdir(path.join(__dirname, "../events"), {
          recursive: true,
        });

        // For each file, import it
        for (const file of eventFiles) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          if (file.endsWith(".d.ts")) continue;

          const eventFile = await import(`../events/${file}`);
          const event: Event = new eventFile.default();

          event.register(client);

          logger.info(`Loaded event ${event.name} (${file})`);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
};
