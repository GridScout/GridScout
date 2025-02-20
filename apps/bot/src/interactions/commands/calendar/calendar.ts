import SlashCommand from "@/bot/structures/slashCommand";
import countryEmojis from "@/lang/emojis/countries.json";
import numberEmojis from "@/lang/emojis/numbers.json";

import { ErgastClient } from "@/api";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed, primaryEmbed, formatDate } from "@/utils";
import i18next from "@/lang";

const ergast = new ErgastClient();

export default class Command extends SlashCommand {
  constructor() {
    super("calendar", "View the upcoming or historical F1 calendar");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();

    // Grab the season specified, or current year if not
    const season =
      interaction.options.getInteger("season")?.toString() ??
      new Date().getFullYear().toString();

    // Fetch data
    const calendar = await ergast.calendar.getCalendar(season);

    if (calendar.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("commands.calendar.error.description", {
              year: season,
              lng: locale,
            }),
          ),
        ],
      });
    }

    const races = calendar.unwrap().races;

    const lines = races.map((race, index) => {
      const numEmoji =
        numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
        `${index + 1}`;
      const flagEmoji = race.country
        ? countryEmojis[race.country as keyof typeof countryEmojis] || ""
        : "";

      const raceName = race.raceName || "Unknown race";
      const formattedDate = formatDate(
        race.dates.race.date,
        race.dates.race.time,
      );

      return `${numEmoji}‎ ‎ ‎ ‎ ${flagEmoji}‎ ‎ **${raceName}** — ${formattedDate}`;
    });

    // Find the upcoming race index
    const now = new Date();

    const upcomingIndex = races.findIndex((race) => {
      const { date, time } = race.dates.race;
      const fullDate = time ? `${date}T${time}` : date;
      return new Date(fullDate) > now;
    });

    if (upcomingIndex !== -1) {
      const upcomingRace = races[upcomingIndex];

      const sessions = [
        {
          key: "firstPractice",
          label: `> ${i18next.t("commands.calendar.sessions.fp1", { lng: locale })}`,
        },
        {
          key: "secondPractice",
          label: `> ${i18next.t("commands.calendar.sessions.fp2", { lng: locale })}`,
        },
        {
          key: "thirdPractice",
          label: `> ${i18next.t("commands.calendar.sessions.fp3", { lng: locale })}`,
        },
        {
          key: "sprintQualifying",
          label: `> ${i18next.t("commands.calendar.sessions.sprintQualifying", { lng: locale })}`,
        },
        {
          key: "sprint",
          label: `> <:qualifying:1341925237519810591> ${i18next.t("commands.calendar.sessions.sprint", { lng: locale })}`,
        },
        {
          key: "qualifying",
          label: `> ${i18next.t("commands.calendar.sessions.qualifying", { lng: locale })}`,
        },
      ];

      const detailsLines = sessions
        .filter(
          ({ key }) =>
            upcomingRace?.dates[key as keyof typeof upcomingRace.dates],
        )
        .map(({ key, label }) => {
          const session =
            upcomingRace?.dates[key as keyof typeof upcomingRace.dates];
          if (!session) return "";
          return `${label}: ${formatDate(session.date, session.time)}`;
        })
        .filter(Boolean)
        .join("\n");
      if (detailsLines) {
        lines.splice(upcomingIndex + 1, 0, `${detailsLines}\n`);
      }
    }

    const title = i18next.t("commands.calendar.success.title", {
      season,
      lng: locale,
    });
    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: i18next.t("commands.calendar.success.author", { lng: locale }),
    });

    if (races.some((race) => race.dates.race.time)) {
      embed.setFooter({
        text: i18next.t("commands.calendar.success.footer", { lng: locale }),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName("season")
          .setDescription("The season to lookup")
          // TODO: Add autocomplete for available seasons
          .setMinValue(1950)
          .setRequired(false),
      )
      .toJSON();
  }
}
