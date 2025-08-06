import logger from "@gridscout/logger";

import { commands } from "../index.js";
import SlashCommand from "../structures/slashCommand.js";

import { readdir } from "node:fs/promises";
import path from "node:path";

export const loadCommands = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        // Load all the files inside the commands folder recursively
        const commandFiles = await readdir(
          path.join(__dirname, "../interactions/commands"),
          { recursive: true },
        );

        // For each file, import it, then add it to the commands collection
        for (const file of commandFiles) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          if (file.endsWith(".d.ts")) continue;

          const commandFile = await import(`../interactions/commands/${file}`);
          const command: SlashCommand = new commandFile.default();

          commands.set(command.name, command);

          logger.info(`Loaded command ${command.name} (${file})`);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
};
