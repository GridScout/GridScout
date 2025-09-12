import type { API } from "../index.js";
import type { Circuit } from "@gridscout/types";

import { country, race, circuit } from "@gridscout/db/sqlite/schema";

import { ok, err, type Result } from "@sapphire/result";
import { eq, sql } from "drizzle-orm";

export class CircuitService {
  constructor(private readonly client: API) {}

  async get(id: string): Promise<Result<Circuit, string>> {
    // Sanitise the input
    const idSanitised = this.client.sanitiseInput(id);

    const db = await this.client.db();

    const circuitData = await db
      .select({
        id: circuit.id,
        name: circuit.name,
        location: circuit.place_name,
        country: {
          id: country.id,
          alpha3: country.alpha3_code,
          name: country.name,
        },
        type: circuit.type,
        direction: circuit.direction,
        length: circuit.length,
        turns: circuit.turns,
        total_races_held: circuit.total_races_held,
        latitude: circuit.latitude,
        longitude: circuit.longitude,
        map_url:
          sql<string>`'http://maps.google.com/maps?z=15&t=k&q=loc:' || ${circuit.latitude} || ',' || ${circuit.longitude}`.as(
            "map_url",
          ),

        fastestLap: sql<string>`(
        SELECT
            json_object(
                'time', rd.fastest_lap_time,
                'year', r.year,
                'driver', json_object(
                    'id', d.id,
                    'name', d.name,
                    'country_alpha3', dc.alpha3_code
                )
            )
        FROM race_data rd
        JOIN race r ON rd.race_id = r.id
        JOIN driver d ON rd.driver_id = d.id
        JOIN country dc ON d.nationality_country_id = dc.id
        WHERE
            /* Correlate with the outer query's circuit id */
            r.circuit_id = ${circuit.id}
            /* Filter to only include races on the most recent layout */
            AND r.course_length = (
                SELECT r2.course_length
                FROM race r2
                WHERE r2.circuit_id = ${circuit.id}
                ORDER BY r2.year DESC
                LIMIT 1
            )
            /* Ensure a fastest lap time exists */
            AND rd.fastest_lap_time_millis IS NOT NULL
        /* Order by the millisecond time to find the fastest */
        ORDER BY rd.fastest_lap_time_millis ASC
        LIMIT 1
    )`.as("fastest_lap"),
      })
      .from(circuit)
      .innerJoin(country, eq(circuit.country_id, country.id))
      .where(eq(circuit.id, idSanitised))
      .limit(1);

    if (circuitData.length === 0) {
      return err(`Circuit with ID ${id} not found`);
    }

    const result = circuitData[0]!;

    // Get the first race year for this circuit
    const firstRaceData = await db
      .select({
        year: race.year,
      })
      .from(race)
      .where(eq(race.circuit_id, idSanitised))
      .orderBy(race.year)
      .limit(1);

    const firstRaceYear = firstRaceData.length > 0 ? firstRaceData[0]!.year : 0;

    const lapRecord = result.fastestLap ? JSON.parse(result.fastestLap) : null;

    return ok({
      id: result.id,
      name: result.name,
      location: result.location,
      country: {
        id: result.country.id,
        alpha3: result.country.alpha3,
        name: result.country.name,
      },
      type: result.type as "ROAD" | "RACE",
      direction: result.direction as "CLOCKWISE" | "ANTI_CLOCKWISE",
      length: Number(result.length),
      turns: result.turns,
      total_races_held: result.total_races_held,
      first_gp_year: firstRaceYear,
      lapRecord: lapRecord,
      map_url: result.map_url,
    });
  }
}
