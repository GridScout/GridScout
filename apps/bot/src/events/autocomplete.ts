import { commands } from "@/bot/index";
import Event from "@/bot/structures/event";
import { Logger } from "@/utils";
import { AutocompleteInteraction } from "discord.js";

import { MeilisearchClient } from "@/utils";

const meilisearch = new MeilisearchClient();

export default class ChatInteractionEvent extends Event {
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
