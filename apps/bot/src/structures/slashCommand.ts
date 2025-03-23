import i18next from "@gridscout/lang";
import type {
  ChatInputCommandInteraction,
  PermissionResolvable,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

import pg from "@gridscout/db/postgres";

export type SlashCommandOptions = {
  requiredPermissions?: PermissionResolvable[];
  cooldown?: number;
  guildOnly?: boolean;
};

export default class SlashCommand {
  name: string;
  description: string;
  options: SlashCommandOptions | undefined;

  constructor(
    name: string,
    description: string,
    options?: SlashCommandOptions,
  ) {
    this.name = name;
    this.description = description;
    this.options = options;
  }

  public async db() {
    return await pg;
  }

  execute(_: ChatInputCommandInteraction, locale: string) {
    throw new Error("Method not implemented.");
  }

  getTranslation(locale: string) {
    return (key: string, options = {}) =>
      i18next.t(key, { lng: locale, ...options });
  }

  async build(
    command: SlashCommandBuilder,
  ): Promise<SlashCommandBuilder | RESTPostAPIApplicationCommandsJSONBody> {
    return command;
  }
}
