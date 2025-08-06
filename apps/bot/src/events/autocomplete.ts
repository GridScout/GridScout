import { commands } from "../index.js";

import Event from "../structures/event.js";
import type SlashCommand from "../structures/slashCommand.js";

import logger from "@gridscout/logger";

import { AutocompleteInteraction } from "discord.js";

export default class AutocompleteInteractionEvent extends Event {
  constructor() {
    super("AutocompleteInteraction", "interactionCreate", false);
  }

  override async execute(interaction: AutocompleteInteraction) {
    if (!interaction.isAutocomplete()) return;

    const commandName = interaction.commandName;
    const command = commands.get(commandName);

    // If command has an autocomplete method
    if (
      command &&
      "handleAutocomplete" in command &&
      typeof (command as SlashCommand).handleAutocomplete === "function"
    ) {
      try {
        // Call handleAutocomplete method
        await (command as SlashCommand).handleAutocomplete(interaction);
        return;
      } catch (error) {
        logger.error(`Error handling autocomplete for ${commandName}`);
        logger.error(error);
        await interaction.respond([]);
        return;
      }
    }
  }
}
