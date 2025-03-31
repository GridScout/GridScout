import CronJob from "../structures/cronJob.js";
import { getDrizzle } from "@gridscout/db/sqlite";
import { race, circuit, grand_prix } from "@gridscout/db/sqlite/schema";
import { meilisearch } from "@gridscout/search";
import { eq } from "drizzle-orm";

interface Race {
  id: number;
  name: string;
  year: number;
  official_name: string;
  circuit_name: string;
  circuit_place: string;
  date: string | number;
  round: number;
  laps: number;
}

export default new CronJob(
  "RaceMeilisearchUpdater",
  { schedule: "10 0 * * *", runOnStart: true },

  async () => {
    const db = await getDrizzle();

    // Fetch races from db
    const races = await db
      .select({
        id: race.id,
        name: grand_prix.full_name,
        year: race.year,
        official_name: race.official_name,
        circuit_name: circuit.name,
        circuit_place: circuit.place_name,
        date: race.date,
        round: race.round,
        laps: race.laps,
      })
      .from(race)
      .innerJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
      .innerJoin(circuit, eq(race.circuit_id, circuit.id))
      .all();

    console.log(`Found ${races.length} races in the database`);

    // Get existing races from Meilisearch
    const existingRaces = await meilisearch.getAllRaces();
    console.log(`Found ${existingRaces.length} races in Meilisearch`);

    // Create a map of existing races
    const searchRaceMap = new Map<number, Race>(
      existingRaces.map((r: Race) => [r.id, r]),
    );

    const racesToAdd: Race[] = [];

    // Check for new races to add to Meilisearch
    for (const race of races) {
      const existingRace = searchRaceMap.get(race.id);

      if (!existingRace) {
        racesToAdd.push(race);
      }
    }

    // Apply changes
    if (racesToAdd.length > 0) {
      console.log(`Adding ${racesToAdd.length} new races to Meilisearch`);
      await meilisearch.updateRaceDocuments(racesToAdd);
    }
  },
);
