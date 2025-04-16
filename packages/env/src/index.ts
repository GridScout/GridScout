import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export default createEnv({
  server: {
    DOPPLER_ENVIRONMENT: z.string().min(1),

    DISCORD_TOKEN: z.string().min(1),
    GUILD_ID: z.string().min(1),

    SENTRY_DSN: z.string().optional(),

    DATABASE_URL: z.string().min(1),

    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.number().int().optional(),
    REDIS_PASSWORD: z.string().optional(),

    MEILISEARCH_HOST: z.string().min(1),
    MEILISEARCH_API_KEY: z.string().min(1),

    GITHUB_API_KEY: z.string().min(1),

    METRICS_PORT: z.string().optional(),

    NEWS_CHANNEL_ID: z.string().min(1),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: false,
});
