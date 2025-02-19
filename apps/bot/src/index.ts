import { config } from "@/config";
import { Logger } from "@/utils";
import { loadCommands } from "@/bot/handlers/commands";
import { loadEvents } from "@/bot/handlers/events";
import SlashCommand from "@/bot/structures/slashCommand";
import * as Sentry from "@sentry/bun";

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

Sentry.init({
  dsn: config.SENTRY_DSN,
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});

process.on("unhandledRejection", (error) => {
  Logger.error("An error occurred", error);
});

process.on("uncaughtException", (error) => {
  Logger.error("An error occurred", error);
});
