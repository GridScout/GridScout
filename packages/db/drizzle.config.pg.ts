import { defineConfig } from "drizzle-kit";
import env from "@gridscout/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/pg-schema.ts",
  out: "./drizzle/pg",

  dbCredentials: {
    url: env.DATABASE_URL,
  },

  verbose: true,
});
