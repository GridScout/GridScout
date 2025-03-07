import CronJob from "../structures/cronJob.js";
import GitHub from "@gridscout/utils/github";

import decompress from "decompress";

const ghAPI = new GitHub();

export default new CronJob(
  "DatabaseUpdater",
  { schedule: "0 * * * *", runOnStart: false },

  async () => {
    const latestRelease = await ghAPI.getLatestRelease();

    if (latestRelease.isErr()) return;

    // Download the latest database
    const url = latestRelease.unwrap().sqlite_dl;
    const file = await fetch(url);

    if (!file.ok) {
      throw new Error(
        `Failed to download the latest database: ${file.statusText}`
      );
    }

    // Use decompress to extract the database
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const files = await decompress(buffer);

    // Find the database file
    const dbFile = files.find((file) => file.path.endsWith(".db"));

    if (!dbFile) {
      throw new Error("Database file not found in the release archive.");
    }

    // Replace the current database with the new one
    await Bun.write("../../f1db.db", dbFile.data);

    console.log("Database updated successfully.");
  }
);
