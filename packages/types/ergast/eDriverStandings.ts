import { MRData, EDriver } from "@/types";

export interface EDriverStandingsResponse {
  MRData: MRData & {
    StandingsTable: EStandingsTable;
  };
}

export interface EStandingsTable {
  season: string;
  round: string;
  StandingsLists: EStandingsList[];
}

export interface EStandingsList {
  season: string;
  round: string;
  DriverStandings: EDriverStanding[];
}

export interface EDriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: EDriver;
  Constructors: EConstructor[];
}

export interface EConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}
