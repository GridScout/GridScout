import { ErgastClient } from "../index.js";

import {
  EDriverResponse,
  EDriverStandingsResponse,
  EResultsResponse,
  ESeasonsResponse,
} from "@gridscout/types/ergast";
import { Driver, Race } from "@gridscout/types";
import logger from "@gridscout/logger";
import { nationalityToCountry } from "@gridscout/utils";

import { Result, err, ok } from "@sapphire/result";

import countries from "i18n-iso-countries";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export class DriverService {
  constructor(private readonly client: ErgastClient) {}

  /**
   * Fetches driver data from the Ergast API
   * @param id - The driver ID
   * @returns {Promise<Result<Driver, string>>} The driver data
   */
  async getDriver(id: string): Promise<Result<Driver, string>> {
    if (!id) {
      return err("Missing driver ID");
    }

    id = id.replace(/[^a-zA-Z0-9_]/g, "");

    const [driverResponse, resultsResponse] = await Promise.all([
      this.client.fetch<EDriverResponse>(`drivers/${id}`),
      this.client.fetchAllPaginated<EResultsResponse>(`drivers/${id}/results`),
    ]);

    const driver = driverResponse?.MRData?.DriverTable?.Drivers[0];
    if (!driver) {
      return err("Driver not found");
    }

    let recentRaces = await this.getNRaces(id, 3);
    if (recentRaces.isErr()) {
      recentRaces = ok([]);
    }

    const headshotUrl = driver.url
      ? await this.getWikipediaHeadshotFromUrl(driver.url)
      : err("No Wikipedia URL");

    const races = recentRaces.unwrap();

    // compute various stats

    const fastestLapCount = resultsResponse.MRData.RaceTable.Races.reduce(
      (
        count: number,
        race: { Results: { FastestLap?: { rank: string } }[] },
      ) => {
        return count + (race.Results[0]?.FastestLap?.rank === "1" ? 1 : 0);
      },
      0,
    );

    const points = resultsResponse.MRData.RaceTable.Races.reduce(
      (totalPoints: number, race: { Results: { points: string }[] }) => {
        return totalPoints + parseFloat(race.Results[0]?.points || "0");
      },
      0,
    );

    const highestFinish = resultsResponse.MRData.RaceTable.Races.reduce(
      (highest: number, race: { Results: { position: string }[] }) => {
        const position = parseInt(race.Results[0]?.position || "0", 10);
        return position > 0 && position < highest ? position : highest;
      },
      Infinity,
    );

    const highestGrid = resultsResponse.MRData.RaceTable.Races.reduce(
      (highest: number, race: { Results: { grid: string }[] }) => {
        const gridPosition = parseInt(race.Results[0]?.grid || "0", 10);
        return gridPosition > 0 && gridPosition < highest
          ? gridPosition
          : highest;
      },
      Infinity,
    );

    const highestFinishAmount = resultsResponse.MRData.RaceTable.Races.filter(
      (race: { Results: { position: string }[] }) => {
        const position = parseInt(race.Results[0]?.position || "0", 10);
        return position === highestFinish;
      },
    ).length;

    const highestGridAmount = resultsResponse.MRData.RaceTable.Races.filter(
      (race: { Results: { grid: string }[] }) => {
        const gridPosition = parseInt(race.Results[0]?.grid || "0", 10);
        return gridPosition === highestGrid;
      },
    ).length;

    const podiums = resultsResponse.MRData.RaceTable.Races.filter(
      (race: { Results: { position: string }[] }) => {
        const position = parseInt(race.Results[0]?.position || "0", 10);
        return position > 0 && position <= 3;
      },
    ).length;

    interface Constructor {
      id: string;
      name: string;
      wikipedia_url: string;
    }

    const constructors: Constructor[] =
      resultsResponse.MRData.RaceTable.Races.map(
        (race: {
          Results: {
            Constructor: { constructorId: string; name: string; url: string };
          }[];
        }) => ({
          id: race.Results[0]?.Constructor.constructorId,
          name: race.Results[0]?.Constructor.name,
          wikipedia_url: race.Results[0]?.Constructor.url,
        }),
      );

    const uniqueConstructors: Constructor[] = Array.from(
      new Map(
        constructors.map((constructor) => [constructor.id, constructor]),
      ).values(),
    );

    // Fetch the number of wdc the driver has won
    let worldChampionships = await this.computeWorldChampionships(id);

    if (worldChampionships.isErr()) {
      worldChampionships = ok(0);
    }

    // Return data
    const driverData: Driver = {
      acronym: driver.code || null,
      number: driver.permanentNumber || null,
      name: {
        first: driver.givenName,
        last: driver.familyName,
      },
      constructors: uniqueConstructors,
      dob: driver.dateOfBirth || null,
      nationality: {
        name: driver.nationality || null,
        country: nationalityToCountry[driver.nationality] || null,
      },
      wikipedia_url: driver.url || null,
      poster: headshotUrl.isErr() ? null : headshotUrl.unwrap(),
      recent_races: races,
      statistics: {
        world_championships: worldChampionships.unwrap(),
        grand_prix_entered: parseInt(resultsResponse.MRData.total, 10),
        fastest_laps: fastestLapCount,
        podiums,
        points,
        highest_finish: {
          position: highestFinish,
          amount: highestFinishAmount,
        },
        highest_grid: {
          position: highestGrid,
          amount: highestGridAmount,
        },
      },
    };

    return ok(driverData);
  }

  /**
   * Computes the number of World Drivers Championships (WDC) a driver has won.
   * It fetches all seasons the driver is active in and then checks for each season
   * if the driver was the champion.
   *
   * @param driverId - The driver ID.
   * @returns The count of championships.
   */
  private async computeWorldChampionships(
    driverId: string,
  ): Promise<Result<number, string>> {
    try {
      // Fetch all seasons the driver has participated in
      const seasonsResponse = await this.client.fetch<ESeasonsResponse>(
        `drivers/${driverId}/seasons`,
      );
      if (!seasonsResponse || !seasonsResponse.MRData?.SeasonTable?.Seasons) {
        return err("No seasons found");
      }
      const seasons = seasonsResponse.MRData.SeasonTable.Seasons;

      // For each season check if the driver was champion (position 1 in standings)
      const championshipResults = await Promise.all(
        seasons.map(async (seasonObj: { season: string }) => {
          const season = seasonObj.season;
          try {
            const standingsResponse =
              await this.client.fetch<EDriverStandingsResponse>(
                `${season}/driverstandings/1`,
              );
            const standingsList =
              standingsResponse?.MRData?.StandingsTable?.StandingsLists?.[0];
            if (
              standingsList &&
              standingsList.DriverStandings &&
              standingsList.DriverStandings[0]?.Driver?.driverId === driverId
            ) {
              return 1;
            }
          } catch (e) {
            logger.error(`Error fetching standings for ${season}`, e);
          }
          return 0;
        }),
      );

      // Add all the seasons where the driver was the wdc
      const wdcCount = championshipResults.reduce(
        (sum: number, curr: number) => sum + curr,
        0,
      );
      return ok(wdcCount);
    } catch (error) {
      return err(`Error computing world championships: ${error}`);
    }
  }

  /**
   * Fetch the last N races for a driver
   * @param id - The driver ID
   * @param n - The number of results to fetch
   * @returns {Promise<Result<Race[], string>>} The last N race results
   */
  async getNRaces(id: string, n: number): Promise<Result<Race[], string>> {
    // Fetch the total number of results
    const driverResponse = await this.client.fetch<EResultsResponse>(
      `drivers/${id}/results`,
      1,
    );
    if (!driverResponse?.MRData?.RaceTable?.Races[0]) {
      return err("No results found");
    }

    const totalResults = parseInt(driverResponse.MRData.total || "0", 10);
    if (totalResults < n) {
      return err("No results found");
    }

    const offset = totalResults - n;

    // Fetch the last N races using the offset
    const resultsResponse = await this.client.fetch<EResultsResponse>(
      `drivers/${id}/results`,
      n,
      offset,
    );
    if (!resultsResponse?.MRData?.RaceTable?.Races[0]) {
      return err("No results found");
    }

    const recentRaces: Race[] =
      resultsResponse.MRData.RaceTable.Races.reverse().map((race) => ({
        name: race.raceName,
        country: {
          name: race.Circuit.Location.country,
          code:
            countries.getAlpha3Code(race.Circuit.Location.country, "en") || "",
        },
        date: race.date,
        position: parseInt(race.Results[0]?.position ?? "0", 10),
        team: {
          id: race.Results[0]?.Constructor.constructorId || "",
          name: race.Results[0]?.Constructor.name || "",
          wikipedia_url: race.Results[0]?.Constructor.url || "",
        },
        time: {
          millis: race.Results[0]?.Time?.millis
            ? parseInt(race.Results[0]?.Time?.millis ?? "0", 10)
            : 0,
          time: race.Results[0]?.Time?.time || "",
        },
        points: parseFloat(race.Results[0]?.points || "0"),
        fastest_lap: race.Results[0]?.FastestLap?.rank === "1",
      }));

    return ok(recentRaces);
  }

  /**
   * Fetches the main headshot image URL for a person given their Wikipedia page URL.
   * @param wikipediaUrl - The Wikipedia URL of the person's page
   * @returns {Promise<Result<string, string>>} The URL of the headshot image, or an error string
   */
  private async getWikipediaHeadshotFromUrl(
    wikipediaUrl: string,
  ): Promise<Result<string, string>> {
    try {
      // Extract the title from the Wikipedia URL
      const titleMatch = wikipediaUrl.match(/wiki\/(.+)$/);
      if (!titleMatch) {
        return err("Invalid Wikipedia URL");
      }

      const title = titleMatch[1];
      if (!title) {
        return err("Invalid Wikipedia URL");
      }

      const encodedTitle = encodeURIComponent(title);
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=pageimages&format=json&pithumbsize=500`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        return err("Error fetching data");
      }

      interface WikipediaApiResponse {
        query: {
          pages: {
            [pageId: string]: {
              pageid: number;
              ns: number;
              title: string;
              thumbnail?: {
                source: string;
                width: number;
                height: number;
              };
            };
          };
        };
      }

      const data = (await response.json()) as WikipediaApiResponse;
      const pages = data.query.pages;
      const page = Object.values(pages)[0];

      if (page && page.thumbnail && page.thumbnail.source) {
        return ok(page.thumbnail.source);
      } else {
        return err("No headshot found");
      }
    } catch {
      return err("Error fetching data");
    }
  }

  /**
   * Fetch a list of all drivers, past and present.
   *
   * @param {number} [year] - The year to fetch drivers for. If not provided, fetches all drivers.
   * @returns {Promise<EDriver[]>} - A promise that resolves to an array of driver information.
   */
  async getAllDrivers(year?: number): Promise<Result<EDriverResponse, string>> {
    try {
      if (year) {
        const response = await this.client.fetchAllPaginated<EDriverResponse>(
          `${year}/drivers`,
        );
        return ok(response);
      }
      const response =
        await this.client.fetchAllPaginated<EDriverResponse>("drivers");
      return ok(response);
    } catch (error) {
      return err("Error fetching drivers");
    }
  }
}
