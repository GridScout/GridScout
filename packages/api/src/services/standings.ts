import type { ConstructorStandings, DriverStandings } from "@gridscout/types";
import type { API } from "../index.js";

import { ok, err, type Result } from "@sapphire/result";
import { and, eq } from "drizzle-orm";
import {
  constructor as constructorTable,
  country,
  driver,
  engine_manufacturer,
  season_constructor_standing,
  season_driver_standing,
  season_entrant_driver,
} from "@gridscout/db/sqlite/schema";

export class StandingsService {
  constructor(private readonly client: API) {}

  /**
   * Get driver standings for a specific season
   * @param year - The F1 season year to get standings for (defaults to current year)
   * @returns Result containing driver standings or error message
   */
  async getDriverStandings(
    year?: number,
  ): Promise<Result<DriverStandings, string>> {
    const seasonYear = year || new Date().getFullYear();
    if (isNaN(seasonYear)) return err(`Invalid season year: ${year}`);

    const db = await this.client.db();

    try {
      // Query driver standings for the season
      const driverStandings = await db
        .select({
          position: season_driver_standing.position_number,
          driverId: season_driver_standing.driver_id,
          driverName: driver.name,
          points: season_driver_standing.points,
          nationalityId: driver.nationality_country_id,
          countryCode: country.alpha3_code,
        })
        .from(season_driver_standing)
        .innerJoin(driver, eq(season_driver_standing.driver_id, driver.id))
        .innerJoin(country, eq(driver.nationality_country_id, country.id))
        .where(eq(season_driver_standing.year, seasonYear))
        .orderBy(season_driver_standing.position_display_order);

      if (!driverStandings || driverStandings.length === 0) {
        return err(`No driver standings found for season ${seasonYear}`);
      }

      // Get team information for each driver
      const standings = await Promise.all(
        driverStandings.map(async (standing) => {
          // Find the team for this driver in this season
          const driverTeam = await db
            .select({
              constructorId: season_entrant_driver.constructor_id,
              constructorName: constructorTable.name,
            })
            .from(season_entrant_driver)
            .innerJoin(
              constructorTable,
              eq(season_entrant_driver.constructor_id, constructorTable.id),
            )
            .where(
              and(
                eq(season_entrant_driver.year, seasonYear),
                eq(season_entrant_driver.driver_id, standing.driverId),
                eq(season_entrant_driver.test_driver, 0 as unknown as boolean),
              ),
            )
            .limit(1);

          return {
            position: standing.position || 0,
            driver: {
              id: standing.driverId,
              name: standing.driverName,
              nationality: standing.countryCode,
            },
            team:
              driverTeam.length > 0 && driverTeam[0]
                ? {
                    id: driverTeam[0].constructorId,
                    name: driverTeam[0].constructorName,
                  }
                : {
                    id: "unknown",
                    name: "Unknown Team",
                  },
            points: Number(standing.points),
          };
        }),
      );

      return ok({
        season: seasonYear,
        standings,
      });
    } catch (error) {
      console.error("Error fetching driver standings:", error);
      return err(`Failed to fetch driver standings for season ${seasonYear}`);
    }
  }

  /**
   * Get constructor standings for a specific season
   * @param year - The F1 season year to get standings for (defaults to current year)
   * @returns Result containing constructor standings or error message
   */
  async getConstructorStandings(
    year?: number,
  ): Promise<Result<ConstructorStandings, string>> {
    const seasonYear = year || new Date().getFullYear();
    if (isNaN(seasonYear)) return err(`Invalid season year: ${year}`);

    const db = await this.client.db();

    try {
      const constructorStandings = await db
        .select({
          position: season_constructor_standing.position_number,
          constructorId: season_constructor_standing.constructor_id,
          constructorName: constructorTable.full_name,
          engineManufacturerId:
            season_constructor_standing.engine_manufacturer_id,
          engineManufacturerName: engine_manufacturer.name,
          points: season_constructor_standing.points,
        })
        .from(season_constructor_standing)
        .innerJoin(
          constructorTable,
          eq(season_constructor_standing.constructor_id, constructorTable.id),
        )
        .innerJoin(
          engine_manufacturer,
          eq(
            season_constructor_standing.engine_manufacturer_id,
            engine_manufacturer.id,
          ),
        )
        .where(eq(season_constructor_standing.year, seasonYear))
        .orderBy(season_constructor_standing.position_display_order);

      if (!constructorStandings || constructorStandings.length === 0) {
        return err(`No constructor standings found for season ${seasonYear}`);
      }

      const standings = constructorStandings.map((standing) => ({
        position: standing.position || 0,
        constructor: {
          id: standing.constructorId,
          name: standing.constructorName,
        },
        engineManufacturer: standing.engineManufacturerName,
        points: Number(standing.points),
      }));

      return ok({
        season: seasonYear,
        standings,
      });
    } catch (error) {
      console.error("Error fetching constructor standings:", error);
      return err(
        `Failed to fetch constructor standings for season ${seasonYear}`,
      );
    }
  }
}
