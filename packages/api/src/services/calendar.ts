import type { Calendar } from "@gridscout/types";
import type { API } from "../index.js";

import { ok, err, type Result } from "@sapphire/result";
import { eq } from "drizzle-orm";
import { country, grand_prix, race } from "@gridscout/db/sqlite/schema";

export class CalendarService {
  constructor(private readonly client: API) {}

  async get(year?: number): Promise<Result<Calendar, string>> {
    const seasonYear = year || new Date().getFullYear();
    if (isNaN(seasonYear)) return err(`Invalid season year: ${year}`);

    const db = await this.client.db();

    const races = await db
      .select({
        id: race.id,
        name: grand_prix.full_name,
        date: race.date,
        time: race.time,
        countryName: country.name,
        countryCode: country.alpha3_code,
        round: race.round,

        fp1Date: race.free_practice_1_date,
        fp1Time: race.free_practice_1_time,
        fp2Date: race.free_practice_2_date,
        fp2Time: race.free_practice_2_time,
        fp3Date: race.free_practice_3_date,
        fp3Time: race.free_practice_3_time,
        qualifyingDate: race.qualifying_date,
        qualifyingTime: race.qualifying_time,
        sprintQualifyingDate: race.sprint_qualifying_date,
        sprintQualifyingTime: race.sprint_qualifying_time,
        sprintRaceDate: race.sprint_race_date,
        sprintRaceTime: race.sprint_race_time,
      })
      .from(race)
      .innerJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
      .innerJoin(country, eq(grand_prix.country_id, country.id))
      .where(eq(race.year, seasonYear))
      .orderBy(race.round);

    if (!races || races.length === 0) {
      return err(`No races found for season ${seasonYear}`);
    }

    const calendarRaces = races.map((race) => {
      return {
        id: String(race.id),
        name: race.name,
        country: {
          name: race.countryName,
          alpha3: race.countryCode,
        },
        freePracticeOne:
          race.fp1Date && race.fp1Time
            ? { date: race.fp1Date.toString(), time: race.fp1Time }
            : undefined,
        freePracticeTwo:
          race.fp2Date && race.fp2Time
            ? { date: race.fp2Date.toString(), time: race.fp2Time }
            : undefined,
        freePracticeThree:
          race.fp3Date && race.fp3Time
            ? { date: race.fp3Date.toString(), time: race.fp3Time }
            : undefined,
        sprintQualifying:
          race.sprintQualifyingDate && race.sprintQualifyingTime
            ? {
                date: race.sprintQualifyingDate.toString(),
                time: race.sprintQualifyingTime,
              }
            : undefined,
        sprintRace:
          race.sprintRaceDate && race.sprintRaceTime
            ? {
                date: race.sprintRaceDate.toString(),
                time: race.sprintRaceTime,
              }
            : undefined,
        qualifying: {
          date: race.qualifyingDate?.toString() || race.date.toString(),
          time: race.qualifyingTime || "",
        },
        grandPrix: {
          date: race.date.toString(),
          time: race.time || "",
        },
      };
    });

    // Return the calendar data
    return ok({
      season: seasonYear,
      races: calendarRaces,
    });
  }
}
