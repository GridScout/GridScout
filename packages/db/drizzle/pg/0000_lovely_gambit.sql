CREATE TABLE "guild_reminder_types" (
	"guild_id" text NOT NULL,
	"reminder_type_id" text NOT NULL,
	CONSTRAINT "guild_reminder_types_guild_id_reminder_type_id_pk" PRIMARY KEY("guild_id","reminder_type_id")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"notifications_channel_id" text,
	"reminder_minutes" integer,
	"reminder_mention_everyone" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "reminder_types" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_notifications" (
	"guild_id" text NOT NULL,
	"reminder_type_id" text NOT NULL,
	"event_id" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sent_notifications_guild_id_reminder_type_id_event_id_pk" PRIMARY KEY("guild_id","reminder_type_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "guild_reminder_types" ADD CONSTRAINT "guild_reminder_types_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_reminder_types" ADD CONSTRAINT "guild_reminder_types_reminder_type_id_reminder_types_id_fk" FOREIGN KEY ("reminder_type_id") REFERENCES "public"."reminder_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_notifications" ADD CONSTRAINT "sent_notifications_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_notifications" ADD CONSTRAINT "sent_notifications_reminder_type_id_reminder_types_id_fk" FOREIGN KEY ("reminder_type_id") REFERENCES "public"."reminder_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guild_reminder_types_pk" ON "guild_reminder_types" USING btree ("guild_id","reminder_type_id");--> statement-breakpoint
CREATE INDEX "sent_notifications_pk" ON "sent_notifications" USING btree ("guild_id","reminder_type_id","event_id");