import SlashCommand from "@/bot/structures/slashCommand";
import { client } from "@/bot/index";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

export default class Command extends SlashCommand {
  constructor() {
    super("about", "Info about GridScout");
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: `${client.ws.ping}ms`,
    });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
