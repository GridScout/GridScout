export interface Race {
  name: string;
  country: {
    name: string;
    code: string;
  };
  team: {
    id: string;
    name: string;
    wikipedia_url: string;
  };
  date: string;
  position: number;
  time: {
    millis: number;
    time: string;
  };
  points: number;
  fastest_lap: boolean;
}
