export interface Calendar {
  season: string;
  races: Race[];
}

interface Race {
  raceName: string;
  country: string;
  dates: RaceDates;
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
