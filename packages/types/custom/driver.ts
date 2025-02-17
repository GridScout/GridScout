import { Race } from "@/types";

export interface Driver {
  acronym: string | null;
  number: string | null;
  name: {
    first: string;
    last: string;
  };
  constructors: {
    id: string;
    name: string;
    wikipedia_url: string;
  }[];
  dob: string | null;
  nationality: {
    name: string | null;
    country: string | null;
  };
  wikipedia_url: string | null;
  poster: string | null;
  statistics: {
    world_championships: number;
    grand_prix_entered: number;
    fastest_laps: number;
    points: number;
    podiums: number;
    highest_finish: {
      position: number;
      amount: number;
    };
    highest_grid: {
      position: number;
      amount: number;
    };
  };
  recent_races: Race[];
}
