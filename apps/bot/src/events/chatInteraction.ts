import logger from "@gridscout/logger";
import { errorEmbed } from "@gridscout/utils";
import i18next from "@gridscout/lang";
import metrics from "@gridscout/metrics";

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

    // Start timer
    const commandName = interaction.commandName;
    const subCommand = interaction.options.getSubcommand(false);
    const endTimer = metrics.startInteractionTimer(commandName);

    // Increment counterr
    metrics.incrementChatInteraction(commandName);

    const command = commands.get(commandName);

    const errEmbed = errorEmbed(
      "",
      i18next.t("genericError", {
        lng: interaction.locale,
      }),
    );

    if (!command) {
      logger.error(
        `Unknown command ${commandName} executed by ${interaction.user.username}`,
      );
      endTimer("error");
      return void (await interaction.reply({
        embeds: [errEmbed],
        flags: MessageFlags.Ephemeral,
      }));
    }

    if (command.options?.guildOnly && !interaction.guild) {
      endTimer("error");
      return void (await interaction.reply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("guildOnly", {
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
        name: commandName + (subCommand ? ` ${subCommand}` : ""),
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
          endTimer("success");
        } catch (error) {
          logger.error(
            `Error executing command ${commandName} by ${interaction.user.username}`,
          );
          logger.error(error);

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

          endTimer("error");

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
