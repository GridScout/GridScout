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

interface Race {
  id: number;
  name: string;
  year: number;
  official_name: string;
  circuit_name: string;
  circuit_place: string;
  date: string | number;
  round: number;
  laps: number;
}

interface Constructor {
  id: string;
  name: string;
  fullName: string;
  nationality: {
    id: string;
    alpha3: string;
    demonym: string | null;
  };
}

interface Circuit {
  id: string;
  name: string;
  location: string;
  country: string;
}

class MeilisearchClient {
  private client: MeiliSearch;
  driverIndexName: string;
  raceIndexName: string;
  constructorIndexName: string;
  circuitIndexName: string;

  constructor(
    host: string = env.MEILISEARCH_HOST,
    apiKey: string = env.MEILISEARCH_API_KEY,
    driverIndexName: string = "drivers",
    raceIndexName: string = "races",
    constructorIndexName: string = "constructors",
    circuitIndexName: string = "circuits",
  ) {
    this.client = new MeiliSearch({ host, apiKey });
    this.driverIndexName = driverIndexName;
    this.raceIndexName = raceIndexName;
    this.constructorIndexName = constructorIndexName;
    this.circuitIndexName = circuitIndexName;
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
      const index = this.client.index(this.driverIndexName);
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
   * Search for a race by name, circuit, or year
   *
   * @param query The search query
   * @returns {Promise<Race[]>} Array of races that match the search query
   */
  async searchRace(
    query: string,
    year: number,
    limit: number = 25,
  ): Promise<Race[]> {
    try {
      const index = this.client.index(this.raceIndexName);
      const response = await index.search<Race>(query, {
        limit: limit,
        sort: ["year:desc", "round:asc"],
        filter: `year=${year}`,
      });
      return response.hits;
    } catch (error) {
      return [];
    }
  }

  /**
   * Search for a constructor by name
   *
   * @param name The name of the constructor to search for
   * @returns {Promise<Constructor[]>} Array of constructors that match the search query
   */
  async searchConstructorByName(
    name: string,
    limit: number = 25,
  ): Promise<Constructor[]> {
    const index = this.client.index(this.constructorIndexName);
    let response;
    if (name === "") {
      response = await index.search<Constructor>(name, {
        limit: limit,
        sort: ["active:desc"],
      });
    } else {
      response = await index.search<Constructor>(name, {
        limit: limit,
        sort: ["active:desc"],
      });
    }
    return response.hits;
  }

  async searchCircuitByName(
    name: string,
    limit: number = 25,
  ): Promise<Circuit[]> {
    try {
      const index = this.client.index(this.circuitIndexName);
      const response = await index.search<Circuit>(name, {
        limit: limit,
        sort: ["name:asc"],
      });
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
      const index = this.client.index(this.driverIndexName);
      const response = await index.addDocuments(drivers, { primaryKey: "id" });
      await index.updateFilterableAttributes(["name", "current_grid"]);
      await index.updateSortableAttributes(["current_grid"]);
      await index.updateSearchableAttributes(["id", "name", "country", "team"]);
      logger.info(`Driver documents updated with task ID: ${response.taskUid}`);
    } catch (error) {
      logger.error("Error updating driver documents");
      logger.error(error);
    }
  }

  /**
   * Update race documents in the Meilisearch index
   *
   * @param races Array of race objects to update in the index
   * @returns {Promise<void>}
   */
  async updateRaceDocuments(races: Race[]): Promise<void> {
    try {
      const index = this.client.index(this.raceIndexName);
      const response = await index.addDocuments(races, { primaryKey: "id" });
      await index.updateFilterableAttributes(["year", "circuit_name"]);
      await index.updateSortableAttributes(["year", "round"]);
      await index.updateSearchableAttributes([
        "id",
        "name",
        "official_name",
        "circuit_name",
        "circuit_place",
        "year",
      ]);
      logger.info(`Race documents updated with task ID: ${response.taskUid}`);
    } catch (error) {
      logger.error("Error updating race documents");
      logger.error(error);
    }
  }

  /**
   * Update constructor documents in the Meilisearch index
   *
   * @param constructors Array of constructor objects to update in the index
   * @returns {Promise<void>}
   */
  async updateConstructorDocuments(constructors: Constructor[]): Promise<void> {
    try {
      const index = this.client.index(this.constructorIndexName);
      await index.deleteAllDocuments();
      const response = await index.addDocuments(constructors, {
        primaryKey: "id",
      });
      await index.updateFilterableAttributes(["name", "active"]);
      await index.updateSortableAttributes(["active"]);
      await index.updateSearchableAttributes(["id", "name", "fullName"]);
      logger.info(
        `Constructor documents updated with task ID: ${response.taskUid}`,
      );
    } catch (error) {
      logger.error("Error updating constructor documents");
      logger.error(error);
    }
  }

  async updateCircuitDocuments(circuits: Circuit[]): Promise<void> {
    try {
      const index = this.client.index(this.circuitIndexName);
      await index.deleteAllDocuments();
      const response = await index.addDocuments(circuits, {
        primaryKey: "id",
      });
      await index.updateFilterableAttributes(["name", "country"]);
      await index.updateSortableAttributes(["name"]);
      await index.updateSearchableAttributes([
        "id",
        "name",
        "location",
        "country",
      ]);
      logger.info(
        `Circuit documents updated with task ID: ${response.taskUid}`,
      );
    } catch (error) {
      logger.error("Error updating circuit documents");
      logger.error(error);
    }
  }

  /**
   * Get all circuit documents from the Meilisearch index
   * @returns {Promise<Circuit[]>} Array of all circuit documents in the index
   */
  async getAllCircuits(): Promise<Circuit[]> {
    try {
      const index = this.client.index(this.circuitIndexName);
      const response = await index.getDocuments<Circuit>({ limit: 10000 });
      return response.results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all driver documents from the Meilisearch index
   * @returns {Promise<Driver[]>} Array of all driver documents in the index
   */
  async getAllDocuments(indexName: string): Promise<Driver[]> {
    try {
      const index = this.client.index(indexName);
      const response = await index.getDocuments<Driver>({ limit: 10000 });
      return response.results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all race documents from the Meilisearch index
   * @returns {Promise<Race[]>} Array of all race documents in the index
   */
  async getAllRaces(): Promise<Race[]> {
    try {
      const index = this.client.index(this.raceIndexName);
      const response = await index.getDocuments<Race>({ limit: 10000 });
      return response.results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete all driver documents from the Meilisearch index
   * @returns {Promise<void>}
   */
  async deleteAllDocuments(indexName: string): Promise<void> {
    try {
      const index = this.client.index(indexName);
      await index.deleteAllDocuments();
    } catch (error) {
      logger.error("Error deleting all documents");
      logger.error(error);
    }
  }

  /**
   * Delete all race documents from the Meilisearch index
   * @returns {Promise<void>}
   */
  async deleteAllRaces(): Promise<void> {
    try {
      const index = this.client.index(this.raceIndexName);
      await index.deleteAllDocuments();
    } catch (error) {
      logger.error("Error deleting all race documents");
      logger.error(error);
    }
  }
}

export const meilisearch = new MeilisearchClient();
