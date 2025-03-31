import env from "@gridscout/env";
import logger from "@gridscout/logger";

import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { SQL } from "bun";
import path from "path";

const client = new SQL(env.DATABASE_URL);
const db = drizzle({ client });

// Run migrations on initialization
async function runMigrations() {
  try {
    const migrationPath = path.resolve(__dirname, "../drizzle/pg");
    logger.info("Running PostgreSQL migrations...");
    await migrate(db, { migrationsFolder: migrationPath });
    logger.info("PostgreSQL migrations completed successfully");
  } catch (error) {
    // Check if the error is about relations already existing (normal case when tables are already created)
    if (error instanceof Error && error.message.includes("already exists")) {
      logger.info("PostgreSQL tables already exist, skipping migrations");
    } else {
      logger.error("Failed to run PostgreSQL migrations:", error);
    }
  }
}

// Run migrations immediately
runMigrations();

export default db;
