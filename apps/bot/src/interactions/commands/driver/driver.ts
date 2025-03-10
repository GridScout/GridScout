import SlashCommand from "../../../structures/slashCommand.js";

import type { Driver } from "@gridscout/types";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import constructorEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import i18next from "@gridscout/lang";
import { API } from "@gridscout/api";
import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { meilisearch } from "@gridscout/search";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("driver", "View information about a driver");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string
  ) {
    await interaction.deferReply();

    // Get the driver name from the interaction options
    let driver = interaction.options.getString("driver");

    // If no driver empty, return an error
    if (!driver) {
      return interaction.editReply({
        embeds: [errorEmbed("", i18next.t("genericError", { lng: locale }))],
      });
    }

    // Search for the driver in Meilisearch
    const driverSearch = await meilisearch.searchDriverByName(driver);
    if (driverSearch.length > 0) driver = driverSearch[0]?.id ?? driver;

    // Get the driver data from the API
    const driverData = await api.driver.get(driver);

    // If the driver data is an error, return an error embed
    if (driverData.isErr()) {
      return interaction.editReply({
        embeds: [errorEmbed("", i18next.t("driver.error", { lng: locale }))],
      });
    }

    const driverInfo = driverData.unwrap();

    const embed = primaryEmbed(
      `${driverInfo.name} ${driverInfo.permanentNumber ? `[${driverInfo.permanentNumber}]` : ""}`,
      ""
    );

    const teamId = driverInfo.team.id;
    // Get the team emoji from the team id
    const constructorEmoji =
      teamId && teamId in constructorEmojis
        ? constructorEmojis[teamId as keyof typeof constructorEmojis]
        : "";

    // Get the time tag for the date of birth
    const timetag = `<t:${new Date(driverInfo.dateOfBirth).getTime() / 1000}:R>`;

    embed.setDescription(
      `${i18next.t("driver.acronym", { lng: locale, acronym: driverInfo.abbreviation })}\n` +
        `${i18next.t("driver.constructor", { lng: locale, constructorEmoji, name: driverInfo.team.name })}\n` +
        `${i18next.t("driver.dob", { lng: locale, dob: driverInfo.dateOfBirth, timetag })}\n` +
        `${i18next.t("driver.nationality", { lng: locale, flag: countryEmojis[driverInfo.nationality.alpha3 as keyof typeof countryEmojis], nationality: `${driverInfo.nationality.demonym}` })}\n`
    );

    embed.addFields([
      {
        name: i18next.t("driver.statistics", { lng: locale }),
        value:
          `${i18next.t("driver.wdc", { lng: locale, amount: driverInfo.statistics.worldChampionships })}\n` +
          `${i18next.t("driver.highestRaceFinish", { lng: locale, position: driverInfo.statistics.highestRaceFinish || 0 })}\n` +
          `${i18next.t("driver.highestGridPosition", { lng: locale, position: driverInfo.statistics.highestGridPosition || 0 })}\n` +
          `${i18next.t("driver.racesEntered", { lng: locale, amount: driverInfo.statistics.racesEntered })}\n`,
        inline: true,
      },
      {
        name: "_ _",
        value:
          `${i18next.t("driver.podiums", { lng: locale, amount: driverInfo.statistics.podiums })}\n` +
          `${i18next.t("driver.points", { lng: locale, amount: driverInfo.statistics.points })}\n` +
          `${i18next.t("driver.fastestLaps", { lng: locale, amount: driverInfo.statistics.fastestLaps })}\n` +
          `${i18next.t("driver.grandslams", { lng: locale, amount: driverInfo.statistics.grandSlams })}\n`,
        inline: true,
      },
    ]);

    // Set the thumbnail to the driver image from wikipedia
    embed.setThumbnail(driverInfo.image);

    // Generated the ANSI-styled recent races code block
    const generateLastRacesANSI = (races: Driver["recentRaces"]): string => {
      return races
        .map((race) => {
          const position = `${i18next.t("driver.position", { lng: locale, pos: getOrdinalSuffix(race.position, locale) })} ${race.raceGap ? `(${race.raceGap})` : ""}`;
          const raceTime =
            race.raceTime == null
              ? i18next.t("driver.notAvailable", { lng: locale })
              : race.raceTime;

          return `\u001b[2;34m\u001b[1;34m${race.name}\u001b[0m\u001b[2;34m\u001b[0m \u001b[2;33m${race.date}\u001b[0m\n \u001b[2;42m\u001b[0m\u001b[2;30m├\u001b[0m ⏰ \u001b[2;36m${raceTime}\u001b[0m\n \u001b[2;30m└\u001b[0m 🏁 \u001b[2;36m${position}\u001b[0m`;
        })
        .join("\n\n");
    };

    const lastRaces = driverInfo.recentRaces;

    if (lastRaces.length) {
      embed.addFields([
        {
          name: i18next.t("driver.lastRaces", {
            lng: locale,
            count: lastRaces.length,
          }),
          value: `\`\`\`ansi\n${generateLastRacesANSI(lastRaces)}\`\`\``,
        },
      ]);
    }

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("driver")
          .setDescription("The driver to view information on")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .toJSON();
  }
}

function getOrdinalSuffix(n: string, locale: string) {
  if (isNaN(parseInt(n))) {
    return n;
  }

  const s = [
      i18next.t("ordinal.rules.default", { lng: locale }),
      i18next.t("ordinal.rules.1", { lng: locale }),
      i18next.t("ordinal.rules.2", { lng: locale }),
      i18next.t("ordinal.rules.3", { lng: locale }),
    ],
    v = parseInt(n) % 100;
  const index = (v - 20) % 10;
  const suffix =
    s[index] !== undefined ? s[index] : s[v] !== undefined ? s[v] : s[0];
  if (!suffix) return n;
  return `${i18next.t("driver.finished", { lng: locale })} ${n}${suffix}`;
}
