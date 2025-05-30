import CronJob from "../structures/cronJob.js";

import { getDrizzle } from "@gridscout/db/sqlite";
import db from "@gridscout/db/pg";
import { race, grand_prix, country } from "@gridscout/db/sqlite/schema";
import {
  guilds,
  reminderTypes,
  sentNotifications,
  guildReminderTypes,
} from "@gridscout/db/pg/schema";

import { primaryEmbed } from "@gridscout/utils";
import env from "@gridscout/env";
import logger from "@gridscout/logger";

import countryEmojis from "@gridscout/lang/emojis/countries" with { type: "json" };

import { eq, and, isNotNull, inArray } from "drizzle-orm";
import { REST, Routes } from "discord.js";

const rest = new REST().setToken(env.DISCORD_TOKEN);
let isJobRunning = false;

const MAX_REMINDER_MINUTES = 60;

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
  resetAfter: number;
  bucket: string;
}

const rateLimitCache = new Map<string, RateLimitInfo>();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSessionDateTime(date: string, time: string): Date {
  const sessionDateTime = new Date(date);
  const [hour, minute] = time.split(":").map(Number);
  sessionDateTime.setHours(hour || 0, minute || 0, 0, 0);
  return sessionDateTime;
}

interface Session {
  type: string;
  sessionId: string;
  date: string;
  time: string;
}

function getSessionsForRace(raceEntry: any): Session[] {
  const sessions: Session[] = [
    {
      type: "Grand Prix",
      sessionId: "grandPrix",
      date: raceEntry.date,
      time: raceEntry.time,
    },
    {
      type: "Free Practice 1",
      sessionId: "freePractice1",
      date: raceEntry.free_practice_1_date,
      time: raceEntry.free_practice_1_time,
    },
    {
      type: "Free Practice 2",
      sessionId: "freePractice2",
      date: raceEntry.free_practice_2_date,
      time: raceEntry.free_practice_2_time,
    },
    {
      type: "Free Practice 3",
      sessionId: "freePractice3",
      date: raceEntry.free_practice_3_date,
      time: raceEntry.free_practice_3_time,
    },
    {
      type: "Qualifying",
      sessionId: "qualifying",
      date: raceEntry.qualifying_date,
      time: raceEntry.qualifying_time,
    },
    {
      type: "Sprint Qualifying",
      sessionId: "sprintQualifying",
      date: raceEntry.sprint_qualifying_date,
      time: raceEntry.sprint_qualifying_time,
    },
    {
      type: "Sprint Race",
      sessionId: "sprintRace",
      date: raceEntry.sprint_race_date,
      time: raceEntry.sprint_race_time,
    },
  ];
  return sessions.filter((session) => session.date && session.time);
}

function isSessionWithinTimeWindow(
  date: string,
  time: string,
  windowMinutes: number,
): boolean {
  if (!date || !time) return false;

  const sessionDateTime = parseSessionDateTime(date, time);
  const now = new Date();

  const diffMinutes = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes >= 0 && diffMinutes <= windowMinutes;
}

function hasUpcomingSession(raceEntry: any, windowMinutes: number): boolean {
  const sessions = getSessionsForRace(raceEntry);
  return sessions.some((session) =>
    isSessionWithinTimeWindow(session.date, session.time, windowMinutes),
  );
}

async function sendDiscordNotification(notification: any) {
  const flagEmoji = notification.countryCode
    ? countryEmojis[notification.countryCode as keyof typeof countryEmojis] ||
      ""
    : "";
  const timeCode = `<t:${Math.floor(new Date(notification.sessionDateTime).getTime() / 1000)}:R>`;
  const embed = primaryEmbed(
    `${flagEmoji} ${notification.raceName}`,
    `**${notification.sessionType}** is starting ${timeCode}`,
  ).setAuthor({ name: "Session Reminder" });

  await checkRateLimit(notification.channelId);

  try {
    let content: string | undefined = undefined;
    
    // Handle role mentions
    if (notification.mentionRoleId) {
      if (notification.mentionRoleId === "everyone") {
        content = "@everyone";
      } else {
        content = `<@&${notification.mentionRoleId}>`;
      }
    }

    const response = await rest.post(
      Routes.channelMessages(notification.channelId),
      {
        body: {
          content,
          embeds: [embed],
        },
      },
    );

    updateRateLimitFromResponse(response, notification.channelId);
    return response;
  } catch (error: any) {
    if (error?.status === 429) {
      logger.warn(
        `Rate limited when sending to channel ${notification.channelId}`,
      );
      const retryAfter = error.headers?.get("retry-after") || 5;
      await wait(retryAfter * 1000);
      return sendDiscordNotification(notification);
    }
    logger.error(
      `Error sending notification for guild ${notification.guildId}`,
    );
    logger.error(error);
  }
}

async function checkRateLimit(channelId: string): Promise<void> {
  const rateLimit = rateLimitCache.get(`channel:${channelId}`);

  if (rateLimit && rateLimit.remaining <= 1) {
    const now = Date.now();
    const resetTime = rateLimit.resetAt * 1000;

    if (resetTime > now) {
      const waitTime = resetTime - now + 100; // 100ms buffer
      logger.debug(
        `Rate limit approaching for channel ${channelId}, waiting ${waitTime}ms before sending`,
      );
      await wait(waitTime);
    }
  }
}

function updateRateLimitFromResponse(response: any, channelId: string): void {
  if (!response?.headers) return;

  const headers = response.headers;
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  const resetAfter = headers.get("x-ratelimit-reset-after");
  const bucket = headers.get("x-ratelimit-bucket");

  if (limit && remaining !== undefined && reset && resetAfter && bucket) {
    rateLimitCache.set(`channel:${channelId}`, {
      limit: Number(limit),
      remaining: Number(remaining),
      resetAt: Number(reset),
      resetAfter: Number(resetAfter),
      bucket: bucket,
    });
  }
}

export default new CronJob(
  "SessionNotifications",
  { schedule: "* * * * *", runOnStart: true },
  async () => {
    if (isJobRunning) {
      logger.info("Job is already running, skipping this execution.");
      return;
    }
    isJobRunning = true;

    try {
      const sqliteDb = await getDrizzle();
      const currentYear = new Date().getFullYear();

      // get races for the current season
      const races = await sqliteDb
        .select({
          id: race.id,
          year: race.year,
          round: race.round,
          date: race.date,
          time: race.time,
          grand_prix_id: race.grand_prix_id,
          official_name: race.official_name,
          qualifying_format: race.qualifying_format,
          sprint_qualifying_format: race.sprint_qualifying_format,
          circuit_id: race.circuit_id,
          free_practice_1_date: race.free_practice_1_date,
          free_practice_1_time: race.free_practice_1_time,
          free_practice_2_date: race.free_practice_2_date,
          free_practice_2_time: race.free_practice_2_time,
          free_practice_3_date: race.free_practice_3_date,
          free_practice_3_time: race.free_practice_3_time,
          qualifying_date: race.qualifying_date,
          qualifying_time: race.qualifying_time,
          sprint_qualifying_date: race.sprint_qualifying_date,
          sprint_qualifying_time: race.sprint_qualifying_time,
          sprint_race_date: race.sprint_race_date,
          sprint_race_time: race.sprint_race_time,
          grand_prix_name: grand_prix.name,
          country_id: grand_prix.country_id,
          country_alpha3: country.alpha3_code,
        })
        .from(race)
        .leftJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
        .leftJoin(country, eq(grand_prix.country_id, country.id))
        .where(eq(race.year, currentYear));

      // filter for races with sessions within the reminder window
      const upcomingRaces = races.filter((race) =>
        hasUpcomingSession(race, MAX_REMINDER_MINUTES),
      );

      if (upcomingRaces.length === 0) {
        // logger.info(
        //   "No races within the reminder window, skipping notification checks.",
        // );
        return;
      }

      logger.info(
        `Found ${upcomingRaces.length} race(s) with sessions in the next ${MAX_REMINDER_MINUTES} minutes.`,
      );

      // get guilds with notification settings
      const allGuilds = await db
        .select()
        .from(guilds)
        .where(
          and(
            isNotNull(guilds.notificationsChannelId),
            isNotNull(guilds.reminderMinutes),
          ),
        );

      // map session IDs to reminder type IDs
      const allReminderTypes = await db.select().from(reminderTypes);
      const reminderTypeMap = new Map(
        allReminderTypes.map((rt) => [rt.sessionId, rt.id]),
      );

      // build map of enabled reminders per guild
      const guildEnabledReminders = await db.select().from(guildReminderTypes);
      const enabledRemindersMap = new Map<string, Set<string>>();

      for (const reminder of guildEnabledReminders) {
        if (!enabledRemindersMap.has(reminder.guildId)) {
          enabledRemindersMap.set(reminder.guildId, new Set());
        }
        enabledRemindersMap.get(reminder.guildId)?.add(reminder.reminderTypeId);
      }

      const now = new Date();
      const candidateNotifications: any[] = [];

      for (const raceEntry of upcomingRaces) {
        const sessions = getSessionsForRace(raceEntry);

        for (const session of sessions) {
          const reminderTypeId = reminderTypeMap.get(session.sessionId);
          if (!reminderTypeId) continue;

          const sessionDateTime = parseSessionDateTime(
            session.date,
            session.time,
          );
          if (sessionDateTime <= now) continue;

          const diffMinutes =
            (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);
          const eventId = `${raceEntry.id}-${session.sessionId}`;

          for (const guild of allGuilds) {
            if (!guild.notificationsChannelId || guild.reminderMinutes === null)
              continue;

            const guildEnabledReminderTypes = enabledRemindersMap.get(guild.id);
            if (!guildEnabledReminderTypes?.has(reminderTypeId)) continue;

            if (diffMinutes <= guild.reminderMinutes) {
              candidateNotifications.push({
                guildId: guild.id,
                channelId: guild.notificationsChannelId,
                eventId,
                reminderTypeId,
                raceName: raceEntry.official_name,
                sessionType: session.type,
                sessionDateTime: sessionDateTime.toISOString(),
                countryCode: raceEntry.country_alpha3,
                mentionRoleId: guild.reminderMentionRoleId || null,
              });
            }
          }
        }
      }

      if (candidateNotifications.length === 0) return;

      const guildIds = [
        ...new Set(candidateNotifications.map((n) => n.guildId)),
      ];
      const eventIds = [
        ...new Set(candidateNotifications.map((n) => n.eventId)),
      ];
      const reminderTypeIds = [
        ...new Set(candidateNotifications.map((n) => n.reminderTypeId)),
      ];

      let existingNotifications: any[] = [];
      try {
        existingNotifications = await db
          .select()
          .from(sentNotifications)
          .where(
            and(
              inArray(sentNotifications.guildId, guildIds),
              inArray(sentNotifications.eventId, eventIds),
              inArray(sentNotifications.reminderTypeId, reminderTypeIds),
            ),
          );
      } catch (error) {
        logger.error("Error fetching existing notifications");
        logger.error(error);
      }

      const existingSet = new Set(
        existingNotifications.map(
          (n) => `${n.guildId}-${n.eventId}-${n.reminderTypeId}`,
        ),
      );

      const notificationsToSend = candidateNotifications.filter(
        (n) =>
          !existingSet.has(`${n.guildId}-${n.eventId}-${n.reminderTypeId}`),
      );

      // Group by channel for better rate limit handling
      const notificationsByChannel = new Map<string, any[]>();
      for (const notification of notificationsToSend) {
        const channelNotifications =
          notificationsByChannel.get(notification.channelId) || [];
        channelNotifications.push(notification);
        notificationsByChannel.set(
          notification.channelId,
          channelNotifications,
        );
      }

      // Send notifications channel by channel
      for (const [
        channelId,
        channelNotifications,
      ] of notificationsByChannel.entries()) {
        for (const notification of channelNotifications) {
          let mentionText = "without mention";
          if (notification.mentionRoleId) {
            mentionText = notification.mentionRoleId === "everyone" 
              ? "with @everyone mention" 
              : `with role <@&${notification.mentionRoleId}> mention`;
          }
            
          logger.info(
            `Sending notification for ${notification.raceName} - ${notification.sessionType} to guild ${notification.guildId} ${mentionText}`,
          );

          await sendDiscordNotification(notification);

          try {
            await db.insert(sentNotifications).values({
              guildId: notification.guildId,
              reminderTypeId: notification.reminderTypeId,
              eventId: notification.eventId,
            });
          } catch (error) {
            logger.error(
              `Error recording notification for guild ${notification.guildId}`,
            );
            logger.error(error);
          }

          await wait(250);
        }
      }
    } catch (error) {
      logger.error("Error in SessionNotifications job");
      logger.error(error);
    } finally {
      isJobRunning = false;
    }
  },
);
