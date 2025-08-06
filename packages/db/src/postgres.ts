import env from "@gridscout/env";
import logger from "@gridscout/logger";

import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { SQL } from "bun";
import path from "path";
import { reminderTypes } from "./pg-schema.js";
import { seedReminderTypes } from "./seed.js";

const client = new SQL(env.DATABASE_URL);
const db = drizzle({ client });

// Run migrations on initialization
async function runMigrations() {
  try {
    const migrationPath = path.resolve(__dirname, "../drizzle/pg");
    logger.info("Running PostgreSQL migrations...");
    await migrate(db, { migrationsFolder: migrationPath });
    logger.info("PostgreSQL migrations completed successfully");

    const typesExist = await db.select().from(reminderTypes).limit(1);

    if (typesExist.length === 0) {
      logger.info(
        "No reminder types found in database, running seed script...",
      );
      await seedReminderTypes();
    }
  } catch (error) {
    // Check if the error is about relations already existing (normal case when tables are already created)
    if (error instanceof Error && error.message.includes("already exists")) {
      logger.info("PostgreSQL tables already exist, skipping migrations");

      try {
        const typesExist = await db.select().from(reminderTypes).limit(1);

        if (typesExist.length === 0) {
          logger.info(
            "No reminder types found in database, running seed script...",
          );
          await seedReminderTypes();
        }
      } catch (seedError) {
        logger.error("Error checking or applying seed data");
        logger.error(seedError);
      }
    } else {
      logger.error("Failed to run PostgreSQL migrations");
      logger.error(error);
    }
  }
}

runMigrations();

export default db;
