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
    // Sanitise the input
    const idSanitised = this.client.sanitiseInput(id);

    // Fetch driver data from database
    const driverData = await db
      .select({
        id: driver.id,
        name: driver.name,
        abbreviation: driver.abbreviation,
        permanentNumber: driver.permanent_number,
        dateOfBirth: driver.date_of_birth,
        dateOfDeath: driver.date_of_death,
        nationality: {
          id: country.id,
          alpha3: country.alpha3_code,
          demonym: country.demonym,
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
      // Join the country table to get the country of birth
      .innerJoin(country, eq(driver.nationality_country_id, country.id))
      .where(eq(driver.id, idSanitised));

    // If there was no data found, driver is not in database, return err
    if (!driverData.length) return err("No driver found");

    // Fetch the 3 most recent races for the driver
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
        raceGap: race_data.race_gap || null,
        raceTime: race_data.race_time || null,
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

    // Fetch the latest constructor
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

    const image = await this.getWikipediaHeadshot(driverData[0]?.name!);

    const combinedData = {
      ...driverData[0],
      image: image.unwrapOr(null),
      team: latestConstructor[0],
      recentRaces,
    } as unknown as Driver;

    return ok(combinedData);
  }

  private async getWikipediaHeadshot(
    driverName: string
  ): Promise<Result<string, string>> {
    try {
      // Get the wikipedia page url for the driver
      const title = driverName.replace(" ", "_");

      const encodedTitle = encodeURIComponent(title);
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=pageimages&format=json&pithumbsize=500`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        return err("Error fetching data");
      }

      interface WikipediaApiResponse {
        query: {
          pages: {
            [pageId: string]: {
              pageid: number;
              ns: number;
              title: string;
              thumbnail?: {
                source: string;
                width: number;
                height: number;
              };
            };
          };
        };
      }

      const data = (await response.json()) as WikipediaApiResponse;
      const pages = data.query.pages;
      const page = Object.values(pages)[0];

      if (page && page.thumbnail && page.thumbnail.source) {
        return ok(page.thumbnail.source);
      } else {
        return err("No headshot found");
      }
    } catch {
      return err("Error fetching data");
    }
  }
}
