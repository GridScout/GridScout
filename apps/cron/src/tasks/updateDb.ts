import CronJob from "../structures/cronJob.js";
import GitHub from "@gridscout/utils/github";
import path from "path";
import decompress from "decompress";

const ghAPI = new GitHub();

export default new CronJob(
  "DatabaseUpdater",
  { schedule: "0 * * * *", runOnStart: true },

  async () => {
    const latestRelease = await ghAPI.getLatestRelease();
    // Check if we already have a version file
    let currentVersion;
    try {
      const versionFile = Bun.file(
        path.resolve(__dirname, "../../../../db_version.txt"),
      );
      currentVersion = (await versionFile.exists())
        ? await versionFile.text()
        : await Bun.write(
            path.resolve(__dirname, "../../../../db_version.txt"),
            "0.0.0",
          ).then(() => "0.0.0");
    } catch {
      currentVersion = "0.0.0";
    }

    // Update version file with latest version from GitHub
    if (!latestRelease.isErr()) {
      await Bun.write(
        path.resolve(__dirname, "../../../../db_version.txt"),
        latestRelease.unwrap().tag_name,
      );
    }

    // Get latest version
    if (latestRelease.isErr()) return;
    const latestVersion = latestRelease.unwrap().tag_name;

    // Skip if already on latest version
    if (currentVersion === latestVersion) {
      console.log("Database already at latest version:", latestVersion);
      return;
    }

    console.log(`Updating database from ${currentVersion} to ${latestVersion}`);

    if (latestRelease.isErr()) return;

    // Download the latest database
    const url = latestRelease.unwrap().sqlite_dl;
    const file = await fetch(url);

    if (!file.ok) {
      throw new Error(
        `Failed to download the latest database: ${file.statusText}`,
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
    await Bun.write(
      path.resolve(__dirname, "../../../../f1db.db"),
      dbFile.data,
    );

    console.log("Database updated successfully.");
  },
);
