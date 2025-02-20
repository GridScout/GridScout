import { ErgastClient } from "@/api";
import SlashCommand from "@/bot/structures/slashCommand";
import i18next from "@/lang";
import { errorEmbed, primaryEmbed, nationalityToCountry } from "@/utils";
import numberEmojis from "@/lang/emojis/numbers.json";
import countryEmojis from "@/lang/emojis/countries.json";
import teamEmojis from "@/lang/emojis/teams.json";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

const ergast = new ErgastClient();

export default class Command extends SlashCommand {
  constructor() {
    super(
      "standings",
      "View the standings for the current or a specific season",
    );
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();

    const season =
      interaction.options.getInteger("year")?.toString() ||
      new Date().getFullYear().toString();

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "driver") {
      const driverStandings = await ergast.standings.getDriverStandings(season);
      if (driverStandings.isErr()) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              "",
              i18next.t("commands.standings.error.description", {
                year: season,
                lng: locale,
              }),
            ),
          ],
        });
      }

      const standingsData = driverStandings.unwrap();

      const drivers = standingsData.standings.slice(0, 40);

      const lines = drivers.map((driver, index: number) => {
        const numEmoji =
          numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
          `${index + 1}`;
        const flagEmoji = nationalityToCountry[driver.nationality]
          ? countryEmojis[
              nationalityToCountry[
                driver.nationality
              ] as keyof typeof countryEmojis
            ] || ""
          : "";
        return `${numEmoji}‎ ‎ ‎ ‎ ${flagEmoji}‎ ‎ **${driver.name.first} ${driver.name.last}** — ${driver.points} ${i18next.t("commands.standings.driver.points", { lng: locale })}`;
      });

      const title = i18next.t("commands.standings.driver.title", {
        season,
        lng: locale,
      });

      const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
        name: i18next.t("commands.standings.driver.author", { lng: locale }),
      });

      embed.setFooter({
        text: i18next.t("commands.standings.driver.footer", { lng: locale }),
      });

      // TODO: Fetch from API to get the last updated date
      embed.setTimestamp(Date.now());

      await interaction.editReply({ embeds: [embed] });
    } else if (subcommand === "constructor") {
      const constructorStandings =
        await ergast.standings.getConstructorStandings(season);
      if (constructorStandings.isErr()) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              "",
              i18next.t("commands.standings.error.description", {
                year: season,
                lng: locale,
              }),
            ),
          ],
        });
      }

      const standingsData = constructorStandings.unwrap();
      const constructors = standingsData.standings;

      const lines = constructors.map((cs, index: number) => {
        const numEmoji =
          numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
          `${index + 1}`;

        const teamInfo = cs.team[0];
        const teamId = teamInfo?.id.toLowerCase();

        let logoEmoji = teamEmojis[teamId as keyof typeof teamEmojis] || "";
        if (!logoEmoji && cs.nationality) {
          // fallback to country flag if team logo is not found
          const country = nationalityToCountry[cs.nationality];
          logoEmoji = country
            ? countryEmojis[country as keyof typeof countryEmojis] || ""
            : "";
        }

        const teamName = teamInfo?.name || "Unknown Team";

        return `${numEmoji}‎ ‎ ‎ ‎ ${logoEmoji}‎ ‎ **${teamName}** – ${cs.points} ${i18next.t("commands.standings.driver.points", { lng: locale })}`;
      });

      const title =
        i18next.t("commands.standings.constructor.title", {
          season,
          lng: locale,
        }) || `${season} Constructor Standings`;

      const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
        name: "Constructor Standings",
      });

      embed.setFooter({
        text: i18next.t("commands.standings.driver.footer", { lng: locale }),
      });

      // TODO: Fetch from API to get the last updated date
      embed.setTimestamp(Date.now());

      await interaction.editReply({ embeds: [embed] });
    }
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("driver")
          .setDescription(
            "View the driver standings for the current or a specific season",
          )
          .addIntegerOption((option) =>
            option
              .setName("year")
              .setDescription("The season to lookup")
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("constructor")
          .setDescription(
            "View the constructor standings for the current or a specific season",
          )
          .addIntegerOption((option) =>
            option
              .setName("year")
              .setDescription("The season to lookup")
              .setRequired(false),
          ),
      )
      .toJSON();
  }
}
