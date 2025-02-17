import { DriverStandings, EDriverStandingsResponse } from "@/types";
import { ErgastClient } from "../utils/request";
import { err, ok, Result } from "@sapphire/result";
import { ConstructorStandings } from "@/types/custom/constructorStandings"; // new import
import { EConstructorStandingsResponse } from "@/types/ergast/eConstructorStandings"; // used if needed

export class StandingsService {
  constructor(private readonly client: ErgastClient) {}

  async getDriverStandings(
    season: number = new Date().getFullYear(),
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
    season: number = new Date().getFullYear(),
    round?: number,
  ): Promise<Result<ConstructorStandings, string>> {
    // Fetch constructor standings
    const response = await this.client.fetch<EConstructorStandingsResponse>(
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

    const constructorStandingsData: ConstructorStandings = {
      standings: standingsList.ConstructorStandings.map((standing) => ({
        position: standing.positionText,
        points: standing.points,
        wins: standing.wins,
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
