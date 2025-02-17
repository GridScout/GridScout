import Redis, { Redis as RedisType } from "ioredis";
import { Logger } from "@/utils";

interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export class RedisCache {
  private client: RedisType;

  constructor(options?: RedisOptions) {
    this.client = new Redis({
      host: options?.host || "localhost",
      port: options?.port || 6379,
      password: options?.password,
      db: options?.db || 0,
    });

    // connection events
    this.client.on("connect", () => {
      Logger.debug("Connected to Redis");
    });

    this.client.on("error", (err) => {
      Logger.error("Redis connection error:", err);
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
      Logger.error(`Error getting key "${key}" from Redis:`, error);
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
      Logger.error(`Error setting key "${key}" in Redis:`, error);
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
