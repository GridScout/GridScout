import CronJob from "../structures/cronJob.js";
import { getDrizzle } from "@gridscout/db/sqlite";
import {
  constructor,
  country,
  driver,
  season_entrant_driver,
} from "@gridscout/db/sqlite/schema";
import { meilisearch } from "@gridscout/search";
import { eq, sql } from "drizzle-orm";

export default new CronJob(
  "MeilisearchUpdater",
  { schedule: "0 10 * * *", runOnStart: true },

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
          "team",
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
        eq(driver.id, season_entrant_driver.driver_id),
      )
      .leftJoin(
        constructor,
        eq(season_entrant_driver.constructor_id, constructor.id),
      )
      .groupBy(driver.id, country.name)
      .all();

    console.log(`Found ${drivers.length} drivers in the database`);

    const uploadedDrivers = await meilisearch.getAllDocuments(
      meilisearch.driverIndexName,
    );
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

    // Get all constructors with their country info
    const constructors = await db
      .select({
        id: constructor.id,
        name: constructor.name,
        fullName: constructor.full_name,
        nationality: {
          id: country.id,
          alpha3: country.alpha3_code,
          demonym: country.demonym,
        },
        active: sql<boolean>`EXISTS (
          SELECT 1 FROM ${season_entrant_driver} 
          WHERE ${season_entrant_driver.constructor_id} = ${constructor.id} 
          AND ${season_entrant_driver.year} = ${currentYear}
        )`.as("active"),
      })
      .from(constructor)
      .innerJoin(country, eq(constructor.country_id, country.id));

    console.log(`Found ${constructors.length} constructors in the database`);

    const uploadedConstructors = await meilisearch.getAllDocuments(
      meilisearch.constructorIndexName,
    );
    console.log(
      `Found ${uploadedConstructors.length} constructors in Meilisearch`,
    );

    const searchConstructorMap = new Map(
      uploadedConstructors.map((c) => [c.id, c]),
    );

    const constructorsToAdd: Constructor[] = [];

    // check for updates & new constructors
    for (const constructor of constructors) {
      const existingConstructor = searchConstructorMap.get(constructor.id);
      // Make sure team is always a string
      const constructorWithStringTeam = {
        ...constructor,
        team: constructor.name || "",
      };

      if (!existingConstructor) {
        // new constructor, needs to be added
        constructorsToAdd.push(constructorWithStringTeam);
      }
    }

    if (constructorsToAdd.length > 0) {
      console.log(
        `Adding ${constructorsToAdd.length} new constructors to Meilisearch`,
      );
      await meilisearch.updateConstructorDocuments(constructorsToAdd);
    }
  },
);

interface Driver {
  id: string;
  name: string;
  country: string;
  team: string;
  current_grid: boolean;
}

interface Constructor {
  id: string;
  name: string;
  fullName: string;
  nationality: { id: string; alpha3: string; demonym: string | null };
  active: boolean;
}
