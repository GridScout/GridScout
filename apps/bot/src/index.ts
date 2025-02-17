import { config } from "@/config";
import { Logger } from "@/utils";
import { loadCommands } from "@/bot/handlers/commands";
import { loadEvents } from "@/bot/handlers/events";
import SlashCommand from "@/bot/structures/slashCommand";

import { Client, Collection } from "discord.js";

Logger.info("Starting GridScout 🏎️");

export const start = Date.now();

export const client = new Client({
  intents: [],
  allowedMentions: {
    parse: ["users"],
  },
});

export const commands: Collection<string, SlashCommand> = new Collection();

(async () => {
  Logger.info("Loading commands...");
  await loadCommands();
  Logger.info("Loading events...");
  await loadEvents();
})();

client.login(config.DISCORD_TOKEN);
