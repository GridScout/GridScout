import { CalendarService } from "./services/calendar.js";
import { DriverService } from "./services/driver.js";
import { StandingsService } from "./services/standings.js";
import { getDrizzle } from "@gridscout/db/sqlite";
import { RedisCache } from "@gridscout/cache";
import { ResultsService } from "./services/results.js";
import { ConstructorService } from "./services/constructor.js";
import { CircuitService } from "./services/circuit.js";
export class API {
  public driver: DriverService;
  public calendar: CalendarService;
  public standings: StandingsService;
  public results: ResultsService;
  public team: ConstructorService;
  public circuit: CircuitService;

  constructor() {
    this.driver = new DriverService(this);
    this.calendar = new CalendarService(this);
    this.standings = new StandingsService(this);
    this.results = new ResultsService(this);
    // Must be named team, as constructor is a reserved word in TypeScript
    this.team = new ConstructorService(this);
    this.circuit = new CircuitService(this);
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
