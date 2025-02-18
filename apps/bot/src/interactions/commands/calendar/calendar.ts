import SlashCommand from "@/bot/structures/slashCommand";
import countryEmojis from "@/lang/emojis/countries.json";
import numberEmojis from "@/lang/emojis/numbers.json";
import messages from "@/lang/locales/en.json";

import { ErgastClient } from "@/api";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { primaryEmbed } from "@/utils";

const ergast = new ErgastClient();

export default class Command extends SlashCommand {
  constructor() {
    super("calendar", "View the upcoming or historical F1 calendar");
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    // Grab the season specified, or current year if not
    const season =
      interaction.options.getString("season") ??
      new Date().getFullYear().toString();

    // Fetch data
    const calendar = await ergast.calendar.getCalendar(season);

    if (calendar.isErr()) {
      return interaction.editReply(messages.calendar.error);
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

      return `${numEmoji}‎ ‎ ${flagEmoji}‎ ‎ **${raceName}** — ${formattedDate}`;
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
        { key: "firstPractice", label: "> **FP1**" },
        { key: "secondPractice", label: "> **FP2**" },
        { key: "thirdPractice", label: "> **FP3**" },
        { key: "sprintQualifying", label: "> **Sprint Qualifying**" },
        { key: "sprint", label: "> **Sprint**" },
        { key: "qualifying", label: "> **Qualifying**" },
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

    const title = messages.calendar.seasonTitle.replace("{season}", season);
    const embed = primaryEmbed(title, lines.join("\n")).setAuthor({
      name: messages.calendar.title,
    });

    if (races.some((race) => race.dates.race.time)) {
      embed.setFooter({
        text: messages.calendar.footer,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("season")
          .setDescription("The season to lookup")
          // TODO: Add autocomplete for available seasons
          .setRequired(false),
      )
      .toJSON();
  }
}

function formatDate(date: string, time?: string): string {
  if (time) {
    const unixTimestamp = Math.floor(
      new Date(`${date}T${time}`).getTime() / 1000,
    );
    return `<t:${unixTimestamp}:f>`;
  }
  return date;
}
