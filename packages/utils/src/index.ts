import { ColorResolvable, EmbedBuilder, resolveColor } from "discord.js";

export const nationalityToCountry: Record<string, string> = {
  Italian: "Italy",
  British: "United Kingdom",
  Belgian: "Belgium",
  American: "United States of America",
  German: "Germany",
  Dutch: "Netherlands",
  Thai: "Thailand",
  French: "France",
  Spanish: "Spain",
  "New Zealander": "New Zealand",
  Swedish: "Sweden",
  Brazilian: "Brazil",
  Hungarian: "Hungary",
  Danish: "Denmark",
  Monegasque: "Monaco",
  Canadian: "Canada",
  Austrian: "Austria",
  Argentinian: "Argentina",
  "South African": "South Africa",
  Finnish: "Finland",
  Swiss: "Switzerland",
  Portuguese: "Portugal",
  Uruguayan: "Uruguay",
  Venezuelan: "Venezuela",
  Indian: "India",
  Irish: "Ireland",
  Colombian: "Colombia",
  Mexican: "Mexico",
  Japanese: "Japan",
  Indonesian: "Indonesia",
  Czech: "Czech Republic",
  Rhodesian: "Rhodesia",
  Russian: "Russian Federation",
  Polish: "Poland",
  Chinese: "People's Republic of China",
  Liechtensteiner: "Liechtenstein",
  Malaysian: "Malaysia",
  Chilean: "Chile",
  Argentine: "Argentina",
  Australian: "Australia",
};

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

export function formatDate(date: string, time?: string): string {
  if (time) {
    const unixTimestamp = Math.floor(
      new Date(`${date}T${time}`).getTime() / 1000,
    );
    return `<t:${unixTimestamp}:f>`;
  } else {
    const d = new Date(date);
    const day = d.getDate();
    const ordinal = getOrdinal(day);
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    return `${day}${ordinal} ${month} ${year}`;
  }
}

export function getOrdinal(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function calculateAge(date: string): string {
  const dob = new Date(date);
  const now = new Date();
  const diff = now.getTime() - dob.getTime();
  const age = new Date(diff);
  return Math.abs(age.getUTCFullYear() - 1970).toString();
}
