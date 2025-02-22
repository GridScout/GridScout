import logger from "@gridscout/logger";
import env from "@gridscout/env";

import { commands, start } from "../index.js";
import Event from "../structures/event.js";

import {
  ActivityType,
  Routes,
  SlashCommandBuilder,
  type Client,
} from "discord.js";

export default class ReadyEvent extends Event {
  constructor() {
    super("BotReady", "ready", true);
  }

  async execute(client: Client) {
    logger.info(
      `${client.user?.tag} logged into Discord in ${Date.now() - start}ms`,
    );

    client.user?.setActivity("the next Grand Prix 🏆", {
      type: ActivityType.Watching,
    });

    if (!client.user) return;

    const startupArgs = process.argv;

    if (startupArgs.includes("--deploy")) {
      logger.debug(
        `Deploying slash commands to Discord ${env.DOPPLER_ENVIRONMENT === "dev" ? "locally" : "globally"}`,
      );
      const commandData: any[] = [];

      await Promise.all(
        commands.map(async (command) => {
          commandData.push(
            await command.build(
              new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.description),
            ),
          );
        }),
      );

      if (env.DOPPLER_ENVIRONMENT === "dev") {
        const devGuild = client.guilds.cache.get(env.DEV_SERVER_ID);
        if (!devGuild) {
          logger.error(`Could not find guild with ID ${env.DEV_SERVER_ID}`);
          return;
        }
        // const existingCommands = await devGuild.commands.fetch();
        try {
          await client.rest.put(
            Routes.applicationGuildCommands(client.user.id, devGuild.id),
            { body: commandData },
          );
          logger.debug(`Deployed all local slash commands`);
        } catch (error) {
          logger.error(String(error));
        }
      }
    }
  }
}
