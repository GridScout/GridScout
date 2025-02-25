import i18next from "@gridscout/lang";

import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed, formatDate } from "@gridscout/utils";

import { ErgastClient } from "@gridscout/api";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const ergast = new ErgastClient();

export default class Command extends SlashCommand {
  constructor() {
    super("next", "View the upcoming F1 Grand Prix");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();

    const calendar = await ergast.calendar.getCalendar();

    if (calendar.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("commands.next.error.description", { lng: locale }),
          ),
        ],
      });
    }

    const calendarData = calendar.unwrap().races;

    // Find the upcoming race index
    const now = new Date();

    const upcomingIndex = calendarData.findIndex((race) => {
      const { date, time } = race.dates.race;
      const fullDate = time ? `${date}T${time}` : date;
      return new Date(fullDate) > now;
    });

    if (upcomingIndex == -1)
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("commands.next.error.description", { lng: locale }),
          ),
        ],
      });

    const upcomingRace = calendarData[upcomingIndex]!;

    const sessions = [
      {
        key: "firstPractice",
        label: `${i18next.t("sessions.fp1", { lng: locale })}`,
      },
      {
        key: "secondPractice",
        label: `${i18next.t("sessions.fp2", { lng: locale })}`,
      },
      {
        key: "thirdPractice",
        label: `${i18next.t("sessions.fp3", { lng: locale })}`,
      },
      {
        key: "sprintQualifying",
        label: `${i18next.t("sessions.sprint_qualifying", { lng: locale })}`,
      },
      {
        key: "sprint",
        label: `${i18next.t("sessions.sprint_race", { lng: locale })}`,
      },
      {
        key: "qualifying",
        label: `${i18next.t("sessions.qualifying", { lng: locale })}`,
      },
      {
        key: "race",
        label: `<:chequeredflag:1342900214687600740> **${i18next.t("sessions.grand_prix", { lng: locale })}**`,
      },
    ];

    const events: string[] = [];
    const dates: string[] = [];

    sessions.forEach(({ key, label }) => {
      const session =
        upcomingRace.dates[key as keyof typeof upcomingRace.dates];
      if (session) {
        events.push(label);
        dates.push(formatDate(session.date, session.time));
      }
    });

    const flagEmoji = upcomingRace.country
      ? countryEmojis[upcomingRace.country as keyof typeof countryEmojis] || ""
      : "";

    const raceDateTime = `${upcomingRace.dates.race.date}T${upcomingRace.dates.race.time}`;
    const baseDescription = `${flagEmoji} **${upcomingRace.raceName}** (<t:${Math.floor(new Date(raceDateTime).getTime() / 1000)}:R>)`;

    const detailsList = events
      .map((event, idx) => `${event}: ${dates[idx]}`)
      .join("\n");

    const description = `${baseDescription}\n\n>>> ${detailsList}`;

    const embed = primaryEmbed(
      i18next.t("commands.next.title", { lng: locale }),
      description,
    );

    return interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
