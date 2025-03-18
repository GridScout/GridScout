export interface Driver {
  id: string;
  name: string;
  abbreviation: string;
  permanentNumber: string | null;
  dateOfBirth: string;
  dateOfDeath: string | null;
  placeOfBirth: string;
  nationality: Nationality;
  team: DriverConstructor;
  image: string;
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

interface Country {
  name: string;
  alpha3: string;
}

interface Nationality {
  id: string;
  alpha3: string;
  demonym: string;
}

interface DriverRecentRaces {
  id: string;
  name: string;
  country: Country;
  date: string;
  position: string;
  raceGap: string | null;
  raceTime: string | null;
}

export interface Calendar {
  season: number;
  races: CalendarRace[];
}

interface CalendarRace {
  id: string;
  name: string;
  country: Country;
  freePracticeOne?: Event;
  freePracticeTwo?: Event;
  freePracticeThree?: Event;
  sprintQualifying?: Event;
  sprintRace?: Event;
  qualifying: Event;
  grandPrix: Event;
}

interface Event {
  date: string;
  time: string;
}

export interface DriverStandings {
  season: number;
  standings: DriverStanding[];
}

interface DriverStanding {
  position: number;
  driver: DriverConstructor;
  team: DriverConstructor;
  points: number;
}

export interface ConstructorStandings {
  season: number;
  standings: ConstructorStanding[];
}

interface ConstructorStanding {
  position: number;
  constructor: DriverConstructor;
  engineManufacturer: string;
  points: number;
}

export type ResultTypes =
  | "FREE_PRACTICE_1_RESULT"
  | "FREE_PRACTICE_2_RESULT"
  | "FREE_PRACTICE_3_RESULT"
  | "QUALIFYING_RESULT"
  | "SPRINT_QUALIFYING_RESULT"
  | "SPRINT_RACE_RESULT"
  | "RACE_RESULT";

export interface Results {
  season: number;
  id: number;
  type: ResultTypes;
  results: Result[];
}

interface Result {
  driver: {
    id: string;
    name: string;
    country_alpha3: string;
  };
  position: number;
  position_text: string;
  retired_reason: string | null;
  sessions: {
    race_time?: string;
    race_gap?: string;
    free_practice_1_time?: string;
    free_practice_1_gap?: string;
    free_practice_2_time?: string;
    free_practice_2_gap?: string;
    free_practice_3_time?: string;
    free_practice_3_gap?: string;
    qualifying_time?: string;
    qualifying_gap?: string;
    sprint_qualifying_time?: string;
    sprint_qualifying_gap?: string;
    sprint_race_time?: string;
    sprint_race_gap?: string;
  }[];
}
