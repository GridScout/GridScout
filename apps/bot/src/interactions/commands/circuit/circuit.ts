import SlashCommand from "../../../structures/slashCommand.js";

import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };
import otherEmojis from "@gridscout/lang/emojis/other" with { type: "json" };
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  Locale,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  InteractionContextType,
  AutocompleteInteraction,
} from "discord.js";
import { meilisearch } from "@gridscout/search";
import { API } from "@gridscout/api";
import { primaryEmbed } from "@gridscout/utils";

const api = new API();

export default class Command extends SlashCommand {
  constructor() {
    super("circuit", "View information about a circuit");
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    await interaction.deferReply();
    const t = this.getTranslation(locale);

    let circuitId = interaction.options.getString("circuit", true);

    // If no circuit ID, return an error
    if (!circuitId) {
      return interaction.editReply({
        content: t("genericErrorNoId"),
      });
    }

    const circuitSearch = await meilisearch.searchCircuitByName(circuitId);

    if (circuitSearch.length > 0) {
      circuitId = circuitSearch[0]?.id ?? circuitId;
    } else {
      return interaction.editReply({
        content: t("circuit.error"),
      });
    }

    // Get circuit from API
    const result = await api.circuit.get(circuitId);

    // If no circuit found, return an error
    if (result.isErr()) {
      await interaction.editReply({
        content: t("circuit.error"),
      });
      return;
    }

    const circuit = result.unwrap();

    const embed = primaryEmbed(`${circuit.name}`, "");

    let countryEmoji =
      countryEmojis[circuit.country.alpha3 as keyof typeof countryEmojis];

    embed.addFields({
      name: t("circuit.generalInformation"),
      value: [
        `${t("circuit.name", { name: circuit.name })}`,
        `${t("circuit.location", { locationEmoji: countryEmoji, placeName: circuit.location, countryName: circuit.country.name })}`,
        `${t("circuit.type", { type: t(`circuit.types.${circuit.type}`) })}`,
        `${t("circuit.direction", { direction: t(`circuit.types.${circuit.direction}`) })}`,
      ].join("\n"),
      inline: true,
    });

    embed.addFields({
      name: "‎ ",
      value: [
        `${t("circuit.length", { length: circuit.length, lengthMiles: (circuit.length * 0.621371).toFixed(3) })}`,
        `${t("circuit.turns", { turns: circuit.turns })}`,
        `${t("circuit.racesHeld", { racesHeld: circuit.total_races_held })}`,
        circuit.first_gp_year
          ? `${t("circuit.firstGp", { year: circuit.first_gp_year })}`
          : t("circuit.notAvailable"),
      ].join("\n"),
      inline: true,
    });

    if (circuit.lapRecord) {
      let countryEmoji =
        countryEmojis[
          circuit.lapRecord.driver.country_alpha3 as keyof typeof countryEmojis
        ] || "";
      embed.addFields({
        name: t("circuit.lapRecord"),
        value: `${countryEmoji} **${circuit.lapRecord.driver.name}** – \`${circuit.lapRecord.time}\` (${circuit.lapRecord.year})`,
        inline: false,
      });
    }

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(t("circuit.openMap"))
        .setStyle(ButtonStyle.Link)
        .setEmoji(otherEmojis["map"])
        .setURL(circuit.map_url),
    );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    const circuits = await meilisearch.searchCircuitByName(focusedValue);

    await interaction.respond(
      circuits.map((circuit) => ({
        name: circuit.name,
        value: circuit.id,
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
          .setName("circuit")
          .setDescription("The circuit to lookup")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .toJSON();
  }
}
