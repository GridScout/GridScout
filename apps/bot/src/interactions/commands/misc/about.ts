import i18next from "@gridscout/lang";

import SlashCommand from "../../../structures/slashCommand.js";
import { client } from "../../../index.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

export default class Command extends SlashCommand {
  constructor() {
    super("about", "Info about GridScout");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
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
      content: i18next.t("commands.about.content", { lng: locale }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(pingButton),
      ],
    });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
