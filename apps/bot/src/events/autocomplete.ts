import Event from "../structures/event.js";
import { commands } from "../index.js";

import { AutocompleteInteraction } from "discord.js";

// Define a type for commands that can handle autocomplete
interface CommandWithAutocomplete {
  handleAutocomplete: (interaction: AutocompleteInteraction) => Promise<void>;
}

export default class AutocompleteInteractionEvent extends Event {
  constructor() {
    super("AutocompleteInteraction", "interactionCreate", false);
  }

  override async execute(interaction: AutocompleteInteraction) {
    if (!interaction.isAutocomplete()) return;

    const commandName = interaction.commandName;
    const command = commands.get(commandName);

    // Check if the command has a handleAutocomplete method
    if (
      command &&
      "handleAutocomplete" in command &&
      typeof (command as unknown as CommandWithAutocomplete)
        .handleAutocomplete === "function"
    ) {
      try {
        // Call the command's handleAutocomplete method
        await (
          command as unknown as CommandWithAutocomplete
        ).handleAutocomplete(interaction);
        return;
      } catch (error) {
        console.error(`Error handling autocomplete for ${commandName}:`, error);
        await interaction.respond([]);
        return;
      }
    }
  }
}
