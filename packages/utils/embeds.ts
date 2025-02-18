import { EmbedBuilder } from "discord.js";

export const primaryEmbed = (
  title: string,
  description: string,
): EmbedBuilder => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(14629177);
};
