import i18next from "@gridscout/lang";

import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { API } from "@gridscout/api";

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

    // Get the latest calendar data
    const calendar = await api.calendar.get();

    if (calendar.isErr()) {
      return await interaction.editReply({
        embeds: [
          errorEmbed(
            "",
            i18next.t("genericError.description", { lng: locale })
          ),
        ],
      });
    }

    const calendarUnwrapped = calendar.unwrap();

    const nextRace = calendarUnwrapped.races.filter(
      (gp) => new Date(gp.grandPrix.date) > new Date()
    )[0];

    // if no upcoming events, return an error message
    if (!nextRace) {
      return await interaction.editReply({
        embeds: [
          errorEmbed("", i18next.t("next.error.description", { lng: locale })),
        ],
      });
    }

    const date = new Date(
      `${nextRace.grandPrix.date}T${nextRace.grandPrix.time}`
    ).getTime();

    const countryEmoji =
      countryEmojis[nextRace.country.alpha3 as keyof typeof countryEmojis];

    const embed = primaryEmbed(
      i18next.t("next.title", { lng: locale }),
      `${countryEmoji} **${nextRace.name}** (<t:${date / 1000}:R>)`
    );

    const sessions = [
      {
        key: "freePracticeOne",
        label: i18next.t("sessions.fp1", { lng: locale }),
      },
      {
        key: "freePracticeTwo",
        label: i18next.t("sessions.fp2", { lng: locale }),
      },
      {
        key: "freePracticeThree",
        label: i18next.t("sessions.fp3", { lng: locale }),
      },
      {
        key: "sprintQualifying",
        label: i18next.t("sessions.sprintQualifying", { lng: locale }),
      },
      {
        key: "sprintRace",
        label: i18next.t("sessions.sprintRace", { lng: locale }),
      },
      {
        key: "qualifying",
        label: i18next.t("sessions.qualifying", { lng: locale }),
      },
      {
        key: "grandPrix",
        label: `<:chequeredflag:1342900214687600740> **${i18next.t("sessions.grandPrix", { lng: locale })}**`,
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

        events.push(`${session.label}: <t:${date / 1000}:f>`);
      }
    }

    embed.setDescription(
      embed.data.description + "\n\n>>> " + events.join("\n")
    );

    await interaction.editReply({ embeds: [embed] });
    console.log(nextRace);
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
