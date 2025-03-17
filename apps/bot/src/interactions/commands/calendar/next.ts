import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import i18next from "@gridscout/lang";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("next", "View the upcoming F1 Grand Prix");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string
  ) {
    await interaction.deferReply();
    const t = (key: string, options = {}) => i18next.t(key, { lng: locale, ...options });

    // Get the latest calendar data
    const calendar = await api.calendar.get();

    // if an error occurred, return an error message
    if (calendar.isErr()) {
      return await interaction.editReply({
        embeds: [
          errorEmbed("", t("genericError.description")),
        ],
      });
    }

    const calendarUnwrapped = calendar.unwrap();

    // Find the upcoming event
    const nextRace = calendarUnwrapped.races.filter(
      (gp) => new Date(gp.grandPrix.date) > new Date()
    )[0];

    // if no upcoming events, return an error message
    if (!nextRace) {
      return await interaction.editReply({
        embeds: [
          errorEmbed("", t("next.error.description")),
        ],
      });
    }

    const date = new Date(
      `${nextRace.grandPrix.date}T${nextRace.grandPrix.time}`
    ).getTime();

    // Get the country emoji
    const countryEmoji =
      countryEmojis[nextRace.country.alpha3 as keyof typeof countryEmojis];

    const embed = primaryEmbed(
      t("next.title"),
      `${countryEmoji} **${nextRace.name}** (<t:${date / 1000}:R>)`
    );

    const sessions = [
      {
        key: "freePracticeOne",
        label: t("sessions.freePractice1"),
      },
      {
        key: "freePracticeTwo",
        label: t("sessions.freePractice2"),
      },
      {
        key: "freePracticeThree",
        label: t("sessions.freePractice3"),
      },
      {
        key: "sprintQualifying",
        label: t("sessions.sprintQualifying"),
      },
      {
        key: "sprintRace",
        label: t("sessions.sprintRace"),
      },
      {
        key: "qualifying",
        label: t("sessions.qualifying"),
      },
      {
        key: "grandPrix",
        label: `<:chequeredflag:1342900214687600740> **${t("sessions.gp")}**`,
      },
    ];

    const events: string[] = [];

    for (const session of sessions) {
      const raceSession = nextRace[session.key as keyof typeof nextRace];
      if (
        raceSession &&
        typeof raceSession !== "string" &&
        "date" in raceSession &&
        "time" in raceSession
      ) {
        const date = new Date(
          `${raceSession.date}T${raceSession.time}`
        ).getTime();

        // Add the event to the list
        events.push(`${session.label}: <t:${date / 1000}:f>`);
      }
    }

    embed.setDescription(
      embed.data.description + "\n\n>>> " + events.join("\n")
    );

    await interaction.editReply({ embeds: [embed] });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
