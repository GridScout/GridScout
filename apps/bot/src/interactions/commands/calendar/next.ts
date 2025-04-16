import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
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
  Locale,
  InteractionContextType,
  ApplicationIntegrationType,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("next", "View the upcoming F1 Grand Prix");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    // Get the latest calendar data
    const calendar = await api.calendar.get();

    // if an error occurred, return an error message
    if (calendar.isErr()) {
      return await interaction.editReply({
        embeds: [errorEmbed("", t("genericErrorNoId"))],
      });
    }

    const calendarUnwrapped = calendar.unwrap();
    // Get date in UTC
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    // Get current season races
    const currentYear = now.getFullYear();
    const currentSeasonRaces = calendarUnwrapped.races.filter(
      (gp) => new Date(gp.grandPrix.date).getFullYear() === currentYear,
    );

    // Find the upcoming event
    const upcomingIndex = currentSeasonRaces.findIndex((race) => {
      const raceDate = new Date(
        `${race.grandPrix.date}T${race.grandPrix.time || "00:00:00Z"}`,
      );
      return raceDate >= now;
    });

    // If no upcoming events, show the last race of the season
    let currentIndex =
      upcomingIndex === -1 ? currentSeasonRaces.length - 1 : upcomingIndex;

    // Initial race display
    const initialEmbed = this.createRaceEmbed(
      currentSeasonRaces[currentIndex],
      t,
      currentIndex,
      currentSeasonRaces.length,
      upcomingIndex,
    );
    const initialRow = this.createNavigationRow(
      currentIndex,
      currentSeasonRaces.length,
      false,
      t,
    );

    const message = await interaction.editReply({
      embeds: [initialEmbed],
      components: [initialRow],
    });

    // Create a collector for button interactions
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1000 * 60 * 14, // 14 minutes
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
        t,
        newIndex,
        currentSeasonRaces.length,
        upcomingIndex,
      );
      const row = this.createNavigationRow(
        newIndex,
        currentSeasonRaces.length,
        false,
        t,
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
        t,
      );

      await interaction
        .editReply({ components: [disabledRow] })
        .catch(() => {});
    });
  }

  private createRaceEmbed(
    race: any,
    t: (key: string, options?: Record<string, any>) => string,
    currentIndex = 0,
    totalRaces = 0,
    nextRaceIndex = -1,
  ) {
    // if no race found
    if (!race) {
      return errorEmbed("", t("next.error"));
    }

    const date = new Date(
      `${race.grandPrix.date}T${race.grandPrix.time || "00:00:00Z"}`,
    );

    const isNextUpcomingRace =
      nextRaceIndex >= 0 && currentIndex === nextRaceIndex;

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
        const sessionDate = new Date(
          `${raceSession.date}T${raceSession.time || "00:00:00Z"}`,
        ).getTime();

        // Add the event to the list
        if (isNextUpcomingRace) {
          events.push(
            `${session.label}: <t:${sessionDate / 1000}:f> (<t:${sessionDate / 1000}:R>)`,
          );
        } else {
          events.push(`${session.label}: <t:${sessionDate / 1000}:f>`);
        }
      }
    }

    embed.setDescription(embed.data.description + "\n>>> " + events.join("\n"));

    return embed;
  }

  private createNavigationRow(
    currentIndex: number,
    totalRaces: number,
    disabled = false,
    t: (key: string, options?: Record<string, any>) => string,
  ) {
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
      .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
      ])
      .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
      ])
      .toJSON();
  }
}
