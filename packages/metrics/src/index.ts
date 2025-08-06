import logger from "@gridscout/logger";
import { guildReminderTypes, guilds } from "@gridscout/db/pg/schema";
import db from "@gridscout/db/pg";

import { Registry, Counter, Gauge, Histogram } from "prom-client";
import { count, eq, gt } from "drizzle-orm";
import os from "node:os";
import { Client } from "discord.js";

// Create a Registry to register metrics
const register = new Registry();

// Metrics for Discord bot stats
export const guildCount = new Gauge({
  name: "discord_guild_count",
  help: "Number of guilds the bot is in",
  registers: [register],
});

export const userInstallCount = new Gauge({
  name: "discord_user_install_count",
  help: "Number of users who have installed the bot",
  registers: [register],
});

export const userCount = new Gauge({
  name: "discord_user_count",
  help: "Number of users in all guilds",
  registers: [register],
});

export const memoryUsage = new Gauge({
  name: "bot_memory_usage_bytes",
  help: "Memory usage of the bot in bytes",
  registers: [register],
  collect() {
    const used = process.memoryUsage();
    this.set(used.rss);
  },
});

export const cpuUsage = new Gauge({
  name: "bot_cpu_usage_percent",
  help: "CPU usage percentage",
  registers: [register],
  collect() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      totalTick +=
        cpu.times.user +
        cpu.times.nice +
        cpu.times.sys +
        cpu.times.idle +
        cpu.times.irq;
      totalIdle += cpu.times.idle;
    }

    // Calculate usage as 1 - idle percentage
    const usage = 1 - totalIdle / totalTick;
    this.set(usage * 100);
  },
});

export const websocketLatency = new Gauge({
  name: "discord_websocket_latency_ms",
  help: "Discord API websocket latency in milliseconds",
  registers: [register],
});

export const chatInteractionCounter = new Counter({
  name: "discord_chat_interactions_total",
  help: "Total number of chat interactions processed",
  registers: [register],
});

export const commandUsageCounter = new Counter({
  name: "discord_command_usage_total",
  help: "Usage count of commands",
  labelNames: ["command"],
  registers: [register],
});

export const interactionResponseTime = new Histogram({
  name: "discord_interaction_response_time_ms",
  help: "Response time for chat interactions in milliseconds",
  labelNames: ["command", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000], // buckets in ms
  registers: [register],
});

export const notificationsEnabled = new Gauge({
  name: "discord_notifications_enabled_count",
  help: "Number of guilds with notifications enabled",
  registers: [register],
});

export async function updateBotMetrics(client: Client) {
  try {
    // Update guild count
    if (client.guilds && client.guilds.cache) {
      const guildSize = client.guilds.cache.size;
      let userSize = 0;

      for (const guild of client.guilds.cache) {
        userSize += guild[1].memberCount;
      }

      guildCount.set(guildSize);
      userCount.set(userSize);
    } else {
      logger.warn("Guild cache not available");
    }

    // Update user install count
    if (client.application) {
      await client.application.fetch();

      const userInstallSize = client.application.approximateUserInstallCount;
      if (userInstallSize) {
        userInstallCount.set(userInstallSize);
      } else {
        logger.warn("User install count not available");
      }
    } else {
      logger.warn("Application not available");
    }

    // Update notifications enabled count
    // Query for guilds that have at least one notification enabled
    const guildData = await db
      .select({
        guild: guilds,
        enabledRemindersCount: count(guildReminderTypes.reminderTypeId),
      })
      .from(guilds)
      .leftJoin(guildReminderTypes, eq(guilds.id, guildReminderTypes.guildId))
      .groupBy(
        guilds.id,
        guilds.notificationsChannelId,
        guilds.reminderMinutes,
        guilds.reminderMentionEveryone,
      )
      .having(gt(count(guildReminderTypes.reminderTypeId), 0));

    notificationsEnabled.set(guildData.length);

    // Update ws latency
    if (client.ws && client.ws.ping && !isNaN(client.ws.ping)) {
      websocketLatency.set(client.ws.ping);
    }
  } catch (error) {
    logger.error("Error updating bot metrics");
    logger.error(error);
  }
}

export function incrementChatInteraction(commandName?: string) {
  chatInteractionCounter.inc();

  if (commandName) {
    commandUsageCounter.inc({ command: commandName });
  }
}

export function startInteractionTimer(
  commandName: string,
): (status?: "success" | "error") => void {
  const endTimer = interactionResponseTime.startTimer({ command: commandName });

  return (status: "success" | "error" = "success") => {
    endTimer({ status });
  };
}

export function startMetricsServer(port?: string) {
  try {
    if (!port) {
      logger.debug("No metrics port specified, skipping metrics server");
      return null;
    }

    const server = Bun.serve({
      routes: {
        "/metrics": async () => {
          return new Response(await register.metrics(), {
            headers: { "Content-Type": register.contentType },
          });
        },
      },
      port,
    });

    logger.info(`Metrics server listening on port ${port}`);
    return server;
  } catch (error) {
    logger.error("Failed to start metrics server");
    logger.error(error);
  }
}

export default {
  register,
  updateBotMetrics,
  incrementChatInteraction,
  startInteractionTimer,
  startMetricsServer,
};
