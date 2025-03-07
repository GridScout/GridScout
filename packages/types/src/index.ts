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
