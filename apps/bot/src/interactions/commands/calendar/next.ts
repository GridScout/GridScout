import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import i18next from "@gridscout/lang";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("next", "View the upcoming F1 Grand Prix");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();
    const t = (key: string, options = {}) =>
      i18next.t(key, { lng: locale, ...options });

    // Get the latest calendar data
    const calendar = await api.calendar.get();

    // if an error occurred, return an error message
    if (calendar.isErr()) {
      return await interaction.editReply({
        embeds: [errorEmbed("", t("genericError.description"))],
      });
    }

    const calendarUnwrapped = calendar.unwrap();

    // Get current season races
    const currentYear = new Date().getFullYear();
    const currentSeasonRaces = calendarUnwrapped.races.filter(
      (gp) => new Date(gp.grandPrix.date).getFullYear() === currentYear,
    );

    // Find the upcoming event
    const nextRaceIndex = currentSeasonRaces.findIndex(
      (gp) => new Date(gp.grandPrix.date) > new Date(),
    );

    // If no upcoming events, show the last race of the season
    let currentIndex =
      nextRaceIndex === -1 ? currentSeasonRaces.length - 1 : nextRaceIndex;

    // Initial race display
    const initialEmbed = this.createRaceEmbed(
      currentSeasonRaces[currentIndex],
      locale,
      currentIndex,
      currentSeasonRaces.length,
    );
    const initialRow = this.createNavigationRow(
      currentIndex,
      currentSeasonRaces.length,
      false,
      locale,
    );

    const message = await interaction.editReply({
      embeds: [initialEmbed],
      components: [initialRow],
    });

    // Create a collector for button interactions
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 900000, // 15 minutes collector (token expires after 15 min)
    });

    collector.on("collect", async (i: ButtonInteraction) => {
      // Check if the interaction is from the original user
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          embeds: [
            errorEmbed(
              "",
              t("notYourInteraction", {
                user: interaction.user.toString(),
                command: this.name,
              }),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await i.deferUpdate();

      let newIndex = currentIndex;

      if (i.customId === "prev") {
        newIndex = Math.max(0, currentIndex - 1);
      } else if (i.customId === "next") {
        newIndex = Math.min(currentSeasonRaces.length - 1, currentIndex + 1);
      }

      // Get the race data for the new index
      const race = currentSeasonRaces[newIndex];
      const embed = this.createRaceEmbed(
        race,
        locale,
        newIndex,
        currentSeasonRaces.length,
      );
      const row = this.createNavigationRow(
        newIndex,
        currentSeasonRaces.length,
        false,
        locale,
      );

      // Update the message with the new race data
      await i.editReply({
        embeds: [embed],
        components: [row],
      });

      // Update the current index for future navigation
      currentIndex = newIndex;
    });

    collector.on("end", async () => {
      // Disable buttons when collector expires
      const disabledRow = this.createNavigationRow(
        currentIndex,
        currentSeasonRaces.length,
        true,
        locale,
      );

      await interaction
        .editReply({ components: [disabledRow] })
        .catch(() => {});
    });
  }

  private createRaceEmbed(
    race: any,
    locale: string,
    currentIndex = 0,
    totalRaces = 0,
  ) {
    const t = (key: string, options = {}) =>
      i18next.t(key, { lng: locale, ...options });

    // if no race found
    if (!race) {
      return errorEmbed("", t("next.error.description"));
    }

    const date = new Date(`${race.grandPrix.date}T${race.grandPrix.time}`);

    // Get the country emoji
    const countryEmoji =
      countryEmojis[race.country.alpha3 as keyof typeof countryEmojis];

    const embed = primaryEmbed(
      t("next.title", {
        season: date.getFullYear(),
      }),
      `${countryEmoji} **${race.name}** (<t:${date.getTime() / 1000}:R>)`,
    )
      .setFooter({
        text: t("next.footer", { round: currentIndex + 1, total: totalRaces }),
      })
      .setAuthor({
        name: t("next.author"),
      });

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
        label: `<:chequeredflag:1342900214687600740> **${t("sessions.grandPrix")}**`,
      },
    ];

    const events: string[] = [];

    for (const session of sessions) {
      const raceSession = race[session.key as keyof typeof race];
      if (
        raceSession &&
        typeof raceSession !== "string" &&
        "date" in raceSession &&
        "time" in raceSession
      ) {
        const date = new Date(
          `${raceSession.date}T${raceSession.time}`,
        ).getTime();

        // Add the event to the list
        events.push(`${session.label}: <t:${date / 1000}:f>`);
      }
    }

    embed.setDescription(
      embed.data.description + "\n\n>>> " + events.join("\n"),
    );

    return embed;
  }

  private createNavigationRow(
    currentIndex: number,
    totalRaces: number,
    disabled = false,
    locale = "en",
  ) {
    const t = (key: string, options = {}) =>
      i18next.t(key, { lng: locale, ...options });

    // create back button
    const backButton = new ButtonBuilder()
      .setCustomId("prev")
      .setLabel(t("next.previous"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentIndex <= 0);

    // create next button
    const nextButton = new ButtonBuilder()
      .setCustomId("next")
      .setLabel(t("next.next"))
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || currentIndex >= totalRaces - 1);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      backButton,
      nextButton,
    );
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }
}
