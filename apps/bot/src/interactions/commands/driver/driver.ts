import SlashCommand from "../../../structures/slashCommand.js";

import type { Driver } from "@gridscout/types";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import constructorEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import teamColours from "@gridscout/lang/emojis/colours" with { type: "json" };
import { API } from "@gridscout/api";
import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { meilisearch } from "@gridscout/search";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type Locale,
  ApplicationIntegrationType,
  InteractionContextType,
  type ColorResolvable,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("driver", "View information about a driver");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();

    const t = this.getTranslation(locale);

    // Get the driver name from the interaction options
    let driver = interaction.options.getString("driver");

    // If no driver empty, return an error
    if (!driver) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("genericErrorNoId"))],
      });
    }

    const driverSearch = await meilisearch.searchDriverByName(driver);
    if (driverSearch.length > 0) {
      driver = driverSearch[0]?.id ?? driver;
    } else {
      return interaction.editReply({
        embeds: [errorEmbed("", t("driver.error"))],
      });
    }

    // Get the driver data from the API
    const driverData = await api.driver.get(driver);

    // If the driver data is an error, return an error embed
    if (driverData.isErr()) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("driver.error"))],
      });
    }

    const driverInfo = driverData.unwrap();

    const embed = primaryEmbed(
      `${driverInfo.name} ${driverInfo.permanentNumber ? `[${driverInfo.permanentNumber}]` : ""}`,
      "",
    );

    // Set team color if available
    if (driverInfo.team?.id && driverInfo.team.id in teamColours) {
      const teamColor =
        teamColours[driverInfo.team.id as keyof typeof teamColours];
      embed.setColor(teamColor as ColorResolvable);
    }

    const teamId = driverInfo.team.id;
    // Get the team emoji from the team id
    const constructorEmoji =
      teamId && teamId in constructorEmojis
        ? constructorEmojis[teamId as keyof typeof constructorEmojis]
        : "";

    // Get the time tag for the date of birth
    const timetag = `<t:${new Date(driverInfo.dateOfBirth).getTime() / 1000}:R>`;

    embed.setDescription(
      `${t("driver.acronym", { acronym: driverInfo.abbreviation })}\n` +
        `${t("driver.constructor", { constructorEmoji, name: driverInfo.team.name })}\n` +
        `${t("driver.dob", { dob: this.formatDate(driverInfo.dateOfBirth, locale, t), timetag })}\n` +
        `${t("driver.nationality", { flag: countryEmojis[driverInfo.nationality.alpha3 as keyof typeof countryEmojis], nationality: `${driverInfo.nationality.demonym}` })}\n`,
    );

    embed.addFields([
      {
        name: t("driver.statistics"),
        value:
          `${t("driver.wdc", { amount: driverInfo.statistics.worldChampionships })}\n` +
          `${t("driver.highestRaceFinish", { position: driverInfo.statistics.highestRaceFinish || 0, count: driverInfo.statistics.highestRaceFinishCount })}\n` +
          `${t("driver.highestGridPosition", { position: driverInfo.statistics.highestGridPosition || 0, count: driverInfo.statistics.highestGridPositionCount })}\n` +
          `${t("driver.racesEntered", { amount: driverInfo.statistics.racesEntered })}\n`,
        inline: true,
      },
      {
        name: "_ _",
        value:
          `${t("driver.podiums", { amount: driverInfo.statistics.podiums })}\n` +
          `${t("driver.points", { amount: driverInfo.statistics.points })}\n` +
          `${t("driver.fastestLaps", { amount: driverInfo.statistics.fastestLaps })}\n` +
          `${t("driver.grandslams", { amount: driverInfo.statistics.grandSlams })}\n`,
        inline: true,
      },
    ]);

    // Set the thumbnail to the driver image from wikipedia
    embed.setThumbnail(driverInfo.image);

    const lastRaces = driverInfo.recentRaces;

    if (lastRaces.length) {
      embed.addFields([
        {
          name: t("driver.lastRaces", {
            count: lastRaces.length,
          }),
          value: `\`\`\`ansi\n${this.generateLastRacesANSI(lastRaces, locale, t)}\n\`\`\``,
        },
      ]);
    }

    await interaction.editReply({ embeds: [embed] });
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    const drivers = await meilisearch.searchDriverByName(focusedOption.value);

    const options = drivers.map((driver) => ({
      name: driver.name,
      value: driver.id,
    }));

    await interaction.respond(options);
  }

  private generateLastRacesANSI(
    races: Driver["recentRaces"],
    locale: Locale,
    t: (key: string, options?: object) => string,
  ): string {
    return races
      .map((race) => {
        const position = isNaN(parseInt(race.position))
          ? `${t("driver.position", { pos: this.getOrdinalSuffix(race.position, t) })} ${race.raceGap ? `(${race.raceGap})` : ""}`
          : `${t("driver.position", { pos: `${t("driver.finished")} ${this.getOrdinalSuffix(race.position, t)}` })} ${race.raceGap ? `(${race.raceGap})` : ""}`;
        const raceTime =
          race.raceTime == null ? t("driver.notAvailable") : race.raceTime;

        return `\u001b[2;34m\u001b[1;34m${race.name}\u001b[0m\u001b[2;34m\u001b[0m \u001b[2;33m${race.date}\u001b[0m\n \u001b[2;42m\u001b[0m\u001b[2;30m├\u001b[0m ⏰ \u001b[2;36m${raceTime}\u001b[0m\n \u001b[2;30m└\u001b[0m 🏁 \u001b[2;36m${position}\u001b[0m`;
      })
      .join("\n\n");
  }

  private getOrdinalSuffix(
    n: string,
    t: (key: string, options?: object) => string,
  ): string {
    const num = parseInt(n);
    if (isNaN(num)) {
      return n;
    }
    const s = [
      t("ordinal.rules.default"),
      t("ordinal.rules.1"),
      t("ordinal.rules.2"),
      t("ordinal.rules.3"),
    ];
    const v = num % 100;
    const index = (v - 20) % 10;
    const suffix =
      s[index] !== undefined ? s[index] : s[v] !== undefined ? s[v] : s[0];
    return `${n}${suffix}`;
  }

  private formatDate(
    date: string,
    locale: string,
    t: (key: string, options?: object) => string,
  ): string {
    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const ordinalDay = this.getOrdinalSuffix(day.toString(), t);
    return dateObj
      .toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .replace(day.toString(), ordinalDay);
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
      .addStringOption((option) =>
        option
          .setName("driver")
          .setDescription("The driver to view information on")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .toJSON();
  }
}
