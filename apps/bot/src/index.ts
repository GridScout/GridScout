import { config } from "@/config";
import { Logger } from "@/utils";
import { Client, Collection } from "discord.js";
import SlashCommand from "@/bot/structures/slashCommand";

Logger.info("Starting GridScout 🏎️");

export const client = new Client({
  intents: [],
  allowedMentions: {
    parse: ["users"],
  },
});

export const commands: Collection<string, SlashCommand> = new Collection();

// Logger.info("Loading commands...");

// Logger.info("Loading events...");

client.login(config.DISCORD_TOKEN);
