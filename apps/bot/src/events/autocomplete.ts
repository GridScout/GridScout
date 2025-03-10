import Event from "../structures/event.js";

import { meilisearch } from "@gridscout/search";

import { AutocompleteInteraction } from "discord.js";

export default class AutocompleteInteractionEvent extends Event {
  constructor() {
    super("AutocompleteInteraction", "interactionCreate", false);
  }

  override async execute(interaction: AutocompleteInteraction) {
    if (!interaction.isAutocomplete()) return;

    const command = interaction.commandName;

    if (command === "driver") {
      const query = interaction.options.getString("driver") || "";

      const drivers = await meilisearch.searchDriverByName(query);

      const options = drivers.map((driver) => ({
        name: driver.name,
        value: driver.id,
      }));

      await interaction.respond(options);
    }
  }
}
