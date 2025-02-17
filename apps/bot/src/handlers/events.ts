import { client } from "@/bot/index";
import type Event from "@/bot/structures/event";
import { Logger } from "@/utils";

import fs from "fs";
import path from "path";

export const loadEvents = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        const events = fs.readdirSync(path.join(__dirname, "../events"));

        for (const eventFile of events) {
          if (
            !fs.lstatSync(path.join(__dirname, "../events", eventFile)).isFile()
          )
            continue;

          const eventModule = await import(`@/bot/events/${eventFile}`);
          const event: Event = new eventModule.default();

          event.register(client);
          Logger.info(`> Loaded event ${event.name}`);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
};
