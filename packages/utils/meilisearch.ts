import { MeiliSearch } from "meilisearch";
import { config } from "@/config";
import { Logger } from "@/utils";

interface Driver {
  id: string;
  name: string;
  current_grid: boolean;
  [key: string]: any;
}

export class MeilisearchClient {
  private client: MeiliSearch;
  private indexName: string;

  constructor(
    host: string = config.MEILISEARCH_HOST,
    apiKey: string = config.MEILISEARCH_API_KEY,
    indexName: string = "drivers",
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
    limit: number = 25,
  ): Promise<Driver[]> {
    try {
      const index = this.client.index(this.indexName);
      let response;
      if (name === "") {
        response = await index.search<Driver>(name, {
          limit: limit,
          filter: "current_grid=true",
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
      Logger.info(`Documents updated with task ID: ${response.taskUid}`);
    } catch (error) {
      Logger.error(`Error updating driver documents: ${error}`);
    }
  }
}
