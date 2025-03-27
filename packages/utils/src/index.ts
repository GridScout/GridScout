import { type ColorResolvable, EmbedBuilder, resolveColor } from "discord.js";

export const primaryEmbed = (
  title: string,
  description: string,
  color: ColorResolvable = resolveColor("#df3939"),
) => {
  return new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(description || null)
    .setColor(color);
};

export const errorEmbed = (
  title: string,
  description: string,
  color: ColorResolvable = resolveColor("#843438"),
) => {
  return new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(description || null)
    .setColor(color);
};
