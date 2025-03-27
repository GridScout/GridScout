import type SlashCommand from "./structures/slashCommand.js";
import { loadEvents } from "./handlers/events.js";
import { loadCommands } from "./handlers/command.js";

import env from "@gridscout/env";
import logger from "@gridscout/logger";
import metrics from "@gridscout/metrics";

import { Client, Collection, GatewayIntentBits } from "discord.js";
import * as Sentry from "@sentry/bun";

logger.info("Starting GridScout... 🏎️");

// Store start time
export const start = Date.now();

export const commands: Collection<string, SlashCommand> = new Collection();

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: {
    parse: ["users"],
  },
});

// Load commands and events
logger.info("Loading commands...");
await loadCommands();
logger.info("Loading events...");
await loadEvents();

// Start metrics server
metrics.startMetricsServer(env.METRICS_PORT);

client.login(env.DISCORD_TOKEN);

if (env.SENTRY_DSN) {
  Sentry.init({
    environment: env.DOPPLER_ENVIRONMENT,

    dsn: env.SENTRY_DSN,
    // Tracing
    tracesSampleRate: 1.0,
  });
}
