export interface MRData {
  xmlns: string;
  series: string;
  url: string;
  limit: string;
  offset: string;
  total: string;
}

// eSeasons

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

// eResults

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

// eRaces

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

// eDriverStandings

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

// eDriver

export interface EDriverResponse {
  MRData: MRData & {
    DriverTable: {
      season: string;
      Drivers: EDriver[];
    };
  };
}

export interface EDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

// eConstructorStandings

export interface EConstructorStandingsResponse {
  MRData: MRData & {
    StandingsTable: EConstructorStandingsTable;
  };
}

export interface EConstructorStandingsTable {
  season: string;
  round: string;
  StandingsLists: EConstructorStandingsList[];
}

export interface EConstructorStandingsList {
  season: string;
  round: string;
  ConstructorStandings: EConstructorStanding[];
}

export interface EConstructorStanding {
  position?: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: EConstructor;
}
