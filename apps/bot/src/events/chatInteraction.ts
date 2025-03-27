import logger from "@gridscout/logger";
import { errorEmbed } from "@gridscout/utils";
import i18next from "@gridscout/lang";

import Event from "../structures/event.js";
import { commands } from "../index.js";

import {
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  ActionRowBuilder,
} from "discord.js";
import * as Sentry from "@sentry/bun";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("ChatInteraction", "interactionCreate", false);
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    const errEmbed = errorEmbed(
      "",
      i18next.t("genericError", {
        lng: interaction.locale,
      }),
    );

    if (!command) {
      logger.error(
        `Unknown command ${interaction.commandName} executed by ${interaction.user.username}`,
      );
      return void (await interaction.reply({
        embeds: [errEmbed],
        flags: MessageFlags.Ephemeral,
      }));
    }

    if (command.options?.guildOnly && !interaction.guild) {
      return void (await interaction.reply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("genericError.guildOnly", {
              lng: interaction.locale,
            }),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      }));
    }

    await Sentry.startSpan(
      {
        op: "command",
        name: interaction.commandName,
        attributes: {
          arguments: JSON.stringify(interaction.options),
          user: interaction.user.username,
          user_id: interaction.user.id,
          channel_id: interaction.channelId,
          guild_id: interaction.guildId ?? "None",
        },
      },
      async (span) => {
        try {
          await command.execute(interaction, interaction.locale);
        } catch (error) {
          logger.error(
            `Error executing command ${interaction.commandName} by ${interaction.user.username}`,
            error,
          );

          // Mark the span as errored
          span.setStatus({
            code: 2,
            message: error instanceof Error ? error.message : String(error),
          });

          Sentry.captureException(error);

          const spanId = span.spanContext().traceId.slice(0, 4);

          const errorButton = new ButtonBuilder()
            .setCustomId(`error-${spanId}`)
            .setLabel(
              i18next.t("errorId", { lng: interaction.locale, id: spanId }),
            )
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true);

          // If interaction has not been deferred
          if (!interaction.deferred) {
            return void (await interaction.reply({
              embeds: [errEmbed],
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  errorButton,
                ),
              ],
              flags: MessageFlags.Ephemeral,
            }));
          }

          return void (await interaction.editReply({
            embeds: [errEmbed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(errorButton),
            ],
          }));
        }
      },
    );
  }
}
