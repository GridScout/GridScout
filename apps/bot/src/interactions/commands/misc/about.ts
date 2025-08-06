import SlashCommand from "../../../structures/slashCommand.js";
import { client } from "../../../index.js";

import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  InteractionContextType,
} from "discord.js";

export default class Command extends SlashCommand {
  constructor() {
    super("about", "Info about GridScout");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    const t = this.getTranslation(locale);

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const pingButton = new ButtonBuilder()
      .setCustomId("ping")
      .setLabel(`${client.ws.ping}ms`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1342549911715053629")
      .setDisabled(true);

    await interaction.editReply({
      content: t("about.content"),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(pingButton),
      ],
    });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
      ])
      .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
      ])
      .toJSON();
  }
}
