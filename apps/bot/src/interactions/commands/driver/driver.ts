import i18next from "@gridscout/lang";
import { ErgastClient } from "@gridscout/api";

import teamEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import { errorEmbed, primaryEmbed, formatDate } from "@gridscout/utils";
import { MeilisearchClient } from "@gridscout/meilisearch";

import SlashCommand from "../../../structures/slashCommand.js";

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const meilisearch = new MeilisearchClient();
const ergast = new ErgastClient();

export default class Command extends SlashCommand {
  constructor() {
    super("driver", "View information about a driver");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();

    const query = interaction.options.getString("driver");
    if (!query) return;

    const safeQuery = query.replace(/`/g, "");

    const foundDriver = await meilisearch.searchDriverByName(safeQuery);
    const driver = await ergast.driver.getDriver(foundDriver[0]?.id!);

    if (driver.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("commands.driver.error.description", {
              name: safeQuery,
              lng: locale,
            }),
          ),
        ],
      });
    }

    const driverData = driver.unwrap();

    const flagEmoji = driverData.nationality.country
      ? countryEmojis[
          driverData.nationality.country as keyof typeof countryEmojis
        ] || ""
      : "";

    const teamEmoji = driverData.constructors[
      driverData.constructors.length - 1
    ]?.name
      ? teamEmojis[
          driverData.constructors[driverData.constructors.length - 1]
            ?.id as keyof typeof teamEmojis
        ] || ""
      : "";

    const dobTimeTag = driverData.dob
      ? `<t:${Math.floor(new Date(driverData.dob).getTime() / 1000)}:R>`
      : "";

    const generateLastRacesANSI = (races: any[]): string => {
      return races
        .map((race) => {
          const fastestText = race.fastest_lap
            ? `(🎖️ ${i18next.t("commands.driver.fastest", { lng: locale })})`
            : "";

          const position = `${i18next.t("commands.driver.position", { pos: race.position, lng: locale })}${getOrdinalSuffix(race.position, locale)}`;

          // The below uses ANSII For colour formatting
          return `\u001b[2;34m\u001b[1;34m${race.country.code} ${race.name}\u001b[0m\u001b[2;34m\u001b[0m \u001b[2;33m${race.date}\u001b[0m\n   \u001b[2;42m\u001b[0m\u001b[2;30m├\u001b[0m ⏰ \u001b[2;36m${race.time.time || i18next.t("commands.driver.n/a", { lng: locale })} ${fastestText}\u001b[0m\n   \u001b[2;30m└\u001b[0m 🏁 \u001b[2;36m${position}\u001b[0m`;
        })
        .join("\n\n");
    };

    const lastRacesANSI = generateLastRacesANSI(driverData.recent_races);

    const embed = primaryEmbed(
      "",
      `${i18next.t("commands.driver.acronym", { acronym: driverData.acronym !== null ? driverData.acronym : i18next.t("commands.driver.n/a", { lng: locale }), lng: locale })}\n` +
        `${driverData.constructors.length > 0 ? i18next.t("commands.driver.constructor", { emoji: teamEmoji, name: driverData.constructors[driverData.constructors.length - 1]?.name, url: driverData.constructors[0]?.wikipedia_url, lng: locale }) + "\n" : ""}` +
        `${i18next.t("commands.driver.dob", { dob: driverData.dob ? formatDate(driverData.dob) : i18next.t("commands.driver.n/a", { lng: locale }), timetag: dobTimeTag, lng: locale })}\n` +
        `${i18next.t("commands.driver.nationality", {
          flag: flagEmoji || "",
          nationality: driverData.nationality.name,
          lng: locale,
        })}\n`,
    );

    embed.addFields([
      {
        name: i18next.t("commands.driver.statistics", { lng: locale }),
        value:
          `${i18next.t("commands.driver.wdc", { amount: driverData.statistics.world_championships, lng: locale })}\n` +
          `${i18next.t("commands.driver.highest_race_finish", { position: driverData.statistics.highest_finish.position, amount: driverData.statistics.highest_finish.amount, lng: locale })}\n` +
          `${i18next.t("commands.driver.highest_grid_position", { position: driverData.statistics.highest_grid.position, amount: driverData.statistics.highest_grid.amount, lng: locale })}\n`,
        inline: true,
      },
      {
        name: "_ _",
        value:
          `${i18next.t("commands.driver.grand_prix_entered", { amount: driverData.statistics.grand_prix_entered, lng: locale })}\n` +
          `${i18next.t("commands.driver.podiums", { amount: driverData.statistics.podiums, lng: locale })}\n` +
          `${i18next.t("commands.driver.points", { amount: driverData.statistics.points, lng: locale })}\n`,
        inline: true,
      },
    ]);

    if (driverData.recent_races.length > 0) {
      embed.addFields([
        {
          name: i18next.t("commands.driver.last_races", {
            count: driverData.recent_races.length,
            lng: locale,
          }),
          value: "```ansi\n" + lastRacesANSI + "\n```",
        },
      ]);
    }

    embed.setThumbnail(driverData.poster);

    embed.setAuthor({
      name: `${driverData.name.first} ${driverData.name.last} ${driverData.number ? `[${driverData.number}]` : ""}`,
    });

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("driver")
          .setDescription("The driver to get information about")
          .setAutocomplete(true)
          .setMaxLength(50)
          .setRequired(true),
      )
      .toJSON();
  }
}

function getOrdinalSuffix(n: number, locale: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return i18next.t("commands.driver.th", { lng: locale });
  }

  if (mod10 === 1) return i18next.t("commands.driver.st", { lng: locale });
  if (mod10 === 2) return i18next.t("commands.driver.nd", { lng: locale });
  if (mod10 === 3) return i18next.t("commands.driver.rd", { lng: locale });

  return i18next.t("commands.driver.th", { lng: locale });
}
