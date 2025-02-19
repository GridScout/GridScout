import type {
  ChatInputCommandInteraction,
  PermissionResolvable,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
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

  execute(_: ChatInputCommandInteraction, locale: string) {
    throw new Error("Method not implemented.");
  }

  async build(
    command: SlashCommandBuilder,
  ): Promise<SlashCommandBuilder | RESTPostAPIApplicationCommandsJSONBody> {
    return command;
  }
}
