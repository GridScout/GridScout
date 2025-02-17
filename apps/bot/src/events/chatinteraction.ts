import { commands } from "@/bot/index";
import { Logger } from "@/utils";
import Event from "@/bot/structures/event";

import type { ChatInputCommandInteraction } from "discord.js";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("ChatInteraction", "interactionCreate", false);
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      Logger.error(
        `Unknown command ${interaction.commandName} executed by ${interaction.user.username}`,
      );
      return void (await interaction.reply({
        content: "There was an error executing that command",
      }));
    }

    if (command.options?.guildOnly && !interaction.guild)
      return void (await interaction.reply({
        content: "This command can only be executed in a server",
      }));

    try {
      await command.execute(interaction);
    } catch (error) {
      Logger.error(
        `Error executing command ${interaction.commandName} by ${interaction.user.username}`,
      );
      Logger.error(String(error));
    }
  }
}
