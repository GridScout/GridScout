import SlashCommand from "../../../structures/slashCommand.js";

import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import constructorEmojis from "@gridscout/lang/emojis/teams" with { type: "json" };
import teamColours from "@gridscout/lang/emojis/colours" with { type: "json" };
import { API } from "@gridscout/api";
import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import { meilisearch } from "@gridscout/search";

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type ColorResolvable,
  Locale,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("constructor", "View information about a constructor");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    let constructorId = interaction.options.getString("team", true);

    // If no constructor ID, return an error
    if (!constructorId) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("genericErrorNoId"))],
      });
    }

    // Search for constructor on meilisearch
    const constructorSearch =
      await meilisearch.searchConstructorByName(constructorId);

    if (constructorSearch.length > 0) {
      constructorId = constructorSearch[0]?.id ?? constructorId;
    } else {
      return interaction.editReply({
        embeds: [errorEmbed("", t("constructor.error"))],
      });
    }

    // Get constructor from API
    const result = await api.team.get(constructorId);

    // If no constructor found, return an error
    if (result.isErr()) {
      await interaction.editReply({
        embeds: [errorEmbed("", t("constructor.error"))],
      });
      return;
    }

    const team = result.unwrap();

    const embed = primaryEmbed(
      `${constructorEmojis[team.id as keyof typeof constructorEmojis] || ""} ${team.name}`,
      `${t("constructor.name", { name: team.fullName })}\n` +
        `${t("constructor.nationality", { flag: team.nationality.alpha3 ? countryEmojis[team.nationality.alpha3 as keyof typeof countryEmojis] || "" : "", nationality: team.nationality.demonym || "" })}`,
    );

    // Set team color if available
    if (team.id && team.id in teamColours) {
      const teamColor = teamColours[team.id as keyof typeof teamColours];
      embed.setColor(teamColor as ColorResolvable);
    }

    if (team.currentEngine) {
      embed.addFields({
        name: t("constructor.engine"),
        value: `${team.currentEngine.manufacturer} ${team.currentEngine.country ? countryEmojis[team.currentEngine.country as keyof typeof countryEmojis] || "" : ""} ${team.currentEngine.name}\n${[
          team.currentEngine.capacity
            ? `${team.currentEngine.capacity}cc`
            : null,
          team.currentEngine.configuration,
          this.convertAspiration(team.currentEngine.aspiration || ""),
        ]
          .filter(Boolean)
          .join(" ")}`,
        inline: true,
      });
    }

    if (team.currentChassis) {
      embed.addFields({
        name: t("constructor.chassis"),
        value: `${team.currentChassis.name} (${team.currentChassis.fullName})`,
        inline: true,
      });
    }

    if (team.currentDrivers.length > 0) {
      embed.addFields({
        name: t("constructor.currentDrivers"),
        value: team.currentDrivers
          .map(
            (driver) =>
              `${driver.nationality ? countryEmojis[driver.nationality as keyof typeof countryEmojis] || "" : ""} ${
                driver.name
              }_${driver.number ? ` #${driver.number}` : ""}_`,
          )
          .join("\n"),
        inline: false,
      });
    }

    embed.addFields(
      {
        name: t("constructor.statistics"),
        value: [
          `${t("constructor.worldChampionships", { amount: team.statistics.worldChampionships })}`,
          `${t("constructor.racesEntered", { amount: team.statistics.racesEntered })}`,
          `${t("constructor.totalRaceWins", { amount: team.statistics.totalRaceWins })}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "_ _",
        value: [
          `${t("constructor.podiums", { amount: team.statistics.podiums })}`,
          `${t("constructor.points", { amount: team.statistics.points })}`,
          `${t("constructor.fastestLaps", { amount: team.statistics.fastestLaps })}`,
        ].join("\n"),
        inline: true,
      },
    );

    if (team.recentRaces.length > 0 && team.currentDrivers.length > 0) {
      const lastRace = team.recentRaces[0];
      if (lastRace) {
        const driversResults = team.currentDrivers
          .map((driver) => {
            // Find the result for this driver
            const driverResult = lastRace.results.find(
              (result) => result.driverId === driver.id,
            );

            // Format the position text
            let positionText = "N/A";
            if (driverResult) {
              if (!isNaN(Number(driverResult.position))) {
                positionText = `${t("constructor.finished")} ${driverResult.position}`;
              } else {
                positionText = driverResult.position;
              }
            }

            // Format with ANSI colors for Discord
            return [
              `\u001b[1;34m${lastRace.name}\u001b[0m \u001b[2;33m${lastRace.date}\u001b[0m`,
              ` \u001b[2;30m├\u001b[0m 🏎️ \u001b[38;5;203m${driver.name}\u001b[0m`,
              ` \u001b[2;30m└\u001b[0m 🏁 \u001b[2;36m${t("constructor.position", { pos: positionText })}\u001b[0m`,
            ].join("\n");
          })
          .join("\n\n");

        if (driversResults) {
          embed.addFields({
            name: t("constructor.recentResults"),
            value: `\`\`\`ansi\n${driversResults}\`\`\``,
          });
        }
      }
    }

    await interaction.editReply({ embeds: [embed] });
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    const constructors =
      await meilisearch.searchConstructorByName(focusedValue);

    await interaction.respond(
      constructors.map((constructor) => ({
        name: constructor.name,
        value: constructor.id,
      })),
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
      .addStringOption((option) =>
        option
          .setName("team")
          .setDescription("The constructor to lookup")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .toJSON();
  }

  private convertAspiration(aspiration: string) {
    return aspiration
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
