import type { Results, ResultTypes } from "@gridscout/types";
import type { API } from "../index.js";
import { err, ok, type Result } from "@sapphire/result";
import {
  country,
  driver,
  grand_prix,
  race,
  race_data,
} from "@gridscout/db/sqlite/schema";
import { and, eq } from "drizzle-orm";

export class ResultsService {
  constructor(private readonly client: API) {}

  async get(
    raceId: number,
    type: ResultTypes,
  ): Promise<Result<Results, string>> {
    const db = await this.client.db();

    const results = await db
      .select({
        id: race_data.race_id,
        year: race.year,
        name: grand_prix.full_name,
        driver: {
          id: driver.id,
          name: driver.name,
          country_alpha3: country.alpha3_code,
        },
        position: race_data.position_number,
        position_text: race_data.position_text,
        retired_reason: race_data.race_reason_retired,
        points: race_data.race_points,
        sessions: {
          race_time: race_data.race_time,
          race_gap: race_data.race_gap,
          free_practice_1_time: race_data.practice_time,
          free_practice_1_gap: race_data.practice_gap,
          free_practice_2_time: race_data.practice_time,
          free_practice_2_gap: race_data.practice_gap,
          free_practice_3_time: race_data.practice_time,
          free_practice_3_gap: race_data.practice_gap,
          qualifying_time: race_data.qualifying_time,
          qualifying_gap: race_data.qualifying_gap,
          qualifying_q1: race_data.qualifying_q1,
          qualifying_q2: race_data.qualifying_q2,
          qualifying_q3: race_data.qualifying_q3,
          sprint_qualifying_time: race_data.qualifying_time,
          sprint_qualifying_gap: race_data.qualifying_gap,
          sprint_race_time: race_data.race_time,
          sprint_race_gap: race_data.race_gap,
        },
      })
      .from(race_data)
      .innerJoin(driver, eq(race_data.driver_id, driver.id))
      .innerJoin(country, eq(driver.nationality_country_id, country.id))
      .innerJoin(race, eq(race.id, race_data.race_id))
      .innerJoin(grand_prix, eq(race.grand_prix_id, grand_prix.id))
      .where(and(eq(race_data.race_id, raceId), eq(race_data.type, type)))
      .orderBy(race_data.position_display_order);

    if (results.length === 0) {
      return err("No results found");
    }

    const filteredResults = results.map((result) => {
      const sessionObj: any = {};

      if (type === "RACE_RESULT") {
        sessionObj.race_time = result.sessions.race_time || "";
        sessionObj.race_gap = result.sessions.race_gap || "";
      } else if (type === "FREE_PRACTICE_1_RESULT") {
        sessionObj.free_practice_1_time =
          result.sessions.free_practice_1_time || "";
        sessionObj.free_practice_1_gap =
          result.sessions.free_practice_1_gap || "";
      } else if (type === "FREE_PRACTICE_2_RESULT") {
        sessionObj.free_practice_2_time =
          result.sessions.free_practice_2_time || "";
        sessionObj.free_practice_2_gap =
          result.sessions.free_practice_2_gap || "";
      } else if (type === "FREE_PRACTICE_3_RESULT") {
        sessionObj.free_practice_3_time =
          result.sessions.free_practice_3_time || "";
        sessionObj.free_practice_3_gap =
          result.sessions.free_practice_3_gap || "";
      } else if (type === "QUALIFYING_RESULT") {
        let qualifying_time = "";
        if (result.sessions.qualifying_q3) {
          qualifying_time = result.sessions.qualifying_q3;
        } else if (result.sessions.qualifying_q2) {
          qualifying_time = result.sessions.qualifying_q2;
        } else if (result.sessions.qualifying_q1) {
          qualifying_time = result.sessions.qualifying_q1;
        } else {
          qualifying_time = result.sessions.qualifying_time || "";
        }

        sessionObj.qualifying_time = qualifying_time;
        sessionObj.qualifying_gap = result.sessions.qualifying_gap || "";
      } else if (type === "SPRINT_QUALIFYING_RESULT") {
        let sprint_qualifying_time = "";
        if (result.sessions.qualifying_q3) {
          sprint_qualifying_time = result.sessions.qualifying_q3;
        } else if (result.sessions.qualifying_q2) {
          sprint_qualifying_time = result.sessions.qualifying_q2;
        } else if (result.sessions.qualifying_q1) {
          sprint_qualifying_time = result.sessions.qualifying_q1;
        } else {
          sprint_qualifying_time = result.sessions.sprint_qualifying_time || "";
        }

        sessionObj.sprint_qualifying_time = sprint_qualifying_time;
        sessionObj.sprint_qualifying_gap =
          result.sessions.sprint_qualifying_gap || "";
      } else if (type === "SPRINT_RACE_RESULT") {
        sessionObj.sprint_race_time = result.sessions.sprint_race_time || "";
        sessionObj.sprint_race_gap = result.sessions.sprint_race_gap || "";
      }

      return {
        driver: result.driver,
        position: result.position || 0,
        position_text: result.position_text || "",
        retired_reason: result.retired_reason,
        points: result.points,
        sessions: [sessionObj],
      };
    });

    return ok({
      season: results[0]?.year ?? 0,
      id: results[0]?.id ?? 0,
      name: results[0]?.name ?? "",
      type,
      results: filteredResults,
    });
  }

  async getRaceEvents(raceId: number) {
    const db = await this.client.db();

    const events = await db
      .selectDistinct({ type: race_data.type })
      .from(race_data)
      .where(eq(race_data.race_id, raceId));

    return ok(events.map((event) => event.type));
  }
}
