import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import teamEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import numberEmojis from "@gridscout/lang/emojis/numbers" with { type: "json" };

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  Locale,
  AutocompleteInteraction,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import { meilisearch } from "@gridscout/search";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("standings", "View F1 driver or constructor standings");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    const subcommand = interaction.options.getSubcommand();
    const season = interaction.options.getInteger("season") ?? undefined;

    if (season && season > new Date().getFullYear() + 1) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("standings.error", { year: season }))],
      });
    }

    switch (subcommand) {
      case "driver":
        return this.handleDriverStandings(interaction, t, season);
      case "constructor":
        return this.handleConstructorStandings(interaction, t, season);
      default:
        return interaction.editReply({
          embeds: [errorEmbed("", t("standings.error", { year: season }))],
        });
    }
  }

  private async handleDriverStandings(
    interaction: ChatInputCommandInteraction,
    t: (key: string, options?: Record<string, any>) => string,
    season?: number,
  ) {
    const result = await api.standings.getDriverStandings(season);

    if (result.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            t("standings.error", { year: season || new Date().getFullYear() }),
          ),
        ],
      });
    }

    const data = result.unwrap();
    const standings = data.standings as ExtendedDriverStanding[];

    const lines = standings.map((standing, index) => {
      // Get position emoji (or use num if over 50)
      const posEmoji =
        numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
        `${index + 1}`;

      // Get driver nationality emoji
      const driverCountryEmoji =
        (standing.driver.nationality &&
          countryEmojis[
            standing.driver.nationality as keyof typeof countryEmojis
          ]) ||
        "";

      return `${posEmoji}‎ ‎ ‎ ‎ ${driverCountryEmoji ? `${driverCountryEmoji}‎ ‎ ` : ""}**${standing.driver.name}** — ${standing.points} pts`;
    });

    const title = t("standings.drivers.title", { season: data.season });

    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: t("standings.drivers.author"),
    });

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleConstructorStandings(
    interaction: ChatInputCommandInteraction,
    t: (key: string, options?: Record<string, any>) => string,
    season?: number,
  ) {
    const result = await api.standings.getConstructorStandings(season);

    if (result.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            t("standings.error", { year: season || new Date().getFullYear() }),
          ),
        ],
      });
    }

    const standings = result.unwrap();

    const lines = standings.standings.map((standing, index) => {
      const posEmoji =
        numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
        `${index + 1}`;

      // Get the team emoji using the constructor ID
      const teamId = standing.constructor.id.toLowerCase();

      const teamEmoji = teamEmojis[teamId as keyof typeof teamEmojis] || "";

      return `${posEmoji}‎ ‎ ‎ ‎ ${teamEmoji ? `${teamEmoji}‎ ‎ ` : ""}**${standing.constructor.name}** — ${standing.points} pts`;
    });

    const title = t("standings.constructors.title", {
      season: standings.season,
    });

    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: t("standings.constructors.author"),
    });

    await interaction.editReply({ embeds: [embed] });
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const allRaces = await meilisearch.getAllRaces();

    if (focusedOption.name === "season") {
      const searchTerm = focusedOption.value;
      const subcommand = interaction.options.getSubcommand();
      const minYear = subcommand === "constructor" ? 1958 : 1950;

      const years = [...new Set(allRaces.map((race) => race.year))]
        .filter(
          (year) => year >= minYear && year.toString().includes(searchTerm),
        )
        .sort((a, b) => b - a)
        .slice(0, 25);

      await interaction.respond(
        years.map((year) => ({
          name: year.toString(),
          value: year,
        })),
      );
    }
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
      ])
      .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
      ])
      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("driver")
          .setDescription("View the F1 driver standings")
          .addIntegerOption((option) =>
            option
              .setName("season")
              .setDescription("The season to lookup")
              .setMinValue(1950)
              .setAutocomplete(true)
              .setRequired(false),
          ),
      )
      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("constructor")
          .setDescription("View the F1 constructor standings")
          .addIntegerOption((option) =>
            option
              .setName("season")
              .setDescription("The season to lookup")
              .setMinValue(1958)
              .setAutocomplete(true)
              .setRequired(false),
          ),
      )
      .toJSON();
  }
}

interface DriverInfo {
  id: string;
  name: string;
  nationality?: string;
}

interface TeamInfo {
  id: string;
  name: string;
}

interface ExtendedDriverStanding {
  position: number;
  driver: DriverInfo;
  team: TeamInfo;
  points: number;
}
