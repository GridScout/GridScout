// Calendar

export interface Calendar {
  season: string;
  races: {
    raceName: string;
    country: string | null;
    dates: RaceDates;
  }[];
}

export interface RaceDates {
  firstPractice?: RaceTimes;
  secondPractice?: RaceTimes;
  thirdPractice?: RaceTimes;
  sprintQualifying?: RaceTimes;
  sprint?: RaceTimes;
  qualifying?: RaceTimes;
  race: RaceTimes;
}

interface RaceTimes {
  date: string;
  time?: string;
}

// constructorStandings

export interface ConstructorStanding {
  // Possible values for position include:
  // E Excluded (2007 McLaren), D Disqualified, - for ineligible or the position as a string otherwise.
  position: string;
  points: string;
  wins: string;
  nationality: string;
  team: {
    id: string;
    wikipedia_url: string;
    name: string;
  }[];
}

export interface ConstructorStandings {
  standings: ConstructorStanding[];
}

// Driver

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

// driverStandings

export interface DriverStanding {
  // Possible values for position include:
  // E Excluded, D Disqualified (1997 Schumacher), - for ineligible or the position as a string otherwise.
  position: string;
  name: {
    first: string;
    last: string;
  };
  nationality: string;
  points: string;
  constructors: {
    id: string;
    name: string;
  }[];
}

export interface DriverStandings {
  standings: DriverStanding[];
}

// Race

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
