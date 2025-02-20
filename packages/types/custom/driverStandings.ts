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
