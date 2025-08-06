import { reminderTypes } from "./pg-schema.js";
import db from "./postgres.js";
import logger from "@gridscout/logger";

export async function seedReminderTypes() {
  try {
    await db
      .insert(reminderTypes)
      .values([
        { id: "1", sessionId: "freePractice1", name: "Free Practice 1" },
        { id: "2", sessionId: "freePractice2", name: "Free Practice 2" },
        { id: "3", sessionId: "freePractice3", name: "Free Practice 3" },
        { id: "4", sessionId: "sprintQualifying", name: "Sprint Qualifying" },
        { id: "5", sessionId: "sprintRace", name: "Sprint Race" },
        { id: "6", sessionId: "qualifying", name: "Qualifying" },
        { id: "7", sessionId: "grandPrix", name: "Grand Prix" },
      ])
      .onConflictDoNothing();

    logger.debug("Database seeded with reminder types");
  } catch (error) {
    logger.error("Error seeding database");
    logger.error(error);
  }
}
