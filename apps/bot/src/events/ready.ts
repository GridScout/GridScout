import logger from "@gridscout/logger";
import env from "@gridscout/env";
import metrics from "@gridscout/metrics";

import { commands, start } from "../index.js";
import Event from "../structures/event.js";

import {
  ActivityType,
  Routes,
  SlashCommandBuilder,
  type Client,
} from "discord.js";
import { API } from "@gridscout/api";

const api = new API();

export default class ReadyEvent extends Event {
  constructor() {
    super("BotReady", "ready", true);
  }

  override async execute(client: Client) {
    if (!client.user) {
      logger.warn("Client user is missing");
      return;
    }

    logger.info(
      `${client.user.tag} logged into Discord in ${Date.now() - start}ms`,
    );

    // Initialise metrics
    metrics.updateBotMetrics(client);

    setInterval(() => {
      metrics.updateBotMetrics(client);
    }, 60 * 1000);

    const updateActivity = async () => {
      const nextGrandPrix = await api.calendar.get();

      const now = new Date();
      let activity = "the next Grand Prix 🏆";

      if (nextGrandPrix.isErr()) {
        return;
      }

      const upcomingGp = nextGrandPrix
        .unwrap()
        .races.map((gp) => {
          const timeString = gp.grandPrix.time || "00:00";
          const dateTimeString = `${gp.grandPrix.date}T${timeString}:00Z`;
          return {
            ...gp,
            dateTime: new Date(dateTimeString),
          };
        })
        .filter((gp) => gp.dateTime >= now)
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];

      if (upcomingGp) {
        const gpDate = new Date(upcomingGp.grandPrix.date + "T00:00:00Z");

        const timeString = upcomingGp.grandPrix.time || "00:00";
        const [hours, minutes] = timeString.split(":");

        gpDate.setUTCHours(
          parseInt(hours || "0", 10),
          parseInt(minutes || "0", 10),
        );

        const hoursRemaining = Math.ceil(
          (gpDate.getTime() - now.getTime()) / (1000 * 60 * 60),
        );

        if (hoursRemaining < 24) {
          activity = `the ${upcomingGp.name} in ${hoursRemaining} hour${
            hoursRemaining === 1 ? "" : "s"
          }`;
        } else {
          const daysRemaining = Math.floor(hoursRemaining / 24);
          activity = `the ${upcomingGp.name} in ${daysRemaining} day${
            daysRemaining === 1 ? "" : "s"
          }`;
        }
      }

      client.user?.setActivity(activity, { type: ActivityType.Watching });
    };

    updateActivity();

    setInterval(updateActivity, 1000 * 60 * 60 * 1);

    //
    // SLASH COMMAND DEPLOYMENT
    //

    const startupArgs = process.argv;

    if (startupArgs.includes("--deploy") || startupArgs.includes("-D")) {
      logger.debug(
        `Deploying slash commands to Discord ${env.DOPPLER_ENVIRONMENT === "dev" ? "locally" : "globally"}`,
      );
      const commandData: any[] = [];

      await Promise.all(
        commands.map(async (command) => {
          commandData.push(
            await command.build(
              new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.description),
            ),
          );
        }),
      );

      if (env.DOPPLER_ENVIRONMENT === "dev") {
        const devGuild = client.guilds.cache.get(env.GUILD_ID);
        if (!devGuild) {
          logger.error(`Could not find guild with ID ${env.GUILD_ID}`);
          return;
        }
        const existingCommands = await devGuild.commands.fetch();
        if (existingCommands.size > 0) {
          logger.debug(`Deleting existing commands from guild ${devGuild.id}`);
          await devGuild.commands.set([]);
        }
        try {
          await client.rest.put(
            Routes.applicationGuildCommands(client.user.id, devGuild.id),
            { body: commandData },
          );
          logger.debug(`Deployed all local slash commands`);
        } catch (error) {
          logger.error(String(error));
        }
      } else {
        try {
          await client.rest.put(Routes.applicationCommands(client.user.id), {
            body: commandData,
          });
          logger.debug(`Deployed all global slash commands`);
        } catch (error) {
          logger.error(String(error));
        }
      }
    }
  }
}
