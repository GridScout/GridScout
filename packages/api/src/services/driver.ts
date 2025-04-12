import type { API } from "../index.js";
import type { Driver } from "@gridscout/types";

import {
  driver,
  country,
  race,
  race_data,
  grand_prix,
  season_entrant_driver,
  constructor,
} from "@gridscout/db/sqlite/schema";

import { ok, err, type Result } from "@sapphire/result";
import { eq, and, desc, sql } from "drizzle-orm";

export class DriverService {
  constructor(private readonly client: API) {}

  async get(id: string): Promise<Result<Driver, string>> {
    // Sanitise the input
    const idSanitised = this.client.sanitiseInput(id);

    const db = await this.client.db();

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
          highestRaceFinishCount: sql<number>`0`.as("highestRaceFinishCount"),
          highestGridPositionCount: sql<number>`0`.as(
            "highestGridPositionCount",
          ),
        },
      })
      .from(driver)
      // Join the country table to get the country of birth
      .innerJoin(country, eq(driver.nationality_country_id, country.id))
      .where(eq(driver.id, idSanitised));

    // If there was no data found, driver is not in database, return err
    if (driverData.length == 0) return err("No driver found");

    const driverResult = driverData[0];
    if (!driverResult) return err("Driver data processing error");

    // Calculate how many times the driver achieved their best race result
    if (driverResult.statistics.highestRaceFinish !== null) {
      const bestRaceResultCount = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(race_data)
        .where(
          and(
            eq(race_data.driver_id, idSanitised),
            eq(race_data.type, "RACE_RESULT"),
            eq(
              race_data.position_text,
              driverResult.statistics.highestRaceFinish.toString(),
            ),
          ),
        );

      if (bestRaceResultCount[0]) {
        driverResult.statistics.highestRaceFinishCount =
          bestRaceResultCount[0].count;
      }
    }

    // Calculate how many times the driver achieved their best grid position
    if (driverResult.statistics.highestGridPosition !== null) {
      const bestGridPositionCount = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(race_data)
        .where(
          and(
            eq(race_data.driver_id, idSanitised),
            eq(race_data.type, "QUALIFYING_RESULT"),
            eq(
              race_data.position_text,
              driverResult.statistics.highestGridPosition.toString(),
            ),
          ),
        );

      if (bestGridPositionCount[0]) {
        driverResult.statistics.highestGridPositionCount =
          bestGridPositionCount[0].count;
      }
    }

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
          eq(race_data.type, "RACE_RESULT"),
        ),
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
        eq(season_entrant_driver.constructor_id, constructor.id),
      )
      .where(eq(season_entrant_driver.driver_id, idSanitised))
      .orderBy(desc(season_entrant_driver.year))
      .limit(1);

    const image = await this.getWikipediaHeadshot(driverResult.name);

    const combinedData = {
      ...driverResult,
      image: image.unwrapOr(null),
      team: latestConstructor[0],
      recentRaces,
    } as unknown as Driver;

    return ok(combinedData);
  }

  private async getWikipediaHeadshot(
    driverName: string,
  ): Promise<Result<string, string>> {
    try {
      const cache = await this.client.cache();
      const cacheKey = `image:${driverName}`;

      const cachedImage = await cache.get(cacheKey);
      if (cachedImage) {
        return ok(cachedImage);
      }

      // Get the wikipedia page url for the driver
      const title = driverName.replace(" ", "_");
      const encodedTitle = encodeURIComponent(title);

      // First get the normalized/redirected title
      const normalizeUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&redirects=true&format=json`;

      const normalizeResponse = await fetch(normalizeUrl);
      if (!normalizeResponse.ok) {
        return err("Error fetching data");
      }

      interface WikipediaApiResponse {
        query: {
          pages: {
            [pageId: string]: {
              pageid?: number;
              ns?: number;
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

      const normalizeData =
        (await normalizeResponse.json()) as WikipediaApiResponse;
      const pages = Object.values(normalizeData.query.pages);

      if (!pages.length || !pages[0]) {
        return err("No page found for driver");
      }

      const normalizedTitle = pages[0].title.replace(" ", "_");

      // Now get the image using the normalized title
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(normalizedTitle)}&prop=pageimages&format=json&pithumbsize=500`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        return err("Error fetching data");
      }

      const data = (await response.json()) as WikipediaApiResponse;
      const page = Object.values(data.query.pages)[0];

      if (page && page.thumbnail && page.thumbnail.source) {
        await cache.set(cacheKey, page.thumbnail.source, 60 * 60 * 24 * 3);
        return ok(page.thumbnail.source);
      } else {
        return err("No headshot found");
      }
    } catch {
      return err("Error fetching data");
    }
  }
}
