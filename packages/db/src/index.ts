import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

import path from "path";

const sqlite = new Database(path.resolve(__dirname, "../../../f1db.db"), {
  readonly: true,
});
export default drizzle({ client: sqlite });
