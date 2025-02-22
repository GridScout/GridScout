import { MeilisearchClient } from "@gridscout/meilisearch";
import Event from "../structures/event.js";

import { AutocompleteInteraction } from "discord.js";

const meilisearch = new MeilisearchClient();

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("AutocompleteInteraction", "interactionCreate", false);
  }

  async execute(interaction: AutocompleteInteraction) {
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
