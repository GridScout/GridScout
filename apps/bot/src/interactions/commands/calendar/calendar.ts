import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import i18next from "@gridscout/lang";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import numberEmojis from "@gridscout/lang/emojis/numbers" with { type: "json" };

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("calendar", "View the upcoming or historical F1 calendar");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string
  ) {
    await interaction.deferReply();
    const t = (key: string, options = {}) => i18next.t(key, { lng: locale, ...options });

    // Get the season specified, or current year if not
    const season = interaction.options.getInteger("season") ?? undefined;

    if (season && season > new Date().getFullYear() + 1) {
      return interaction.editReply({
        embeds: [
          errorEmbed("", t("calendar.error", { year: season })),
        ],
      });
    }

    // Fetch data
    const calendar = await api.calendar.get(season);

    if (calendar.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed("", t("calendar.error", { year: season })),
        ],
      });
    }

    const calendarData = calendar.unwrap();
    const races = calendarData.races;

    const lines = races.map((race, index) => {
      const numEmoji =
        numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
        `${index + 1}`;
      const flagEmoji = race.country.alpha3
        ? countryEmojis[race.country.alpha3 as keyof typeof countryEmojis] || ""
        : "";

      const raceName = race.name || "Unknown race";
      const raceDate = new Date(
        `${race.grandPrix.date}T${race.grandPrix.time || "00:00:00Z"}`
      );
      const timestamp = Math.floor(raceDate.getTime() / 1000);

      return `${numEmoji}‎ ‎ ‎ ‎ ${flagEmoji}‎ ‎ **${raceName}** — <t:${timestamp}:f>`;
    });

    // Find the upcoming race
    const now = new Date();
    const upcomingIndex = races.findIndex((race) => {
      const raceDate = new Date(
        `${race.grandPrix.date}T${race.grandPrix.time || "00:00:00Z"}`
      );
      return raceDate > now;
    });

    if (upcomingIndex !== -1) {
      const upcomingRace = races[upcomingIndex];

      const sessions = [
        {
          key: "freePracticeOne",
          label: `> ${t("sessions.freePractice1")}`,
        },
        {
          key: "freePracticeTwo",
          label: `> ${t("sessions.freePractice2")}`,
        },
        {
          key: "freePracticeThree",
          label: `> ${t("sessions.freePractice3")}`,
        },
        {
          key: "sprintQualifying",
          label: `> ${t("sessions.sprintQualifying")}`,
        },
        {
          key: "sprintRace",
          label: `> ${t("sessions.sprintRace")}`,
        },
        {
          key: "qualifying",
          label: `> ${t("sessions.qualifying")}`,
        },
      ];

      const detailsLines = sessions
        .filter(({ key }) => {
          if (!upcomingRace) return false;
          return upcomingRace[key as keyof typeof upcomingRace] !== undefined;
        })
        .map(({ key, label }) => {
          if (!upcomingRace) return "";
          const session = upcomingRace[key as keyof typeof upcomingRace];
          if (!session || typeof session === "string") return "";

          if ("date" in session && "time" in session) {
            const sessionDate = new Date(
              `${session.date}T${session.time || "00:00:00Z"}`
            );
            const timestamp = Math.floor(sessionDate.getTime() / 1000);

            return `${label}: <t:${timestamp}:f>`;
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");

      if (detailsLines) {
        lines.splice(upcomingIndex + 1, 0, `${detailsLines}\n`);
      }
    }

    const title = t("calendar.title", { season: season || new Date().getFullYear() });

    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: t("calendar.author"),
    });

    if (races.some((race) => race.grandPrix.time)) {
      embed.setFooter({
        text: t("calendar.footer"),
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
          .setMinValue(1950)
          .setRequired(false)
      )
      .toJSON();
  }
}
