import CronJob from "../structures/cronJob.js";

import env from "@gridscout/env";
import { primaryEmbed } from "@gridscout/utils";
import logger from "@gridscout/logger";

import Parser from "rss-parser";
import { REST, Routes, Message } from "discord.js";

const parser = new Parser({
  customFields: {
    item: ["description", ["content:encoded", "content"]],
  },
});

const RSS_URL = "https://www.motorsport.com/rss/f1/news/";

const rest = new REST().setToken(env.DISCORD_TOKEN);

let lastSeen: Date | null = null;

const cleanDescription = (rawDescription?: string): string => {
  if (!rawDescription) return "";

  let description = rawDescription
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "");

  description = description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a class='more'.*?<\/a>/gi, "")
    .replace(
      /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
      "$2 ($1)",
    )
    .replace(/<[^>]*>?/gm, "");

  return description.trim();
};

export default new CronJob(
  "RssNewsNotifier",
  { schedule: "* * * * *", runOnStart: true },
  async () => {
    try {
      const feed = await parser.parseURL(RSS_URL);

      if (!feed || !feed.items || feed.items.length === 0) {
        logger.debug("No feed items found.");
        return;
      }

      // Sort items by publication date (oldest first)
      const sortedItems = feed.items.sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
        const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

      if (!lastSeen) {
        if (sortedItems.length > 0) {
          const lastItem = sortedItems[sortedItems.length - 1];
          lastSeen =
            lastItem && lastItem.pubDate
              ? new Date(lastItem.pubDate)
              : new Date();
        }
        return;
      }

      // filter for posts that are newer than the last seen post.
      const newItems = sortedItems.filter((item) => {
        const itemDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
        return itemDate > lastSeen!;
      });

      if (newItems.length > 0) {
        lastSeen = newItems.reduce((latest, item) => {
          const itemDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
          return itemDate > latest ? itemDate : latest;
        }, lastSeen!);

        newItems.forEach(async (item) => {
          logger.debug(`New post detected: ${item.title} - ${item.link}`);

          const imageUrl = item.enclosure?.url || null;

          const description = cleanDescription(item.description);

          const embed = primaryEmbed(item.title ?? "", `>>> ${description}`)
            .setURL(item.link ?? "")
            .setFooter({ text: "Motorsport.com" })
            .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());

          if (imageUrl) {
            embed.setImage(imageUrl);
          }

          await rest
            .post(Routes.channelMessages(env.NEWS_CHANNEL_ID), {
              body: {
                embeds: [embed],
                components: [
                  {
                    type: 1,
                    components: [
                      {
                        type: 2,
                        style: 5,
                        label: "Read Article",
                        url: item.link,
                      },
                    ],
                  },
                ],
              },
            })
            .then(async (msg: unknown) => {
              await rest.post(
                Routes.channelMessageCrosspost(
                  env.NEWS_CHANNEL_ID,
                  (msg as Message).id,
                ),
              );
            });
        });
      }
    } catch (err) {
      logger.error("Error fetching or processing the RSS feed:");
      logger.error(err);
    }
  },
);
