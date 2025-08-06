import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { API } from "@gridscout/api";
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
  Locale,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";

const api = new API();

// Map session types to their timing keys and i18n keys
const SESSION_CONFIG = {
  RACE_RESULT: {
    timingKeys: ["race_gap", "race_time"],
    i18nKey: "grandPrix",
  },
  FREE_PRACTICE_1_RESULT: {
    timingKeys: ["free_practice_1_gap", "free_practice_1_time"],
    i18nKey: "freePractice1",
  },
  FREE_PRACTICE_2_RESULT: {
    timingKeys: ["free_practice_2_gap", "free_practice_2_time"],
    i18nKey: "freePractice2",
  },
  FREE_PRACTICE_3_RESULT: {
    timingKeys: ["free_practice_3_gap", "free_practice_3_time"],
    i18nKey: "freePractice3",
  },
  QUALIFYING_RESULT: {
    timingKeys: ["qualifying_gap", "qualifying_time"],
    i18nKey: "qualifying",
  },
  SPRINT_QUALIFYING_RESULT: {
    timingKeys: ["sprint_qualifying_gap", "sprint_qualifying_time"],
    i18nKey: "sprintQualifying",
  },
  SPRINT_RACE_RESULT: {
    timingKeys: ["sprint_race_gap", "sprint_race_time"],
    i18nKey: "sprintRace",
  },
};

export default class Command extends SlashCommand {
  constructor() {
    super("results", "View results for a specific race");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    const season =
      interaction.options.getInteger("season") ?? new Date().getFullYear();
    const raceId = interaction.options.getString("race");

    // If no race ID, return an error
    if (!raceId) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("genericErrorNoId"))],
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

    // Check if the race is in the future
    if (selectedRace && new Date(selectedRace.date) > new Date()) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("results.future"))],
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
      t,
      raceIdNumber,
      initialSessionType ?? "",
      availableSessions,
    );
  }

  private async displaySessionResults(
    interaction: ChatInputCommandInteraction,
    t: (key: string, options?: Record<string, any>) => string,
    raceId: number,
    sessionType: string,
    availableSessions: string[],
  ) {
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

    const embed = this.createResultsEmbed(data, sessionType, t);
    const row = this.createSessionMenu(availableSessions, sessionType, t);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // store the current session type
    let currentSessionType = sessionType;

    // Create collector for session selection
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 1000 * 60 * 14, // 14 minutes
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

      const selectedSessionType = i.values[0];
      await i.deferUpdate();

      // store the new session type
      currentSessionType = selectedSessionType ?? "";

      // Fetch the session results for the selected session
      const result = await api.results.get(raceId, selectedSessionType as any);
      if (result.isErr()) return; // Ignore errors on session change

      // Update the message with the new embed and selectmenu
      const newData = result.unwrap();
      const newEmbed = this.createResultsEmbed(
        newData,
        currentSessionType ?? "",
        t,
      );
      const newRow = this.createSessionMenu(
        availableSessions,
        selectedSessionType ?? "",
        t,
      );

      await interaction.editReply({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on("end", async () => {
      // when collector expires, disable the select menu
      const disabledRow = this.createSessionMenu(
        availableSessions,
        currentSessionType,
        t,
        true,
      );

      await interaction
        .editReply({ components: [disabledRow] })
        .catch(() => {});
    });
  }

  private createResultsEmbed(
    data: any,
    sessionType: string,
    t: (key: string, options?: Record<string, any>) => string,
  ) {
    // Map results to formatted lines
    const lines = data.results
      .map((result: any, index: number) => {
        // get timing info, check if we should include this result (exists)
        const timingInfo = result.retired_reason
          ? t("results.dnf", { reason: result.retired_reason })
          : this.getTimingInfo(result, sessionType, index);

        // skip this result if no timing info or DNF reason
        if (!timingInfo) {
          return null;
        }

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

        const pointsInfo =
          (sessionType === "RACE_RESULT" ||
            sessionType === "SPRINT_RACE_RESULT") &&
          result.points > 0
            ? t("results.points", { count: result.points })
            : "";

        return `${posEmoji}‎ ‎ ‎ ‎ ${driverCountryEmoji ? `${driverCountryEmoji}‎ ‎ ` : ""}**${result.driver.name}**${timingInfo ? ` — ${timingInfo}` : ""}${pointsInfo}`;
      })
      .filter(Boolean) // Remove null entries
      .join("\n");

    // Create the session label for the title using i18n
    const sessionLabel = t(
      `sessions.${SESSION_CONFIG[sessionType as keyof typeof SESSION_CONFIG]?.i18nKey || "defaultLabel"}`,
    );
    const title = t("results.title", {
      season: data.season,
      race: data.name,
      session: sessionLabel,
    });

    return primaryEmbed(title, lines).setAuthor({
      name: t("results.author"),
    });
  }

  private createSessionMenu(
    availableSessions: string[],
    currentSession: string,
    t: (key: string, options?: Record<string, any>) => string,
    disabled = false,
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("session_selector")
      .setPlaceholder(t("results.selectSession"))
      .setDisabled(disabled)
      .addOptions(
        availableSessions
          .filter(
            (session) => SESSION_CONFIG[session as keyof typeof SESSION_CONFIG],
          )
          .map((session) => {
            const i18nKey =
              SESSION_CONFIG[session as keyof typeof SESSION_CONFIG]?.i18nKey ||
              "defaultLabel";
            return new StringSelectMenuOptionBuilder()
              .setLabel(t(`sessions.${i18nKey}`))
              .setValue(session)
              .setDefault(session === currentSession);
          }),
      );

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  }

  private getTimingInfo(
    result: any,
    sessionType: string,
    index: number,
  ): string {
    const config = SESSION_CONFIG[sessionType as keyof typeof SESSION_CONFIG];
    if (!config) return "";

    const keys = config.timingKeys;
    const sessions = result.sessions?.[0] || {};

    // For sprint races and grand prix, show time for P1 and gap for others
    if (sessionType === "SPRINT_RACE_RESULT" || sessionType === "RACE_RESULT") {
      if (index === 0 && keys.length >= 2) {
        return sessions[keys[1] as keyof typeof sessions] || "";
      } else {
        return sessions[keys[0] as keyof typeof sessions] || "";
      }
    }

    // For other sessions, prioritise time over gap
    return (
      sessions[keys[1] as keyof typeof sessions] ||
      sessions[keys[0] as keyof typeof sessions] ||
      ""
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const allRaces = await meilisearch.getAllRaces();

    if (focusedOption.name === "season") {
      const searchTerm = focusedOption.value;
      const years = [...new Set(allRaces.map((race) => race.year))]
        .filter((year) => year.toString().includes(searchTerm))
        .sort((a, b) => b - a)
        .slice(0, 25);

      await interaction.respond(
        years.map((year) => ({
          name: year.toString(),
          value: year,
        })),
      );
    } else if (focusedOption.name === "race") {
      const selectedYear = interaction.options.getInteger("season");

      if (!selectedYear) {
        await interaction.respond([]);
        return;
      }

      // Search races matching the year and any text in the race name
      const searchTerm = `${selectedYear} ${focusedOption.value}`.trim();
      const races = await meilisearch.searchRace(searchTerm, selectedYear);

      await interaction.respond(
        races.slice(0, 25).map((race) => ({
          name: race.name,
          value: race.id.toString(),
        })),
      );
    }
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
      .addIntegerOption((option) =>
        option
          .setName("season")
          .setDescription("The season to view races for")
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
