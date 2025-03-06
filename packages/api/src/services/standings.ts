import { ok, err, type Result } from "@sapphire/result";
import type { API } from "../index.js";

import db from "@gridscout/db";

export class StandingsService {
  constructor(private readonly client: API) {}
}
