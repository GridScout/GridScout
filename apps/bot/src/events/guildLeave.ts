import Event from "../structures/event.js";

import logger from "@gridscout/logger";
import db from "@gridscout/db/pg";
import { guilds } from "@gridscout/db/pg/schema";

import type { Guild } from "discord.js";
import { eq } from "drizzle-orm";

export default class GuildLeaveEvent extends Event {
  constructor() {
    super("GuildLeave", "guildDelete", false);
  }

  override async execute(guild: Guild) {
    logger.debug(
      `Bot was kicked from guild: ${guild.id}, removing from database...`,
    );

    try {
      await db.delete(guilds).where(eq(guilds.id, guild.id));
      logger.debug(`Successfully removed guild ${guild.id} from database.`);
    } catch (error) {
      logger.warn(`Failed to remove guild ${guild.id} from database: ${error}`);
    }
  }
}
