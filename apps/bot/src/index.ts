import env from "@gridscout/env";
import logger from "@gridscout/logger";

import { Client, Collection } from "discord.js";
import * as Sentry from "@sentry/bun";
import type SlashCommand from "./structures/slashCommand.js";
import { loadEvents } from "./handlers/events.js";
import { loadCommands } from "./handlers/command.js";

logger.info("Starting GridScout... 🏎️");

export const start = Date.now();

export const commands: Collection<string, SlashCommand> = new Collection();

export const client = new Client({
  intents: [],
  allowedMentions: {
    parse: ["users"],
  },
});

logger.info("Loading commands...");
await loadCommands();
logger.info("Loading events...");
await loadEvents();

client.login(env.DISCORD_TOKEN);

if (env.SENTRY_DSN) {
  Sentry.init({
    environment: env.DOPPLER_ENVIRONMENT,

    dsn: env.SENTRY_DSN,
    // Tracing
    tracesSampleRate: 1.0,
  });
}
