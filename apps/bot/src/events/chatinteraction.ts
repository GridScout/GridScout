import { commands } from "@/bot/index";
import { Logger } from "@/utils";
import Event from "@/bot/structures/event";
import * as Sentry from "@sentry/bun";
import { ChannelType, ChatInputCommandInteraction } from "discord.js";

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

    if (command.options?.guildOnly && !interaction.guild) {
      return void (await interaction.reply({
        content: "This command can only be executed in a server",
      }));
    }

    await Sentry.startSpan(
      {
        op: "command",
        name: `${interaction.commandName}`,
        attributes: {
          subcommand: interaction.options.getSubcommand() ?? "none",
          arguments: JSON.stringify(interaction.options.data),
          guild: interaction.guild?.name,
          guild_id: interaction.guild?.id,
          user: interaction.user.username,
          user_id: interaction.user.id,
          channel:
            interaction.channel?.type === ChannelType.DM
              ? "DM"
              : (interaction.channel?.name ?? "Unknown"),
          channel_id: interaction.channel?.id,
        },
      },
      async () => {
        try {
          await command.execute(interaction, interaction.locale);
        } catch (error) {
          Logger.error(
            `Error executing command ${interaction.commandName} by ${interaction.user.username}`,
          );
          Logger.error(String(error));
          Sentry.captureException(error);
          throw error;
        }
      },
    );
  }
}
