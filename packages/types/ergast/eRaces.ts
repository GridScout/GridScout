import { MRData } from "@/types";

export interface ERacesResponse {
  MRData: MRData & {
    RaceTable: {
      season?: string;
      Races: ERace[];
    };
  };
}

export interface ERace {
  season: string;
  round: string;
  url?: string;
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
  // Event times
  time?: string;
  FirstPractice?: EventInfo;
  SecondPractice?: EventInfo;
  ThirdPractice?: EventInfo;
  Qualifying?: EventInfo;
  Sprint?: EventInfo;
  SprintQualifying?: EventInfo;
  SprintShootout?: EventInfo;
}

export interface EventInfo {
  date: string;
  time: string;
}
