import { commands } from "@/bot/index";
import type SlashCommand from "@/bot/structures/slashCommand";
import { Logger } from "@/utils";

import fs from "fs";
import path from "path";

export const loadCommands = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        const categories = fs.readdirSync(
          path.join(__dirname, "../interactions/commands"),
        );

        for (const category of categories) {
          if (
            !fs
              .lstatSync(
                path.join(__dirname, "../interactions/commands", category),
              )
              .isDirectory()
          )
            continue;

          const files = fs.readdirSync(
            path.join(__dirname, "../interactions/commands", category),
          );

          for (const file of files) {
            const commandFile = await import(
              `@/bot/interactions/commands/${category}/${file}`
            );
            const command: SlashCommand = new commandFile.default();
            commands.set(command.name, command);
            Logger.info(
              `> Loaded command ${command.name} (${category}/${file})`,
            );
          }
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
};
