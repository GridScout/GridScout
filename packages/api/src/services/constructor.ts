import type { API } from "../index.js";
import type { Constructor } from "@gridscout/types";

import {
  constructor,
  country,
  race,
  race_data,
  grand_prix,
  season_entrant_driver,
  driver,
  season_entrant_chassis,
  chassis,
  engine_manufacturer,
  season_entrant_engine,
  engine,
} from "@gridscout/db/sqlite/schema";

import { ok, err, type Result } from "@sapphire/result";
import { eq, and, desc } from "drizzle-orm";

export class ConstructorService {
  constructor(private readonly client: API) {}

  async get(id: string): Promise<Result<Constructor, string>> {
    // Sanitise the input
    const idSanitised = this.client.sanitiseInput(id);

    const db = await this.client.db();

    // Fetch constructor data from database
    const constructorData = await db
      .select({
        id: constructor.id,
        name: constructor.name,
        fullName: constructor.full_name,
        nationality: {
          id: country.id,
          alpha3: country.alpha3_code,
          demonym: country.demonym,
        },
        statistics: {
          worldChampionships: constructor.total_championship_wins,
          racesEntered: constructor.total_race_entries,
          totalRaceWins: constructor.total_race_wins,
          podiums: constructor.total_podiums,
          points: constructor.total_points,
          poles: constructor.total_pole_positions,
          fastestLaps: constructor.total_fastest_laps,
        },
      })
      .from(constructor)
      .innerJoin(country, eq(constructor.country_id, country.id))
      .where(eq(constructor.id, idSanitised));

    // If there was no data found, constructor is not in database, return err
    if (constructorData.length == 0) return err("No constructor found");

    // Fetch the current drivers for the constructor
    const currentYear = new Date().getFullYear();
    const currentDrivers = await db
      .select({
        id: driver.id,
        name: driver.name,
        number: driver.permanent_number,
        nationality: country.alpha3_code,
      })
      .from(season_entrant_driver)
      .innerJoin(driver, eq(season_entrant_driver.driver_id, driver.id))
      .innerJoin(country, eq(driver.nationality_country_id, country.id))
      .where(
        and(
          eq(season_entrant_driver.constructor_id, idSanitised),
          eq(season_entrant_driver.year, currentYear),
        ),
      );

    // Fetch current chassis and engine information
    const chassisData = await db
      .select({
        chassis: {
          name: chassis.name,
          fullName: chassis.full_name,
        },
        engine: {
          name: engine.name,
          fullName: engine.full_name,
          manufacturer: engine_manufacturer.name,
          country: country.alpha3_code,
          capacity: engine.capacity,
          configuration: engine.configuration,
          aspiration: engine.aspiration,
        },
      })
      .from(season_entrant_chassis)
      .innerJoin(chassis, eq(season_entrant_chassis.chassis_id, chassis.id))
      .innerJoin(
        season_entrant_engine,
        and(
          eq(
            season_entrant_engine.constructor_id,
            season_entrant_chassis.constructor_id,
          ),
          eq(season_entrant_engine.year, season_entrant_chassis.year),
        ),
      )
      .innerJoin(engine, eq(season_entrant_engine.engine_id, engine.id))
      .innerJoin(
        engine_manufacturer,
        eq(engine.engine_manufacturer_id, engine_manufacturer.id),
      )
      .innerJoin(country, eq(engine_manufacturer.country_id, country.id))
      .where(
        and(
          eq(season_entrant_chassis.constructor_id, idSanitised),
          eq(season_entrant_chassis.year, currentYear),
        ),
      )
      .limit(1);

    // Fetch the 2 most recent races for the constructor
    const recentRaces = await db
      .select({
        id: race.id,
        name: grand_prix.full_name,
        date: race.date,
        country: {
          name: country.name,
          alpha3: country.alpha3_code,
        },
        driverId: race_data.driver_id,
        position: race_data.position_text,
        raceGap: race_data.race_gap || null,
        raceTime: race_data.race_time || null,
      })
      .from(race_data)
      .innerJoin(race, eq(race_data.race_id, race.id))
      .innerJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
      .innerJoin(country, eq(grand_prix.country_id, country.id))
      .where(
        and(
          eq(race_data.constructor_id, idSanitised),
          eq(race_data.type, "RACE_RESULT"),
        ),
      )
      .orderBy(desc(race.date))
      .limit(4); // make sure t here is enough data to work with

    const groupedRaces = recentRaces.reduce(
      (acc, race) => {
        const date = race.date;
        if (!acc[date]) {
          acc[date] = {
            id: race.id,
            name: race.name,
            date: race.date,
            country: race.country,
            results: [],
          };
        }
        acc[date].results.push({
          driverId: race.driverId,
          position: race.position,
          raceGap: race.raceGap,
          raceTime: race.raceTime,
        });
        return acc;
      },
      {} as Record<string, any>,
    );

    const formattedRaces = Object.values(groupedRaces)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);

    const combinedData = {
      ...constructorData[0],
      currentDrivers,
      recentRaces: formattedRaces,
      currentChassis: chassisData[0]?.chassis || null,
      currentEngine: chassisData[0]?.engine || null,
    } as unknown as Constructor;

    return ok(combinedData);
  }
}
