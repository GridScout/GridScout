import { CalendarService } from "./services/calendar.js";
import { DriverService } from "./services/driver.js";
import { StandingsService } from "./services/standings.js";
import { getDrizzle } from "@gridscout/db";
import { RedisCache } from "@gridscout/cache";
import { ResultsService } from "./services/results.js";

export class API {
  public driver: DriverService;
  public calendar: CalendarService;
  public standings: StandingsService;
  public results: ResultsService;

  constructor() {
    this.driver = new DriverService(this);
    this.calendar = new CalendarService(this);
    this.standings = new StandingsService(this);
    this.results = new ResultsService(this);
  }

  public async db() {
    return await getDrizzle();
  }

  public sanitiseInput(input: string): string {
    return input.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  }

  public async cache() {
    return new RedisCache();
  }
}
