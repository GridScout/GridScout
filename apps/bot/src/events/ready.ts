import { start, commands } from "@/bot/index";
import { config } from "@/config";
import { Logger } from "@/utils";
import Event from "@/bot/structures/event";

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

  override async execute(client: Client) {
    Logger.info(
      `${client.user?.tag} logged into Discord in ${Date.now() - start}ms`,
    );

    client.user?.setActivity("the next Grand Prix 🏆", {
      type: ActivityType.Watching,
    });

    if (!client.user) return;

    const startupArgs = process.argv;

    if (startupArgs.includes("--deploy")) {
      Logger.debug(
        `Deploying slash commands to Discord ${config.DOPPLER_ENVIRONMENT === "dev" ? "locally" : "globally"}`,
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

      console.log(commandData);

      if (config.DOPPLER_ENVIRONMENT === "dev") {
        const devGuild = client.guilds.cache.get(config.DEV_SERVER_ID);
        if (!devGuild) {
          Logger.error(`Could not find guild with ID ${config.DEV_SERVER_ID}`);
          return;
        }
        // const existingCommands = await devGuild.commands.fetch();
        try {
          await client.rest.put(
            Routes.applicationGuildCommands(client.user.id, devGuild.id),
            { body: commandData },
          );
          Logger.debug(`Deployed all local slash commands`);
        } catch (error) {
          Logger.error(String(error));
        }
      }

      // TODO: Production slash command deployment
    }
  }
}
