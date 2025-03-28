import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/sqlite-schema.ts",
  out: "./drizzle/sqlite",

  dbCredentials: {
    url: path.resolve(__dirname, "../../f1db.db"),
  },

  verbose: true,
});
