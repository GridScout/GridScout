import env from "@gridscout/env";

import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

const client = new SQL(env.DATABASE_URL);
const db = drizzle({ client });

export default db;
