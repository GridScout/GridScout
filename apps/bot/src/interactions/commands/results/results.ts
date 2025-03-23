import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
import i18next from "@gridscout/lang";
import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import numberEmojis from "@gridscout/lang/emojis/numbers" with { type: "json" };
import { meilisearch } from "@gridscout/search";

import {
  type StringSelectMenuInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  AutocompleteInteraction,
  MessageFlags,
} from "discord.js";

const api = new API();

const sessionTimingKeys: Record<string, string[]> = {
  RACE_RESULT: ["race_gap", "race_time"],
  FREE_PRACTICE_1_RESULT: ["free_practice_1_gap", "free_practice_1_time"],
  FREE_PRACTICE_2_RESULT: ["free_practice_2_gap", "free_practice_2_time"],
  FREE_PRACTICE_3_RESULT: ["free_practice_3_gap", "free_practice_3_time"],
  QUALIFYING_RESULT: ["qualifying_gap", "qualifying_time"],
  SPRINT_QUALIFYING_RESULT: ["sprint_qualifying_gap", "sprint_qualifying_time"],
  SPRINT_RACE_RESULT: ["sprint_race_gap", "sprint_race_time"],
};

const sessionTypeToI18nKey: Record<string, string> = {
  FREE_PRACTICE_1_RESULT: "freePractice1",
  FREE_PRACTICE_2_RESULT: "freePractice2",
  FREE_PRACTICE_3_RESULT: "freePractice3",
  QUALIFYING_RESULT: "qualifying",
  SPRINT_QUALIFYING_RESULT: "sprintQualifying",
  SPRINT_RACE_RESULT: "sprintRace",
  RACE_RESULT: "grandPrix",
};

export default class Command extends SlashCommand {
  constructor() {
    super("results", "View results for a specific race");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: string,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    const season =
      interaction.options.getInteger("season") ?? new Date().getFullYear();
    const raceId = interaction.options.getString("race");

    if (!raceId) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("genericError"))],
      });
    }

    const raceIdNumber = parseInt(raceId);

    // Get all races
    const allRaces = await meilisearch.getAllRaces();
    const selectedRace = allRaces.find((race) => race.id === raceIdNumber);

    // Check if the race belongs to the selected season
    if (selectedRace && selectedRace.year !== season) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("results.error"))],
      });
    }

    // Get available session types for this race
    const availableSessionsResult =
      await api.results.getRaceEvents(raceIdNumber);

    if (availableSessionsResult.isErr()) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("results.error"))],
      });
    }

    const availableSessions = availableSessionsResult.unwrap();

    if (availableSessions.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("results.noSessions"))],
      });
    }

    const initialSessionType = availableSessions.includes("RACE_RESULT")
      ? "RACE_RESULT"
      : availableSessions[0];

    await this.displaySessionResults(
      interaction,
      locale,
      raceIdNumber,
      initialSessionType as string,
      availableSessions,
    );
  }

  async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const allRaces = await meilisearch.getAllRaces();

    if (focusedOption.name === "season") {
      const searchTerm = focusedOption.value;
      const years = [...new Set(allRaces.map((race) => race.year))]
        .filter((year) => year.toString().includes(searchTerm))
        .sort((a, b) => b - a)
        .slice(0, 25);

      const options = years.map((year) => ({
        name: year.toString(),
        value: year,
      }));

      await interaction.respond(options);
    } else if (focusedOption.name === "race") {
      const selectedYear = interaction.options.getInteger("season");

      if (!selectedYear) {
        await interaction.respond([]);
        return;
      }

      // Search races matching the year and any text in the race name
      const searchTerm = `${selectedYear} ${focusedOption.value}`.trim();
      const races = await meilisearch.searchRace(searchTerm, selectedYear);

      const options = races.slice(0, 25).map((race) => ({
        name: `${race.name}`,
        value: race.id.toString(),
      }));

      await interaction.respond(options);
    }
  }

  private async displaySessionResults(
    interaction: ChatInputCommandInteraction,
    locale: string,
    raceId: number,
    sessionType: string,
    availableSessions: string[],
  ) {
    const t = this.getTranslation(locale);

    // Fetch the session results from the API
    const result = await api.results.get(raceId, sessionType as any);

    if (result.isErr()) {
      return interaction.editReply({
        embeds: [
          errorEmbed("", t("results.error", { race: raceId.toString() })),
        ],
      });
    }

    const data = result.unwrap();

    const embed = this.createResultsEmbed(data, sessionType, locale);
    const row = this.createSessionMenu(availableSessions, sessionType, locale);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // store the current session type
    let currentSessionType = sessionType;

    // Create collector for session selection
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 900000, // 15mins because token expires after 15m
    });

    collector.on("collect", async (i: StringSelectMenuInteraction) => {
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

      const selectedSessionType = i.values[0] as string;
      await i.deferUpdate();

      // store the new session type
      currentSessionType = selectedSessionType;

      // Fetch the session results for the selected session
      const result = await api.results.get(raceId, selectedSessionType as any);
      if (result.isErr()) return; // Ignore errors on session change

      // Update the message with the new embed and selectmenu
      const newData = result.unwrap();
      const newEmbed = this.createResultsEmbed(
        newData,
        selectedSessionType,
        locale,
      );
      const newRow = this.createSessionMenu(
        availableSessions,
        selectedSessionType,
        locale,
      );

      await interaction.editReply({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on("end", async () => {
      // when collector expires, disable the select menu
      const disabledRow = this.createSessionMenu(
        availableSessions,
        currentSessionType,
        locale,
        true,
      );

      await interaction
        .editReply({ components: [disabledRow] })
        .catch(() => {});
    });
  }

  private createResultsEmbed(data: any, sessionType: string, locale: string) {
    const t = this.getTranslation(locale);

    // Map results to formatted lines
    const lines = data.results.map((result: any, index: number) => {
      const posEmoji =
        numberEmojis[(index + 1).toString() as keyof typeof numberEmojis] ||
        `${index + 1}`;

      // Get driver nationality emoji
      const driverCountryEmoji =
        (result.driver.country_alpha3 &&
          countryEmojis[
            result.driver.country_alpha3 as keyof typeof countryEmojis
          ]) ||
        "";

      // Format timing information
      let timingInfo = result.retired_reason
        ? t("results.dnf", { reason: result.retired_reason })
        : this.getTimingInfo(result, sessionType, index);

      const pointsInfo = this.getPointsInfo(result, sessionType, locale);

      return `${posEmoji}‎ ‎ ‎ ‎ ${driverCountryEmoji ? `${driverCountryEmoji}‎ ‎ ` : ""}**${result.driver.name}**${timingInfo ? ` — ${timingInfo}` : ""}${pointsInfo}`;
    });

    // Create the session label for the title using i18n
    const sessionLabel = this.getSessionLabel(sessionType, locale);
    const title = t("results.title", {
      season: data.season,
      race: data.name,
      session: sessionLabel,
    });

    return primaryEmbed(title, lines.join("\n")).setAuthor({
      name: t("results.author"),
    });
  }

  private getSessionLabel(sessionType: string, locale: string): string {
    const t = this.getTranslation(locale);

    // Get the session type key from the mapping
    const sessionTypeKey = sessionTypeToI18nKey[sessionType];

    // If we have a mapping, use it to get the label from the sessions namespace
    if (sessionTypeKey) {
      return t(`sessions.${sessionTypeKey}`);
    }

    // Fallback to default label
    return t("results.defaultLabel");
  }

  private createSessionMenu(
    availableSessions: string[],
    currentSession: string,
    locale: string,
    disabled = false,
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const t = this.getTranslation(locale);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("session_selector")
      .setPlaceholder(t("results.selectSession"))
      .setDisabled(disabled)
      .addOptions(
        availableSessions
          .filter((session) => this.isValidSessionType(session))
          .map((session) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(this.getSessionLabel(session, locale))
              .setValue(session)
              .setDefault(session === currentSession),
          ),
      );

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  }

  private isValidSessionType(session: string): boolean {
    return Object.keys(sessionTypeToI18nKey).includes(session);
  }

  private getTimingInfo(
    result: any,
    sessionType: string,
    index: number,
  ): string {
    const keys = sessionTimingKeys[sessionType] ?? [];

    // handle sprint races
    if (sessionType === "SPRINT_RACE_RESULT") {
      if (index === 0 && keys.length >= 2) {
        // For P1, show the actual time
        const timeKey = keys[1];
        if (timeKey && result.sessions[0]?.[timeKey]) {
          return result.sessions[0][timeKey];
        }
      } else if (keys.length > 0) {
        // For p2+ show the gap to p1
        const gapKey = keys[0];
        if (gapKey && result.sessions[0]?.[gapKey]) {
          return result.sessions[0][gapKey];
        }
      }
    } else {
      // for all other session types, prioritise showing absolute time values
      if (keys.length >= 2) {
        const timeKey = keys[1];
        if (timeKey && result.sessions[0]?.[timeKey]) {
          return result.sessions[0][timeKey];
        }
      }
    }

    // fallback if no time or gap value is available
    if (keys.length > 0) {
      const gapKey = keys[0];
      if (gapKey && result.sessions[0]?.[gapKey]) {
        return result.sessions[0][gapKey];
      }
    }

    return "";
  }

  private getPointsInfo(
    result: any,
    sessionType: string,
    locale: string,
  ): string {
    if (
      sessionType !== "RACE_RESULT" ||
      result.points === undefined ||
      result.points <= 0
    ) {
      return "";
    }

    const t = this.getTranslation(locale);
    return t("results.points", {
      count: result.points,
    });
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName("season")
          .setDescription("The F1 season")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("race")
          .setDescription("The race to view results for")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .toJSON();
  }
}
