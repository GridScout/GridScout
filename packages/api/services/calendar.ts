import { ErgastClient } from "../utils/request";
import { Calendar, ERace, ERacesResponse, RaceDates } from "@/types";
import { Result, err, ok } from "@sapphire/result";

import countries from "i18n-iso-countries";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export class CalendarService {
  constructor(private readonly client: ErgastClient) {}

  /**
   * Fetches the F1 calendar for a given season.
   * If no season is provided, defaults to the current season.
   *
   * @param season - The season (year) to fetch the calendar for.
   * @returns {Promise<Result<Calendar, string>>} The calendar data.
   */
  async getCalendar(season?: string): Promise<Result<Calendar, string>> {
    try {
      const endpoint = season ? `${season}/races` : "current/races";
      const response = await this.client.fetch<ERacesResponse>(endpoint);

      if (
        !response ||
        !response.MRData?.RaceTable?.Races ||
        response.MRData.RaceTable.Races.length === 0
      ) {
        return err("No races found");
      }

      const races = response.MRData.RaceTable.Races.map((race: ERace) => {
        const dates: RaceDates = {
          firstPractice: race.FirstPractice
            ? { date: race.FirstPractice.date, time: race.FirstPractice.time }
            : undefined,
          secondPractice: race.SecondPractice
            ? { date: race.SecondPractice.date, time: race.SecondPractice.time }
            : undefined,
          thirdPractice: race.ThirdPractice
            ? { date: race.ThirdPractice.date, time: race.ThirdPractice.time }
            : undefined,
          qualifying: race.Qualifying
            ? { date: race.Qualifying.date, time: race.Qualifying.time }
            : undefined,
          sprintQualifying: race.SprintQualifying
            ? {
                date: race.SprintQualifying.date,
                time: race.SprintQualifying.time,
              }
            : undefined,
          sprint: race.Sprint
            ? { date: race.Sprint.date, time: race.Sprint.time }
            : undefined,
          race: { date: race.date, time: race.time },
        };

        return {
          raceName: race.raceName,
          country: this.normaliseCountry(race.Circuit.Location.country) || null,
          dates,
        };
      });

      const calendar: Calendar = {
        season: response.MRData.RaceTable.season || season || "",
        races,
      };

      return ok(calendar);
    } catch (error) {
      return err(`Error fetching calendar: ${error}`);
    }
  }

  /**
   * Normalise country to i18n-iso-countries format
   * @param country - The country to normalise
   * @returns {string} The normalised country
   */
  private normaliseCountry(country: string): string | null {
    const countryCode = countries.getAlpha2Code(country, "en");
    return countryCode ? countries.getName(countryCode, "en") || null : null;
  }
}
