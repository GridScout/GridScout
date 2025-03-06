import type { API } from "../index.js";

import type { Driver } from "@gridscout/types";

import db from "@gridscout/db";
import {
  driver,
  country,
  race,
  race_data,
  grand_prix,
  season_entrant_driver,
  constructor,
} from "@gridscout/db/schema";

import { ok, err, type Result } from "@sapphire/result";
import { eq, and, desc } from "drizzle-orm";

export class DriverService {
  constructor(private readonly client: API) {}

  async get(id: string): Promise<Result<Driver, string>> {
    const idSanitised = this.client.sanitiseInput(id);

    const driverData = await db
      .select({
        id: driver.id,
        name: driver.name,
        abbreviation: driver.abbreviation,
        permanentNumber: driver.permanent_number,
        dateOfBirth: driver.date_of_birth,
        dateOfDeath: driver.date_of_death,
        placeOfBirth: driver.place_of_birth,

        countryOfBirth: {
          name: country.name,
          alpha3: country.alpha3_code,
        },

        statistics: {
          worldChampionships: driver.total_championship_wins,
          highestRaceFinish: driver.best_race_result,
          highestGridPosition: driver.best_starting_grid_position,
          racesEntered: driver.total_race_entries,
          podiums: driver.total_podiums,
          points: driver.total_points,
          fastestLaps: driver.total_fastest_laps,
          grandSlams: driver.total_grand_slams,
        },
      })
      .from(driver)
      .innerJoin(country, eq(driver.country_of_birth_country_id, country.id))
      .where(eq(driver.id, idSanitised));

    if (!driverData.length) return err("No driver found");

    const recentRaces = await db
      .select({
        id: race.id,
        name: grand_prix.full_name,
        date: race.date,
        country: {
          name: country.name,
          alpha3: country.alpha3_code,
        },
        position: race_data.position_text,
        raceGap: race_data.race_gap || "0",
      })
      .from(race_data)
      .innerJoin(race, eq(race_data.race_id, race.id))
      .innerJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
      .innerJoin(country, eq(grand_prix.country_id, country.id))
      .where(
        and(
          eq(race_data.driver_id, idSanitised),
          eq(race_data.type, "RACE_RESULT")
        )
      )
      .orderBy(desc(race.date))
      .limit(3);

    const latestConstructor = await db
      .select({
        id: constructor.id,
        name: constructor.name,
      })
      .from(season_entrant_driver)
      .innerJoin(
        constructor,
        eq(season_entrant_driver.constructor_id, constructor.id)
      )
      .where(eq(season_entrant_driver.driver_id, idSanitised))
      .orderBy(desc(season_entrant_driver.year))
      .limit(1);

    const combinedData = {
      ...driverData[0],
      team: latestConstructor[0],
      recentRaces,
    } as unknown as Driver;

    return ok(combinedData);
  }
}
