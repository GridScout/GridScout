import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  reminderMinutes: integer("reminder_minutes").notNull(),
});

export const reminderTypes = pgTable("reminder_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const guildReminderTypes = pgTable(
  "guild_reminder_types",
  {
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    reminderTypeId: text("reminder_type_id")
      .notNull()
      .references(() => reminderTypes.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.reminderTypeId] }),
    idx: index("guild_reminder_types_pk").on(
      table.guildId,
      table.reminderTypeId,
    ),
  }),
);

export const sentNotifications = pgTable(
  "sent_notifications",
  {
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    reminderTypeId: text("reminder_type_id")
      .notNull()
      .references(() => reminderTypes.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.guildId, table.reminderTypeId, table.eventId],
    }),
    idx: index("sent_notifications_pk").on(
      table.guildId,
      table.reminderTypeId,
      table.eventId,
    ),
  }),
);

export const guildRelations = relations(guilds, ({ many }) => ({
  enabledReminders: many(guildReminderTypes),
}));

export const reminderTypesRelations = relations(reminderTypes, ({ many }) => ({
  guilds: many(guildReminderTypes),
}));

export const guildReminderTypesRelations = relations(
  guildReminderTypes,
  ({ one }) => ({
    guild: one(guilds, {
      fields: [guildReminderTypes.guildId],
      references: [guilds.id],
    }),
    reminderType: one(reminderTypes, {
      fields: [guildReminderTypes.reminderTypeId],
      references: [reminderTypes.id],
    }),
  }),
);

export const sentNotificationsRelations = relations(
  sentNotifications,
  ({ one }) => ({
    guild: one(guilds, {
      fields: [sentNotifications.guildId],
      references: [guilds.id],
    }),
    reminderType: one(reminderTypes, {
      fields: [sentNotifications.reminderTypeId],
      references: [reminderTypes.id],
    }),
  }),
);
