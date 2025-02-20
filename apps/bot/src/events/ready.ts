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

      if (config.DOPPLER_ENVIRONMENT === "prod") {
        const globalCommands = await client.application?.commands.fetch();

        if (!globalCommands) {
          Logger.error(`Could not fetch global commands`);
          return;
        }

        const globalCommandNames = globalCommands.map(
          (command) => command.name,
        );

        const commandsToAdd = commandData.filter(
          (command) => !globalCommandNames.includes(command.name),
        );

        const commandsToRemove = globalCommands.filter(
          (command) =>
            !commandData.map((command) => command.name).includes(command.name),
        );

        const commandsToUpdate = commandData.filter((command) =>
          globalCommandNames.includes(command.name),
        );

        Logger.debug(
          `Commands to add: ${commandsToAdd.map((command) => command.name)}`,
        );
        Logger.debug(
          `Commands to remove: ${commandsToRemove.map((command) => command.name)}`,
        );
        Logger.debug(
          `Commands to update: ${commandsToUpdate.map((command) => command.name)}`,
        );

        await Promise.all(
          commandsToAdd.map(async (command) => {
            await client.application?.commands.create(command);
          }),
        );

        await Promise.all(
          commandsToRemove.map(async (command) => {
            await client.application?.commands.delete(command);
          }),
        );

        await Promise.all(
          commandsToUpdate.map(async (command) => {
            const globalCommand = globalCommands.find(
              (globalCommand) => globalCommand.name === command.name,
            );
            if (!globalCommand) return;
            await client.application?.commands.edit(globalCommand.id, command);
          }),
        );

        Logger.debug(
          `Deployed all global slash commands (${commandsToAdd.length} added, ${commandsToRemove.size} removed, ${commandsToUpdate.length} updated)`,
        );
      }
    }
  }
}
