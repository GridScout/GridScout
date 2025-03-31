import SlashCommand from "../../../structures/slashCommand.js";

import { errorEmbed, primaryEmbed } from "@gridscout/utils";
import db from "@gridscout/db/pg";
import {
  guilds,
  guildReminderTypes,
  reminderTypes,
} from "@gridscout/db/pg/schema";

import {
  Locale,
  SlashCommandBuilder,
  type Channel,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import { asc, eq } from "drizzle-orm";

export default class Command extends SlashCommand {
  constructor() {
    super("settings", "Configure GridScout for your server", {
      guildOnly: true,
    });
  }

  override async execute(
    interaction: ChatInputCommandInteraction,
    locale: Locale,
  ) {
    const t = this.getTranslation(locale);

    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply();

    switch (subcommand) {
      case "notifications":
        await this.handleNotifications(interaction, t);
        break;
    }
  }

  private async handleNotifications(
    interaction: ChatInputCommandInteraction,
    t: (key: string, options?: object) => string,
  ) {
    const channel = interaction.options.getChannel("channel") as Channel;

    if (!channel || !channel.isTextBased()) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("settings.notifications.invalidChannel"))],
      });
    }

    if (!interaction.guildId) {
      return interaction.editReply({
        embeds: [errorEmbed("", t("genericError"))],
      });
    }

    const [reminderTypesList, guildData, enabledReminderTypes] =
      await Promise.all([
        db.select().from(reminderTypes).orderBy(asc(reminderTypes.id)),
        db.select().from(guilds).where(eq(guilds.id, interaction.guildId)),
        db
          .select()
          .from(guildReminderTypes)
          .where(eq(guildReminderTypes.guildId, interaction.guildId)),
      ]);

    // Keep track if this is a new guild creation
    let isNewGuild = false;

    // if new guild, insert into db and enable all the types
    if (guildData.length === 0) {
      isNewGuild = true;
      await db.transaction(async (trx) => {
        await trx.insert(guilds).values({
          id: interaction.guildId!,
          notificationsChannelId: channel.id,
          reminderMinutes: 15,
          reminderMentionEveryone: false,
        });

        if (reminderTypesList.length > 0) {
          await trx.insert(guildReminderTypes).values(
            reminderTypesList.map((type) => ({
              guildId: interaction.guildId!,
              reminderTypeId: type.id,
            })),
          );
        }
      });
    } else if (guildData[0]?.notificationsChannelId !== channel.id) {
      await db
        .update(guilds)
        .set({
          notificationsChannelId: channel.id,
        })
        .where(eq(guilds.id, interaction.guildId));
    }

    const currentReminderMinutes = guildData[0]?.reminderMinutes ?? 15;
    const selectedMentionEveryone =
      guildData[0]?.reminderMentionEveryone ?? false;

    // build the enabled reminder types array
    let enabledTypes: string[] = [];

    // For a new guild, all reminder types are enabled automatically
    if (isNewGuild) {
      enabledTypes = reminderTypesList.map((type) => type.id);
    } else {
      enabledTypes = enabledReminderTypes.map((type) => type.reminderTypeId);
    }

    // create the embed
    const embed = primaryEmbed(
      "",
      t("settings.notifications.success", {
        channel: channel.toString(),
      }),
    );

    let selectedReminderTypes: string[] = enabledTypes;
    let selectedReminderTime = currentReminderMinutes.toString();
    let mentionEveryone = selectedMentionEveryone;

    const timeOptions = [5, 15, 30, 60];

    const buildComponents = () => {
      const typeRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("reminder_types")
            .setPlaceholder(t("settings.notifications.typesPlaceholder"))
            .setMinValues(0)
            .setMaxValues(reminderTypesList.length)
            .addOptions(
              reminderTypesList.map((type) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(
                    t(`sessions.${type.sessionId}`, {
                      fallback: type.name,
                    }),
                  )
                  .setValue(type.id)
                  .setDefault(selectedReminderTypes.includes(type.id)),
              ),
            ),
        );

      const timeRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("reminder_time")
            .setPlaceholder(t("settings.notifications.reminderPlaceholder"))
            .addOptions(
              timeOptions.map((minutes: number) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(
                    t("settings.notifications.reminderTime", { minutes }),
                  )
                  .setDescription(
                    t(`settings.notifications.reminderTimeDescription`, {
                      minutes: currentReminderMinutes,
                    }),
                  )
                  .setValue(minutes.toString())
                  .setDefault(minutes.toString() === selectedReminderTime),
              ),
            ),
        );

      const mentionEveryoneRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("mention_everyone")
            .setLabel(
              mentionEveryone
                ? t("settings.notifications.mentionEveryone.enabled")
                : t("settings.notifications.mentionEveryone.disabled"),
            )
            .setStyle(
              mentionEveryone ? ButtonStyle.Danger : ButtonStyle.Success,
            ),
        );

      return [typeRow, timeRow, mentionEveryoneRow];
    };

    const response = await interaction.editReply({
      embeds: [embed],
      components: buildComponents(),
    });

    // create collector for the select menus
    const selectCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 1000 * 60 * 14, // 14 minutes
    });

    // create collector for the buttons
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1000 * 60 * 14, // 14 minutes
    });

    selectCollector.on("collect", async (i: StringSelectMenuInteraction) => {
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
          ephemeral: true,
        });
        return;
      }

      await i.deferUpdate();
      const guildId = interaction.guildId;
      if (!guildId) return;

      if (i.customId === "reminder_types") {
        selectedReminderTypes = i.values;

        await db
          .delete(guildReminderTypes)
          .where(eq(guildReminderTypes.guildId, guildId));

        if (i.values.length > 0) {
          const reminderTypeValues = i.values.map((type) => ({
            guildId,
            reminderTypeId: type,
          }));
          await db.insert(guildReminderTypes).values(reminderTypeValues);
        }
      } else if (i.customId === "reminder_time") {
        selectedReminderTime = i.values[0] || "15";

        await db
          .update(guilds)
          .set({
            reminderMinutes: parseInt(selectedReminderTime),
          })
          .where(eq(guilds.id, guildId));
      }

      await interaction.followUp({
        embeds: [primaryEmbed("", t("settings.notifications.updated"))],
        flags: MessageFlags.Ephemeral,
      });

      await interaction.editReply({
        components: buildComponents(),
      });
    });

    buttonCollector.on("collect", async (i: ButtonInteraction) => {
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
          ephemeral: true,
        });
        return;
      }

      await i.deferUpdate();
      const guildId = interaction.guildId;
      if (!guildId) return;

      if (i.customId === "mention_everyone") {
        mentionEveryone = !mentionEveryone;

        await db
          .update(guilds)
          .set({
            reminderMentionEveryone: mentionEveryone,
          })
          .where(eq(guilds.id, guildId));
      }

      await interaction.followUp({
        embeds: [primaryEmbed("", t("settings.notifications.updated"))],
        flags: MessageFlags.Ephemeral,
      });

      await interaction.editReply({
        components: buildComponents(),
      });
    });

    // When collectors end
    const handleCollectorsEnd = async () => {
      if (!selectCollector.ended || !buttonCollector.ended) return;

      // disable components when collectors expire
      const components = buildComponents().map((row) => {
        row.components.forEach((component) => {
          component.setDisabled(true);
        });
        return row;
      });

      await interaction.editReply({
        components,
      });
    };

    selectCollector.on("end", handleCollectorsEnd);
    buttonCollector.on("end", handleCollectorsEnd);
  }

  override async build() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("notifications")
          .setDescription("Configure notifications for your server")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("The channel to send reminders in")
              .setRequired(true),
          ),
      )
      .toJSON();
  }
}
