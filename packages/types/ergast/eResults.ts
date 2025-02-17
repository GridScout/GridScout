import { EConstructor, EDriver, MRData } from "@/types";

export interface EResultsResponse {
  MRData: MRData & {
    RaceTable: {
      season: string;
      Races: EResults[];
    };
  };
}

export interface EResults {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time: string;
  Results: EResult[];
}

export interface EResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: EDriver;
  Constructor: EConstructor;
  grid: string;
  laps: string;
  status: string;
  Time: {
    millis: string;
    time: string;
  };
  FastestLap: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}
