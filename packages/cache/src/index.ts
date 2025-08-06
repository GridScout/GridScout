import Redis from "ioredis";
import logger from "@gridscout/logger";
import env from "@gridscout/env";

export class RedisCache {
  private client: Redis.Redis;

  constructor() {
    this.client = new Redis.default({
      host: env.REDIS_HOST || "localhost",
      port: env.REDIS_PORT || 6379,
      password: env.REDIS_PASSWORD,
      db: 0,
    });

    // connection events
    this.client.on("connect", () => {
      logger.debug("Connected to Redis");
    });

    this.client.on("error", (err) => {
      logger.error("Redis connection error");
      logger.error(err);
    });
  }

  /**
   * Retrieves a value from Redis by key.
   * @param key The key to retrieve.
   * @returns The value as a string or null if not found.
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Error getting key "${key}" from Redis`);
      logger.error(error);
      return null;
    }
  }

  /**
   * Sets a key-value pair in Redis with an optional TTL.
   * @param key The key to set.
   * @param value The value to store.
   * @param ttl Time-to-live in seconds (optional).
   * @returns A boolean indicating success.
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.set(key, value, "EX", ttl);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Error setting key "${key}" in Redis`);
      logger.error(error);
      return false;
    }
  }

  /**
   * Disconnects the Redis client.
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
