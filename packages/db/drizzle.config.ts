import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: path.resolve(__dirname, "../../f1db.db"),
  },

  verbose: true,
});
