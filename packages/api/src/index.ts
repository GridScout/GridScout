import { DriverService } from "./services/driver.js";
import { StandingsService } from "./services/standings.js";
import { CalendarService } from "./services/calendar.js";

import { RedisCache } from "@gridscout/cache";
import logger from "@gridscout/logger";

export class ErgastClient {
  public driver: DriverService;
  public standings: StandingsService;
  public calendar: CalendarService;

  protected readonly baseUrl: string;
  private cache: RedisCache;
  private readonly cacheTTL: number; // stored in seconds

  // track the timestamp (ms) of outgoing requests
  private requestTimestamps: number[] = [];

  /**
   * Initializes the ErgastClient with optional Redis caching.
   * @param baseUrl The base URL for the Ergast API.
   * @param redisOptions Optional Redis connection parameters.
   * @param cacheTTL Cache expiration time in seconds.
   */
  constructor(
    baseUrl: string = "https://api.jolpi.ca/ergast/f1",
    // TODO: Sort out a more dynamic caching system
    cacheTTL: number = 3600, // defaults to 1h
  ) {
    this.baseUrl = baseUrl;
    this.driver = new DriverService(this);
    this.standings = new StandingsService(this);
    this.calendar = new CalendarService(this);
    this.cache = new RedisCache();
    this.cacheTTL = cacheTTL;
  }

  /**
   * Sleeps for a given number of milliseconds.
   * @param ms Milliseconds to sleep.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Jolpi.ca API rate limits as listed on the documentation:
   * - Burst Limit: 4 requests per second.
   * - Sustained Limit: 500 requests per hour.
   */
  private async applyRateLimit(): Promise<void> {
    let now = Date.now();

    // remove any timestamps older than 1h
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < 3600 * 1000,
    );

    // check for the sustained limit
    while (this.requestTimestamps.length >= 500) {
      // calculate time until the oldest request is over an hour old
      const oldest = Math.min(...this.requestTimestamps);
      const waitTime = 3600 * 1000 - (now - oldest) + 1;
      await this.sleep(waitTime);
      now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(
        (t) => now - t < 3600 * 1000,
      );
    }

    // check for the burst limit
    let recentRequests = this.requestTimestamps.filter(
      (t) => now - t < 1000,
    ).length;
    while (recentRequests >= 4) {
      await this.sleep(250); // wait
      now = Date.now();
      recentRequests = this.requestTimestamps.filter(
        (t) => now - t < 1000,
      ).length;
    }

    // add the current request to the list
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Fetches data from the Ergast API with caching and rate limiting.
   * @param path The API endpoint path.
   * @param limit Number of items to fetch (default: 100).
   * @param offset Offset for pagination (default: 0).
   * @param custom Any custom query parameters (default: empty string).
   * @returns The fetched data or null in case of an error.
   */
  async fetch<T>(
    path: string,
    limit: number = 100,
    offset: number = 0,
    custom: string = "",
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(path, limit, offset, custom);

    // Attempt to retrieve from cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData) as T;
      } catch (error) {
        logger.error(`Error parsing cached data for key "${cacheKey}":`, error);
      }
    }

    // Apply rate limiting before making the API request.
    await this.applyRateLimit();

    // If in redis# fetch from API
    const url = `${this.baseUrl}/${path}.json?limit=${limit}&offset=${offset}&${custom}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error(
          `Error fetching data from "${url}": ${response.statusText}`,
        );
        return null;
      }
      const data = (await response.json()) as T;

      // cache response
      const success = await this.cache.set(
        cacheKey,
        JSON.stringify(data),
        this.cacheTTL,
      );
      if (!success) {
        logger.warn(`Failed to cache data for key "${cacheKey}".`);
      }

      return data;
    } catch (error) {
      logger.error(`Error fetching data from "${url}":`, error);
      return null;
    }
  }

  /**
   * Generates a unique cache key based on request parameters.
   * @param path The API endpoint path.
   * @param limit Number of items to fetch.
   * @param offset Offset for pagination.
   * @param custom Any custom query parameters.
   * @returns A string representing the cache key.
   */
  private generateCacheKey(
    path: string,
    limit: number,
    offset: number,
    custom: string,
  ): string {
    return `ergast:${path}:limit:${limit}:offset:${offset}:custom:${custom}`;
  }

  /**
   * Fetches all paginated data from the Ergast API with caching.
   * @param path The API endpoint path.
   * @param limit Number of items per page (default: 100).
   * @returns The combined paginated data.
   */
  async fetchAllPaginated<T>(path: string, limit: number = 100): Promise<any> {
    const cacheKey = `paginated:${path}:limit:${limit}`;

    // Check if data is cached
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData) as any;
      } catch (error) {
        logger.error(
          `Error parsing cached paginated data for key "${cacheKey}":`,
          error,
        );
      }
    }

    let offset = 0;
    let results: T[] = [];
    let combinedResponse: any = null;

    while (true) {
      const data = await this.fetch<any>(path, limit, offset);
      if (!data || !data.MRData) {
        break;
      }

      // initialise combined response with metadata from the first request
      if (!combinedResponse) {
        combinedResponse = { ...data };
        const tableKey = Object.keys(data.MRData).find((key) =>
          key.endsWith("Table"),
        );
        if (tableKey) {
          combinedResponse.MRData[tableKey] = {
            ...data.MRData[tableKey],
            total: data.MRData.total, // keep the total count
          };
        }
      }

      // merge results from current page
      const tableKey = Object.keys(data.MRData).find((key) =>
        key.endsWith("Table"),
      );
      if (!tableKey) {
        break;
      }

      const table = data.MRData[tableKey];
      const arrayKey = Object.keys(table).find((key) =>
        Array.isArray(table[key]),
      );

      if (arrayKey) {
        results = [...results, ...table[arrayKey]];
      }

      offset += limit;
      if (results.length >= parseInt(data.MRData.total, 10)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // attach all results to the combined response
    if (combinedResponse) {
      const tableKey = Object.keys(combinedResponse.MRData).find((key) =>
        key.endsWith("Table"),
      );
      if (tableKey) {
        const table = combinedResponse.MRData[tableKey];
        const arrayKey = Object.keys(table).find((key) =>
          Array.isArray(table[key]),
        );
        if (arrayKey) {
          combinedResponse.MRData[tableKey][arrayKey] = results;
        }
      }
    }

    // cache the combined response
    const success = await this.cache.set(
      cacheKey,
      JSON.stringify(combinedResponse),
      this.cacheTTL,
    );
    if (!success) {
      logger.warn(`Failed to cache paginated data for key "${cacheKey}".`);
    }

    return combinedResponse;
  }

  /**
   * Disconnects the Redis client.
   */
  async disconnectCache(): Promise<void> {
    await this.cache.disconnect();
  }
}
