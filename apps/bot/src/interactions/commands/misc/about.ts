import SlashCommand from "@/bot/structures/slashCommand";
import i18next from "@/lang";

import {
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
    await interaction.reply({
      content: i18next.t("commands.about.content", { lng: locale }),
      ephemeral: true,
    });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
