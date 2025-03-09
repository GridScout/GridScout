import { ok, err, type Result } from "@sapphire/result";
import type { API } from "../index.js";

export class StandingsService {
  constructor(private readonly client: API) {}
}
