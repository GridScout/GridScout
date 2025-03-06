import { DriverService } from "./services/driver.js";

export class API {
  public driver: DriverService;

  constructor() {
    this.driver = new DriverService(this);
  }

  public sanitiseInput(input: string): string {
    return input.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  }
}
