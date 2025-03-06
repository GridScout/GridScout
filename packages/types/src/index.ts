export interface Driver {
  id: string;
  name: string;
  abbreviation: string;
  permanentNumber: string | null;
  dateOfBirth: string;
  dateOfDeath: string | null;
  placeOfBirth: string;
  countryOfBirth: DriverCountry;
  team: DriverConstructor[];
  statistics: DriverStatistics;
  recentRaces: DriverRecentRaces[];
}

interface DriverConstructor {
  id: string;
  name: string;
}

interface DriverStatistics {
  worldChampionships: number;
  highestRaceFinish: number;
  highestGridPosition: number;
  racesEntered: number;
  podiums: number;
  points: number;
  fastestLaps: number;
  grandSlams: number;
}

interface DriverCountry {
  name: string;
  alpha3: string;
}

interface DriverRecentRaces {
  id: string;
  name: string;
  country: DriverCountry;
  date: string;
  position: string;
  raceGap: string;
}
