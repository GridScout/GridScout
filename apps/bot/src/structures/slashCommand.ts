import i18next from "@gridscout/lang";
import type {
  ChatInputCommandInteraction,
  Locale,
  PermissionResolvable,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  AutocompleteInteraction,
} from "discord.js";

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

  execute(_: ChatInputCommandInteraction, locale: Locale) {
    throw new Error("Method not implemented.");
  }

  handleAutocomplete(_: AutocompleteInteraction) {
    throw new Error("Method not implemented.");
  }

  getTranslation(locale: Locale) {
    return (key: string, options = {}) =>
      i18next.t(key, { lng: locale, ...options });
  }

  async build(
    command: SlashCommandBuilder,
  ): Promise<SlashCommandBuilder | RESTPostAPIApplicationCommandsJSONBody> {
    return command;
  }
}
