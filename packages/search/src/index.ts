import env from "@gridscout/env";
import logger from "@gridscout/logger";

import { MeiliSearch } from "meilisearch";

interface Driver {
  id: string;
  name: string;
  country: string;
  team: string;
  current_grid: boolean;
}

class MeilisearchClient {
  private client: MeiliSearch;
  private indexName: string;

  constructor(
    host: string = env.MEILISEARCH_HOST,
    apiKey: string = env.MEILISEARCH_API_KEY,
    indexName: string = "drivers"
  ) {
    this.client = new MeiliSearch({ host, apiKey });
    this.indexName = indexName;
  }

  /**
   * Search for a driver by name
   *
   * @param name The name of the driver to search for
   * @returns {Promise<Driver[]>} Array of drivers that match the search query
   */
  async searchDriverByName(
    name: string,
    limit: number = 25
  ): Promise<Driver[]> {
    try {
      const index = this.client.index(this.indexName);
      let response;
      if (name === "") {
        response = await index.search<Driver>(name, {
          limit: limit,
          filter: "current_grid=1",
        });
      } else {
        response = await index.search<Driver>(name, {
          limit: limit, // Discord has a limit of 25 results for autocomplete
          sort: ["current_grid:desc"],
        });
      }
      return response.hits;
    } catch (error) {
      return [];
    }
  }

  /**
   * Update driver documents in the Meilisearch index
   *
   * @param drivers Array of driver objects to update in the index
   * @returns {Promise<void>}
   */
  async updateDriverDocuments(drivers: Driver[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      const response = await index.addDocuments(drivers, { primaryKey: "id" });
      await index.updateFilterableAttributes(["name", "current_grid"]);
      await index.updateSortableAttributes(["current_grid"]);
      await index.updateSearchableAttributes(["id", "name", "country", "team"]);
      logger.info(`Documents updated with task ID: ${response.taskUid}`);
    } catch (error) {
      logger.error(`Error updating driver documents: ${error}`);
    }
  }

  /**
   * Get all driver documents from the Meilisearch index
   * @returns {Promise<Driver[]>} Array of all driver documents in the index
   */
  async getAllDocuments(): Promise<Driver[]> {
    try {
      const index = this.client.index(this.indexName);
      const response = await index.getDocuments<Driver>({ limit: 10000 });
      return response.results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete all driver documents from the Meilisearch index
   * @returns {Promise<void>}
   */
  async deleteAllDocuments(): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteAllDocuments();
    } catch (error) {
      logger.error(`Error deleting all documents: ${error}`);
    }
  }
}

export const meilisearch = new MeilisearchClient();
