import { EConstructor, MRData } from "@/types";

export interface EConstructorStandingsResponse {
  MRData: MRData & {
    StandingsTable: EConstructorStandingsTable;
  };
}

export interface EConstructorStandingsTable {
  season: string;
  round: string;
  StandingsLists: EConstructorStandingsList[];
}

export interface EConstructorStandingsList {
  season: string;
  round: string;
  ConstructorStandings: EConstructorStanding[];
}

export interface EConstructorStanding {
  position?: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: EConstructor;
}
