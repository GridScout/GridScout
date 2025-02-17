import { MRData } from "@/types";

export interface ESeasonsResponse {
  MRData: MRData & {
    SeasonTable: {
      Seasons: Season[];
    };
  };
}

export interface Season {
  season: string;
  url: string;
}
