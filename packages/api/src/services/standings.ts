import { ErgastClient } from "../index.js";

import { EDriverStandingsResponse } from "@gridscout/types/ergast";
import { DriverStandings } from "@gridscout/types";

import { err, ok, Result } from "@sapphire/result";

export class StandingsService {
  constructor(private readonly client: ErgastClient) {}

  async getDriverStandings(
    season: string = new Date().getFullYear().toString(),
    round?: number,
  ): Promise<Result<DriverStandings, string>> {
    const response = await this.client.fetch<EDriverStandingsResponse>(
      `${season}/${round ?? ""}/driverstandings`,
    );

    if (!response) {
      return err("Failed to fetch standings data");
    }

    if (!response.MRData.StandingsTable.StandingsLists.length) {
      return err("No standings data found");
    }

    const standingsList = response.MRData.StandingsTable.StandingsLists[0];
    if (!standingsList) {
      return err("Standings list is undefined");
    }

    const standingData: DriverStandings = {
      standings: standingsList.DriverStandings.map((standing) => ({
        position: standing.positionText,
        name: {
          first: standing.Driver.givenName,
          last: standing.Driver.familyName,
        },
        nationality: standing.Driver.nationality,
        points: standing.points,
        constructors: standing.Constructors.map((constructor) => ({
          id: constructor.constructorId,
          name: constructor.name,
        })),
      })),
    };

    return ok(standingData);
  }

  async getConstructorStandings(
    season: string = new Date().getFullYear().toString(),
    round?: number,
  ): Promise<Result<any, string>> {
    // TODO: Implement constructor standings interfaces
    const response = await this.client.fetch<any>(
      `${season}/${round ?? ""}/constructorstandings`,
    );

    if (!response) {
      return err("Failed to fetch constructor standings");
    }

    if (!response.MRData.StandingsTable.StandingsLists.length) {
      return err("No constructor standings data found");
    }

    const standingsList = response.MRData.StandingsTable.StandingsLists[0];

    if (!standingsList || !standingsList.ConstructorStandings) {
      return err("Constructor standings list is undefined");
    }

    // TODO: Implement constructor standings interfaces
    const constructorStandingsData: any = {
      standings: standingsList.ConstructorStandings.map((standing: any) => ({
        position: standing.positionText,
        points: standing.points,
        wins: standing.wins,
        nationality: standing.Constructor.nationality,
        team: [
          {
            id: standing.Constructor.constructorId,
            wikipedia_url: standing.Constructor.url,
            name: standing.Constructor.name,
          },
        ],
      })),
    };

    return ok(constructorStandingsData);
  }
}
