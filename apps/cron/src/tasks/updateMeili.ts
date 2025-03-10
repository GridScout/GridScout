import CronJob from "../structures/cronJob.js";
import { getDrizzle } from "@gridscout/db";
import {
  constructor,
  country,
  driver,
  season_entrant_driver,
} from "@gridscout/db/schema";
import { meilisearch } from "@gridscout/search";
import { eq, sql } from "drizzle-orm";

export default new CronJob(
  "MeilisearchUpdater",
  { schedule: "0 * * * *", runOnStart: true },

  async () => {
    const db = await getDrizzle();
    const currentYear = new Date().getFullYear();

    // fetch drivers from db
    const drivers = await db
      .select({
        id: driver.id,
        name: driver.name,
        country: country.name,
        team: sql<
          string | null
        >`MAX(CASE WHEN ${season_entrant_driver.year} = ${currentYear} THEN ${constructor.name} ELSE NULL END)`.as(
          "team"
        ),
        current_grid: sql<boolean>`EXISTS (
          SELECT 1 FROM ${season_entrant_driver} 
          WHERE ${season_entrant_driver.driver_id} = ${driver.id} 
          AND ${season_entrant_driver.year} = ${currentYear}
        )`.as("current_grid"),
      })
      .from(driver)
      .innerJoin(country, eq(driver.nationality_country_id, country.id))
      .leftJoin(
        season_entrant_driver,
        eq(driver.id, season_entrant_driver.driver_id)
      )
      .leftJoin(
        constructor,
        eq(season_entrant_driver.constructor_id, constructor.id)
      )
      .groupBy(driver.id, country.name)
      .all();

    console.log(`Found ${drivers.length} drivers in the database`);

    const uploadedDrivers = await meilisearch.getAllDocuments();
    console.log(`Found ${uploadedDrivers.length} drivers in Meilisearch`);

    const searchDriverMap = new Map(uploadedDrivers.map((d) => [d.id, d]));

    const driversToAdd: Driver[] = [];

    // check for updates & new drivers
    for (const driver of drivers) {
      const existingDriver = searchDriverMap.get(driver.id);
      // Make sure team is always a string
      const driverWithStringTeam = {
        ...driver,
        team: driver.team || "",
      };

      if (!existingDriver) {
        // new driver, needs to be added
        driversToAdd.push(driverWithStringTeam);
      }
    }

    // apply changes
    if (driversToAdd.length > 0) {
      console.log(`Adding ${driversToAdd.length} new drivers to Meilisearch`);
      await meilisearch.updateDriverDocuments(driversToAdd);
    }
  }
);

interface Driver {
  id: string;
  name: string;
  country: string;
  team: string;
  current_grid: boolean;
}
