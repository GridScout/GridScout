export interface ConstructorStanding {
  // Possible values for position include:
  // E Excluded (2007 McLaren), D Disqualified, - for ineligible or the position as a string otherwise.
  position: string;
  points: string;
  wins: string;
  team: {
    id: string;
    wikipedia_url: string;
    name: string;
  }[];
}

export interface ConstructorStandings {
  standings: ConstructorStanding[];
}
