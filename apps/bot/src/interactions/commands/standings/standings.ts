import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import i18next from "@gridscout/lang";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import teamEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import numberEmojis from "@gridscout/lang/emojis/numbers" with { type: "json" };

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("standings", "View F1 driver or constructor standings");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string
  ) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const season = interaction.options.getInteger("season") ?? undefined;

    if (season && season > new Date().getFullYear() + 1) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("standings.error", {
              year: season,
              lng: locale,
            })
          ),
        ],
      });
    }

    if (subcommand === "driver") {
      return this.handleDriverStandings(interaction, locale, season);
    } else if (subcommand === "constructor") {
      return this.handleConstructorStandings(interaction, locale, season);
    }
  }

  private async handleDriverStandings(
    interaction: ChatInputCommandInteraction,
    locale: string,
    season?: number
  ) {
    const result = await api.standings.getDriverStandings(season);

    if (result.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("standings.error", {
              year: season || new Date().getFullYear(),
              lng: locale,
            })
          ),
        ],
      });
    }

    const data = result.unwrap();
    const standings = data.standings as unknown as ExtendedDriverStanding[];

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

    const title = i18next.t("standings.drivers.title", {
      season: data.season,
      lng: locale,
    });

    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: i18next.t("standings.drivers.author", { lng: locale }),
    });

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleConstructorStandings(
    interaction: ChatInputCommandInteraction,
    locale: string,
    season?: number
  ) {
    const result = await api.standings.getConstructorStandings(season);

    if (result.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("standings.error", {
              year: season || new Date().getFullYear(),
              lng: locale,
            })
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

    const title = i18next.t("standings.constructors.title", {
      season: standings.season,
      lng: locale,
    });

    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: i18next.t("standings.constructors.author", { lng: locale }),
    });

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("driver")
          .setDescription("View the F1 driver standings")
          .addIntegerOption((option) =>
            option
              .setName("season")
              .setDescription("The season to lookup")
              .setMinValue(1950)
              .setRequired(false)
          )
      )
      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("constructor")
          .setDescription("View the F1 constructor standings")
          .addIntegerOption((option) =>
            option
              .setName("season")
              .setDescription("The season to lookup")
              .setMinValue(1950)
              .setRequired(false)
          )
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
