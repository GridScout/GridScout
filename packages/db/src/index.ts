import logger from "@gridscout/logger";

import { drizzle, BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import path from "path";
import { watch } from "fs";

const dbPath = path.resolve(__dirname, "../../../f1db.db");

let sqlite = new Database(dbPath, { readonly: true });
let currentDrizzle: BunSQLiteDatabase = drizzle(sqlite);

// lock to track if db is being refreshed
let refreshInProgress: Promise<void> | null = null;

async function refreshConnection() {
  if (refreshInProgress) {
    // if refresh already happening, wait for it to finish
    await refreshInProgress;
    return;
  }

  refreshInProgress = (async () => {
    try {
      logger.debug("Attempting to refresh database connection...");

      // create a new connection first (prevent closing a db, then being unable to open a new one)
      const newSqlite = new Database(dbPath, { readonly: true });
      const newDrizzle = drizzle(newSqlite);

      // if successful, swap the connections
      sqlite.close();
      sqlite = newSqlite;
      currentDrizzle = newDrizzle;

      logger.debug("Database connection refreshed successfully.");
    } catch (error) {
      logger.error("Failed to refresh database connection");
      logger.error(error);
      logger.warn(
        "Keeping the existing database connection to avoid breaking the app.",
      );
    } finally {
      refreshInProgress = null;
    }
  })();

  await refreshInProgress;
}

export async function getDrizzle(): Promise<BunSQLiteDatabase> {
  if (refreshInProgress) {
    await refreshInProgress;
  }
  return currentDrizzle;
}

watch(dbPath, async (eventType) => {
  if (eventType === "change") {
    logger.debug("Database file changed, refreshing connection...");
    await refreshConnection();
  }
});

logger.debug("Watching for database file changes...");
