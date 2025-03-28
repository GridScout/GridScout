import { relations } from "drizzle-orm";
import {
  foreignKey,
  int,
  numeric,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const chassis = sqliteTable(
  "chassis",
  {
    id: text("id").notNull().primaryKey(),
    constructor_id: text("constructor_id").notNull(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
  },
  (chassis) => ({
    chassis_constructor_fkey: foreignKey({
      name: "chassis_constructor_fkey",
      columns: [chassis.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
  }),
);

export const circuit = sqliteTable(
  "circuit",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
    previous_names: text("previous_names"),
    type: text("type").notNull(),
    direction: text("direction").notNull(),
    place_name: text("place_name").notNull(),
    country_id: text("country_id").notNull(),
    latitude: numeric("latitude").notNull(),
    longitude: numeric("longitude").notNull(),
    length: numeric("length").notNull(),
    turns: int("turns").notNull(),
    total_races_held: int("total_races_held").notNull(),
  },
  (circuit) => ({
    circuit_country_fkey: foreignKey({
      name: "circuit_country_fkey",
      columns: [circuit.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
  }),
);

export const constructor = sqliteTable(
  "constructor",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
    country_id: text("country_id").notNull(),
    best_championship_position: int("best_championship_position"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_championship_wins: int("total_championship_wins").notNull(),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_1_and_2_finishes: int("total_1_and_2_finishes").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_points: numeric("total_points").notNull(),
    total_championship_points: numeric("total_championship_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (constructor) => ({
    constructor_country_fkey: foreignKey({
      name: "constructor_country_fkey",
      columns: [constructor.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
  }),
);

export const constructor_chronology = sqliteTable(
  "constructor_chronology",
  {
    constructor_id: text("constructor_id").notNull(),
    position_display_order: int("position_display_order").notNull(),
    other_constructor_id: text("other_constructor_id").notNull(),
    year_from: int("year_from").notNull(),
    year_to: int("year_to"),
  },
  (constructor_chronology) => ({
    constructor_chronology_constructor_constructor_chronology_other_constructor_idToconstructor_fkey:
      foreignKey({
        name: "constructor_chronology_constructor_constructor_chronology_other_constructor_idToconstructor_fkey",
        columns: [constructor_chronology.other_constructor_id],
        foreignColumns: [constructor.id],
      }).onUpdate("cascade"),
    constructor_chronology_constructor_constructor_chronology_constructor_idToconstructor_fkey:
      foreignKey({
        name: "constructor_chronology_constructor_constructor_chronology_constructor_idToconstructor_fkey",
        columns: [constructor_chronology.constructor_id],
        foreignColumns: [constructor.id],
      }).onUpdate("cascade"),
    constructor_chronology_constructor_id_other_constructor_id_year_from_year_to_unique_idx:
      uniqueIndex(
        "constructor_chronology_constructor_id_other_constructor_id_year_from_year_to_key",
      ).on(
        constructor_chronology.constructor_id,
        constructor_chronology.other_constructor_id,
        constructor_chronology.year_from,
        constructor_chronology.year_to,
      ),
    constructor_chronology_cpk: primaryKey({
      name: "constructor_chronology_cpk",
      columns: [
        constructor_chronology.constructor_id,
        constructor_chronology.position_display_order,
      ],
    }),
  }),
);

export const continent = sqliteTable("continent", {
  id: text("id").notNull().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull().unique(),
  demonym: text("demonym").notNull(),
});

export const country = sqliteTable(
  "country",
  {
    id: text("id").notNull().primaryKey(),
    alpha2_code: text("alpha2_code").notNull().unique(),
    alpha3_code: text("alpha3_code").notNull().unique(),
    name: text("name").notNull().unique(),
    demonym: text("demonym"),
    continent_id: text("continent_id").notNull(),
  },
  (country) => ({
    country_continent_fkey: foreignKey({
      name: "country_continent_fkey",
      columns: [country.continent_id],
      foreignColumns: [continent.id],
    }).onUpdate("cascade"),
  }),
);

export const driver = sqliteTable(
  "driver",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    full_name: text("full_name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    permanent_number: text("permanent_number"),
    gender: text("gender").notNull(),
    date_of_birth: numeric("date_of_birth").notNull(),
    date_of_death: numeric("date_of_death"),
    place_of_birth: text("place_of_birth").notNull(),
    country_of_birth_country_id: text("country_of_birth_country_id").notNull(),
    nationality_country_id: text("nationality_country_id").notNull(),
    second_nationality_country_id: text("second_nationality_country_id"),
    best_championship_position: int("best_championship_position"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_championship_wins: int("total_championship_wins").notNull(),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_points: numeric("total_points").notNull(),
    total_championship_points: numeric("total_championship_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
    total_driver_of_the_day: int("total_driver_of_the_day").notNull(),
    total_grand_slams: int("total_grand_slams").notNull(),
  },
  (driver) => ({
    driver_country_driver_second_nationality_country_idTocountry_fkey:
      foreignKey({
        name: "driver_country_driver_second_nationality_country_idTocountry_fkey",
        columns: [driver.second_nationality_country_id],
        foreignColumns: [country.id],
      }).onUpdate("cascade"),
    driver_country_driver_nationality_country_idTocountry_fkey: foreignKey({
      name: "driver_country_driver_nationality_country_idTocountry_fkey",
      columns: [driver.nationality_country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
    driver_country_driver_country_of_birth_country_idTocountry_fkey: foreignKey(
      {
        name: "driver_country_driver_country_of_birth_country_idTocountry_fkey",
        columns: [driver.country_of_birth_country_id],
        foreignColumns: [country.id],
      },
    ).onUpdate("cascade"),
  }),
);

export const driver_family_relationship = sqliteTable(
  "driver_family_relationship",
  {
    driver_id: text("driver_id").notNull(),
    position_display_order: int("position_display_order").notNull(),
    other_driver_id: text("other_driver_id").notNull(),
    type: text("type").notNull(),
  },
  (driver_family_relationship) => ({
    driver_family_relationship_driver_driver_family_relationship_other_driver_idTodriver_fkey:
      foreignKey({
        name: "driver_family_relationship_driver_driver_family_relationship_other_driver_idTodriver_fkey",
        columns: [driver_family_relationship.other_driver_id],
        foreignColumns: [driver.id],
      }).onUpdate("cascade"),
    driver_family_relationship_driver_driver_family_relationship_driver_idTodriver_fkey:
      foreignKey({
        name: "driver_family_relationship_driver_driver_family_relationship_driver_idTodriver_fkey",
        columns: [driver_family_relationship.driver_id],
        foreignColumns: [driver.id],
      }).onUpdate("cascade"),
    driver_family_relationship_driver_id_other_driver_id_type_unique_idx:
      uniqueIndex(
        "driver_family_relationship_driver_id_other_driver_id_type_key",
      ).on(
        driver_family_relationship.driver_id,
        driver_family_relationship.other_driver_id,
        driver_family_relationship.type,
      ),
    driver_family_relationship_cpk: primaryKey({
      name: "driver_family_relationship_cpk",
      columns: [
        driver_family_relationship.driver_id,
        driver_family_relationship.position_display_order,
      ],
    }),
  }),
);

export const engine = sqliteTable(
  "engine",
  {
    id: text("id").notNull().primaryKey(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
    capacity: numeric("capacity"),
    configuration: text("configuration"),
    aspiration: text("aspiration"),
  },
  (engine) => ({
    engine_engine_manufacturer_fkey: foreignKey({
      name: "engine_engine_manufacturer_fkey",
      columns: [engine.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
  }),
);

export const engine_manufacturer = sqliteTable(
  "engine_manufacturer",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    country_id: text("country_id").notNull(),
    best_championship_position: int("best_championship_position"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_championship_wins: int("total_championship_wins").notNull(),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_points: numeric("total_points").notNull(),
    total_championship_points: numeric("total_championship_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (engine_manufacturer) => ({
    engine_manufacturer_country_fkey: foreignKey({
      name: "engine_manufacturer_country_fkey",
      columns: [engine_manufacturer.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
  }),
);

export const entrant = sqliteTable("entrant", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
});

export const grand_prix = sqliteTable(
  "grand_prix",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
    short_name: text("short_name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    country_id: text("country_id"),
    total_races_held: int("total_races_held").notNull(),
  },
  (grand_prix) => ({
    grand_prix_country_fkey: foreignKey({
      name: "grand_prix_country_fkey",
      columns: [grand_prix.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
  }),
);

export const race = sqliteTable(
  "race",
  {
    id: int("id").notNull().primaryKey(),
    year: int("year").notNull(),
    round: int("round").notNull(),
    date: numeric("date").notNull(),
    time: text("time"),
    grand_prix_id: text("grand_prix_id").notNull(),
    official_name: text("official_name").notNull(),
    qualifying_format: text("qualifying_format").notNull(),
    sprint_qualifying_format: text("sprint_qualifying_format"),
    circuit_id: text("circuit_id").notNull(),
    circuit_type: text("circuit_type").notNull(),
    direction: text("direction").notNull(),
    course_length: numeric("course_length").notNull(),
    turns: int("turns").notNull(),
    laps: int("laps").notNull(),
    distance: numeric("distance").notNull(),
    scheduled_laps: int("scheduled_laps"),
    scheduled_distance: numeric("scheduled_distance"),
    drivers_championship_decider: int("drivers_championship_decider", {
      mode: "boolean",
    }),
    constructors_championship_decider: int(
      "constructors_championship_decider",
      { mode: "boolean" },
    ),
    pre_qualifying_date: numeric("pre_qualifying_date"),
    pre_qualifying_time: text("pre_qualifying_time"),
    free_practice_1_date: numeric("free_practice_1_date"),
    free_practice_1_time: text("free_practice_1_time"),
    free_practice_2_date: numeric("free_practice_2_date"),
    free_practice_2_time: text("free_practice_2_time"),
    free_practice_3_date: numeric("free_practice_3_date"),
    free_practice_3_time: text("free_practice_3_time"),
    free_practice_4_date: numeric("free_practice_4_date"),
    free_practice_4_time: text("free_practice_4_time"),
    qualifying_1_date: numeric("qualifying_1_date"),
    qualifying_1_time: text("qualifying_1_time"),
    qualifying_2_date: numeric("qualifying_2_date"),
    qualifying_2_time: text("qualifying_2_time"),
    qualifying_date: numeric("qualifying_date"),
    qualifying_time: text("qualifying_time"),
    sprint_qualifying_date: numeric("sprint_qualifying_date"),
    sprint_qualifying_time: text("sprint_qualifying_time"),
    sprint_race_date: numeric("sprint_race_date"),
    sprint_race_time: text("sprint_race_time"),
    warming_up_date: numeric("warming_up_date"),
    warming_up_time: text("warming_up_time"),
  },
  (race) => ({
    race_circuit_fkey: foreignKey({
      name: "race_circuit_fkey",
      columns: [race.circuit_id],
      foreignColumns: [circuit.id],
    }).onUpdate("cascade"),
    race_grand_prix_fkey: foreignKey({
      name: "race_grand_prix_fkey",
      columns: [race.grand_prix_id],
      foreignColumns: [grand_prix.id],
    }).onUpdate("cascade"),
    race_season_fkey: foreignKey({
      name: "race_season_fkey",
      columns: [race.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    race_year_round_unique_idx: uniqueIndex("race_year_round_key").on(
      race.year,
      race.round,
    ),
  }),
);

export const race_constructor_standing = sqliteTable(
  "race_constructor_standing",
  {
    race_id: int("race_id").notNull(),
    position_display_order: int("position_display_order").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    points: numeric("points").notNull(),
    positions_gained: int("positions_gained"),
  },
  (race_constructor_standing) => ({
    race_constructor_standing_engine_manufacturer_fkey: foreignKey({
      name: "race_constructor_standing_engine_manufacturer_fkey",
      columns: [race_constructor_standing.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    race_constructor_standing_constructor_fkey: foreignKey({
      name: "race_constructor_standing_constructor_fkey",
      columns: [race_constructor_standing.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    race_constructor_standing_race_fkey: foreignKey({
      name: "race_constructor_standing_race_fkey",
      columns: [race_constructor_standing.race_id],
      foreignColumns: [race.id],
    }).onUpdate("cascade"),
    race_constructor_standing_cpk: primaryKey({
      name: "race_constructor_standing_cpk",
      columns: [
        race_constructor_standing.race_id,
        race_constructor_standing.position_display_order,
      ],
    }),
  }),
);

export const race_data = sqliteTable(
  "race_data",
  {
    race_id: int("race_id").notNull(),
    type: text("type").notNull(),
    position_display_order: int("position_display_order").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text").notNull(),
    driver_number: text("driver_number").notNull(),
    driver_id: text("driver_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    tyre_manufacturer_id: text("tyre_manufacturer_id").notNull(),
    practice_time: text("practice_time"),
    practice_time_millis: int("practice_time_millis"),
    practice_gap: text("practice_gap"),
    practice_gap_millis: int("practice_gap_millis"),
    practice_interval: text("practice_interval"),
    practice_interval_millis: int("practice_interval_millis"),
    practice_laps: int("practice_laps"),
    qualifying_time: text("qualifying_time"),
    qualifying_time_millis: int("qualifying_time_millis"),
    qualifying_q1: text("qualifying_q1"),
    qualifying_q1_millis: int("qualifying_q1_millis"),
    qualifying_q2: text("qualifying_q2"),
    qualifying_q2_millis: int("qualifying_q2_millis"),
    qualifying_q3: text("qualifying_q3"),
    qualifying_q3_millis: int("qualifying_q3_millis"),
    qualifying_gap: text("qualifying_gap"),
    qualifying_gap_millis: int("qualifying_gap_millis"),
    qualifying_interval: text("qualifying_interval"),
    qualifying_interval_millis: int("qualifying_interval_millis"),
    qualifying_laps: int("qualifying_laps"),
    starting_grid_position_qualification_position_number: int(
      "starting_grid_position_qualification_position_number",
    ),
    starting_grid_position_qualification_position_text: text(
      "starting_grid_position_qualification_position_text",
    ),
    starting_grid_position_grid_penalty: text(
      "starting_grid_position_grid_penalty",
    ),
    starting_grid_position_grid_penalty_positions: int(
      "starting_grid_position_grid_penalty_positions",
    ),
    starting_grid_position_time: text("starting_grid_position_time"),
    starting_grid_position_time_millis: int(
      "starting_grid_position_time_millis",
    ),
    race_shared_car: int("race_shared_car", { mode: "boolean" }),
    race_laps: int("race_laps"),
    race_time: text("race_time"),
    race_time_millis: int("race_time_millis"),
    race_time_penalty: text("race_time_penalty"),
    race_time_penalty_millis: int("race_time_penalty_millis"),
    race_gap: text("race_gap"),
    race_gap_millis: int("race_gap_millis"),
    race_gap_laps: int("race_gap_laps"),
    race_interval: text("race_interval"),
    race_interval_millis: int("race_interval_millis"),
    race_reason_retired: text("race_reason_retired"),
    race_points: numeric("race_points"),
    race_pole_position: int("race_pole_position", { mode: "boolean" }),
    race_qualification_position_number: int(
      "race_qualification_position_number",
    ),
    race_qualification_position_text: text("race_qualification_position_text"),
    race_grid_position_number: int("race_grid_position_number"),
    race_grid_position_text: text("race_grid_position_text"),
    race_positions_gained: int("race_positions_gained"),
    race_pit_stops: int("race_pit_stops"),
    race_fastest_lap: int("race_fastest_lap", { mode: "boolean" }),
    race_driver_of_the_day: int("race_driver_of_the_day", { mode: "boolean" }),
    race_grand_slam: int("race_grand_slam", { mode: "boolean" }),
    fastest_lap_lap: int("fastest_lap_lap"),
    fastest_lap_time: text("fastest_lap_time"),
    fastest_lap_time_millis: int("fastest_lap_time_millis"),
    fastest_lap_gap: text("fastest_lap_gap"),
    fastest_lap_gap_millis: int("fastest_lap_gap_millis"),
    fastest_lap_interval: text("fastest_lap_interval"),
    fastest_lap_interval_millis: int("fastest_lap_interval_millis"),
    pit_stop_stop: int("pit_stop_stop"),
    pit_stop_lap: int("pit_stop_lap"),
    pit_stop_time: text("pit_stop_time"),
    pit_stop_time_millis: int("pit_stop_time_millis"),
    driver_of_the_day_percentage: numeric("driver_of_the_day_percentage"),
  },
  (race_data) => ({
    race_data_tyre_manufacturer_fkey: foreignKey({
      name: "race_data_tyre_manufacturer_fkey",
      columns: [race_data.tyre_manufacturer_id],
      foreignColumns: [tyre_manufacturer.id],
    }).onUpdate("cascade"),
    race_data_engine_manufacturer_fkey: foreignKey({
      name: "race_data_engine_manufacturer_fkey",
      columns: [race_data.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    race_data_constructor_fkey: foreignKey({
      name: "race_data_constructor_fkey",
      columns: [race_data.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    race_data_driver_fkey: foreignKey({
      name: "race_data_driver_fkey",
      columns: [race_data.driver_id],
      foreignColumns: [driver.id],
    }).onUpdate("cascade"),
    race_data_race_fkey: foreignKey({
      name: "race_data_race_fkey",
      columns: [race_data.race_id],
      foreignColumns: [race.id],
    }).onUpdate("cascade"),
    race_data_cpk: primaryKey({
      name: "race_data_cpk",
      columns: [
        race_data.race_id,
        race_data.type,
        race_data.position_display_order,
      ],
    }),
  }),
);

export const race_driver_standing = sqliteTable(
  "race_driver_standing",
  {
    race_id: int("race_id").notNull(),
    position_display_order: int("position_display_order").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text").notNull(),
    driver_id: text("driver_id").notNull(),
    points: numeric("points").notNull(),
    positions_gained: int("positions_gained"),
  },
  (race_driver_standing) => ({
    race_driver_standing_driver_fkey: foreignKey({
      name: "race_driver_standing_driver_fkey",
      columns: [race_driver_standing.driver_id],
      foreignColumns: [driver.id],
    }).onUpdate("cascade"),
    race_driver_standing_race_fkey: foreignKey({
      name: "race_driver_standing_race_fkey",
      columns: [race_driver_standing.race_id],
      foreignColumns: [race.id],
    }).onUpdate("cascade"),
    race_driver_standing_cpk: primaryKey({
      name: "race_driver_standing_cpk",
      columns: [
        race_driver_standing.race_id,
        race_driver_standing.position_display_order,
      ],
    }),
  }),
);

export const season = sqliteTable("season", {
  year: int("year").notNull().primaryKey(),
});

export const season_constructor = sqliteTable(
  "season_constructor",
  {
    year: int("year").notNull(),
    constructor_id: text("constructor_id").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_1_and_2_finishes: int("total_1_and_2_finishes").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_points: numeric("total_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (season_constructor) => ({
    season_constructor_constructor_fkey: foreignKey({
      name: "season_constructor_constructor_fkey",
      columns: [season_constructor.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_constructor_season_fkey: foreignKey({
      name: "season_constructor_season_fkey",
      columns: [season_constructor.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_constructor_cpk: primaryKey({
      name: "season_constructor_cpk",
      columns: [season_constructor.year, season_constructor.constructor_id],
    }),
  }),
);

export const season_constructor_standing = sqliteTable(
  "season_constructor_standing",
  {
    year: int("year").notNull(),
    position_display_order: int("position_display_order").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    points: numeric("points").notNull(),
  },
  (season_constructor_standing) => ({
    season_constructor_standing_engine_manufacturer_fkey: foreignKey({
      name: "season_constructor_standing_engine_manufacturer_fkey",
      columns: [season_constructor_standing.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_constructor_standing_constructor_fkey: foreignKey({
      name: "season_constructor_standing_constructor_fkey",
      columns: [season_constructor_standing.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_constructor_standing_season_fkey: foreignKey({
      name: "season_constructor_standing_season_fkey",
      columns: [season_constructor_standing.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_constructor_standing_cpk: primaryKey({
      name: "season_constructor_standing_cpk",
      columns: [
        season_constructor_standing.year,
        season_constructor_standing.position_display_order,
      ],
    }),
  }),
);

export const season_driver = sqliteTable(
  "season_driver",
  {
    year: int("year").notNull(),
    driver_id: text("driver_id").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_points: numeric("total_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
    total_driver_of_the_day: int("total_driver_of_the_day").notNull(),
    total_grand_slams: int("total_grand_slams").notNull(),
  },
  (season_driver) => ({
    season_driver_driver_fkey: foreignKey({
      name: "season_driver_driver_fkey",
      columns: [season_driver.driver_id],
      foreignColumns: [driver.id],
    }).onUpdate("cascade"),
    season_driver_season_fkey: foreignKey({
      name: "season_driver_season_fkey",
      columns: [season_driver.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_driver_cpk: primaryKey({
      name: "season_driver_cpk",
      columns: [season_driver.year, season_driver.driver_id],
    }),
  }),
);

export const season_driver_standing = sqliteTable(
  "season_driver_standing",
  {
    year: int("year").notNull(),
    position_display_order: int("position_display_order").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text").notNull(),
    driver_id: text("driver_id").notNull(),
    points: numeric("points").notNull(),
  },
  (season_driver_standing) => ({
    season_driver_standing_driver_fkey: foreignKey({
      name: "season_driver_standing_driver_fkey",
      columns: [season_driver_standing.driver_id],
      foreignColumns: [driver.id],
    }).onUpdate("cascade"),
    season_driver_standing_season_fkey: foreignKey({
      name: "season_driver_standing_season_fkey",
      columns: [season_driver_standing.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_driver_standing_cpk: primaryKey({
      name: "season_driver_standing_cpk",
      columns: [
        season_driver_standing.year,
        season_driver_standing.position_display_order,
      ],
    }),
  }),
);

export const season_engine_manufacturer = sqliteTable(
  "season_engine_manufacturer",
  {
    year: int("year").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    position_number: int("position_number"),
    position_text: text("position_text"),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_points: numeric("total_points").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (season_engine_manufacturer) => ({
    season_engine_manufacturer_engine_manufacturer_fkey: foreignKey({
      name: "season_engine_manufacturer_engine_manufacturer_fkey",
      columns: [season_engine_manufacturer.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_engine_manufacturer_season_fkey: foreignKey({
      name: "season_engine_manufacturer_season_fkey",
      columns: [season_engine_manufacturer.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_engine_manufacturer_cpk: primaryKey({
      name: "season_engine_manufacturer_cpk",
      columns: [
        season_engine_manufacturer.year,
        season_engine_manufacturer.engine_manufacturer_id,
      ],
    }),
  }),
);

export const season_entrant = sqliteTable(
  "season_entrant",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    country_id: text("country_id").notNull(),
  },
  (season_entrant) => ({
    season_entrant_country_fkey: foreignKey({
      name: "season_entrant_country_fkey",
      columns: [season_entrant.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
    season_entrant_entrant_fkey: foreignKey({
      name: "season_entrant_entrant_fkey",
      columns: [season_entrant.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_season_fkey: foreignKey({
      name: "season_entrant_season_fkey",
      columns: [season_entrant.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_cpk: primaryKey({
      name: "season_entrant_cpk",
      columns: [season_entrant.year, season_entrant.entrant_id],
    }),
  }),
);

export const season_entrant_chassis = sqliteTable(
  "season_entrant_chassis",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    chassis_id: text("chassis_id").notNull(),
  },
  (season_entrant_chassis) => ({
    season_entrant_chassis_chassis_fkey: foreignKey({
      name: "season_entrant_chassis_chassis_fkey",
      columns: [season_entrant_chassis.chassis_id],
      foreignColumns: [chassis.id],
    }).onUpdate("cascade"),
    season_entrant_chassis_engine_manufacturer_fkey: foreignKey({
      name: "season_entrant_chassis_engine_manufacturer_fkey",
      columns: [season_entrant_chassis.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_chassis_constructor_fkey: foreignKey({
      name: "season_entrant_chassis_constructor_fkey",
      columns: [season_entrant_chassis.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_entrant_chassis_entrant_fkey: foreignKey({
      name: "season_entrant_chassis_entrant_fkey",
      columns: [season_entrant_chassis.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_chassis_season_fkey: foreignKey({
      name: "season_entrant_chassis_season_fkey",
      columns: [season_entrant_chassis.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_chassis_cpk: primaryKey({
      name: "season_entrant_chassis_cpk",
      columns: [
        season_entrant_chassis.year,
        season_entrant_chassis.entrant_id,
        season_entrant_chassis.constructor_id,
        season_entrant_chassis.engine_manufacturer_id,
        season_entrant_chassis.chassis_id,
      ],
    }),
  }),
);

export const season_entrant_constructor = sqliteTable(
  "season_entrant_constructor",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
  },
  (season_entrant_constructor) => ({
    season_entrant_constructor_engine_manufacturer_fkey: foreignKey({
      name: "season_entrant_constructor_engine_manufacturer_fkey",
      columns: [season_entrant_constructor.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_constructor_constructor_fkey: foreignKey({
      name: "season_entrant_constructor_constructor_fkey",
      columns: [season_entrant_constructor.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_entrant_constructor_entrant_fkey: foreignKey({
      name: "season_entrant_constructor_entrant_fkey",
      columns: [season_entrant_constructor.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_constructor_season_fkey: foreignKey({
      name: "season_entrant_constructor_season_fkey",
      columns: [season_entrant_constructor.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_constructor_cpk: primaryKey({
      name: "season_entrant_constructor_cpk",
      columns: [
        season_entrant_constructor.year,
        season_entrant_constructor.entrant_id,
        season_entrant_constructor.constructor_id,
        season_entrant_constructor.engine_manufacturer_id,
      ],
    }),
  }),
);

export const season_entrant_driver = sqliteTable(
  "season_entrant_driver",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    driver_id: text("driver_id").notNull(),
    rounds: text("rounds"),
    rounds_text: text("rounds_text"),
    test_driver: int("test_driver", { mode: "boolean" }).notNull(),
  },
  (season_entrant_driver) => ({
    season_entrant_driver_driver_fkey: foreignKey({
      name: "season_entrant_driver_driver_fkey",
      columns: [season_entrant_driver.driver_id],
      foreignColumns: [driver.id],
    }).onUpdate("cascade"),
    season_entrant_driver_engine_manufacturer_fkey: foreignKey({
      name: "season_entrant_driver_engine_manufacturer_fkey",
      columns: [season_entrant_driver.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_driver_constructor_fkey: foreignKey({
      name: "season_entrant_driver_constructor_fkey",
      columns: [season_entrant_driver.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_entrant_driver_entrant_fkey: foreignKey({
      name: "season_entrant_driver_entrant_fkey",
      columns: [season_entrant_driver.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_driver_season_fkey: foreignKey({
      name: "season_entrant_driver_season_fkey",
      columns: [season_entrant_driver.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_driver_cpk: primaryKey({
      name: "season_entrant_driver_cpk",
      columns: [
        season_entrant_driver.year,
        season_entrant_driver.entrant_id,
        season_entrant_driver.constructor_id,
        season_entrant_driver.engine_manufacturer_id,
        season_entrant_driver.driver_id,
      ],
    }),
  }),
);

export const season_entrant_engine = sqliteTable(
  "season_entrant_engine",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    engine_id: text("engine_id").notNull(),
  },
  (season_entrant_engine) => ({
    season_entrant_engine_engine_fkey: foreignKey({
      name: "season_entrant_engine_engine_fkey",
      columns: [season_entrant_engine.engine_id],
      foreignColumns: [engine.id],
    }).onUpdate("cascade"),
    season_entrant_engine_engine_manufacturer_fkey: foreignKey({
      name: "season_entrant_engine_engine_manufacturer_fkey",
      columns: [season_entrant_engine.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_engine_constructor_fkey: foreignKey({
      name: "season_entrant_engine_constructor_fkey",
      columns: [season_entrant_engine.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_entrant_engine_entrant_fkey: foreignKey({
      name: "season_entrant_engine_entrant_fkey",
      columns: [season_entrant_engine.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_engine_season_fkey: foreignKey({
      name: "season_entrant_engine_season_fkey",
      columns: [season_entrant_engine.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_engine_cpk: primaryKey({
      name: "season_entrant_engine_cpk",
      columns: [
        season_entrant_engine.year,
        season_entrant_engine.entrant_id,
        season_entrant_engine.constructor_id,
        season_entrant_engine.engine_manufacturer_id,
        season_entrant_engine.engine_id,
      ],
    }),
  }),
);

export const season_entrant_tyre_manufacturer = sqliteTable(
  "season_entrant_tyre_manufacturer",
  {
    year: int("year").notNull(),
    entrant_id: text("entrant_id").notNull(),
    constructor_id: text("constructor_id").notNull(),
    engine_manufacturer_id: text("engine_manufacturer_id").notNull(),
    tyre_manufacturer_id: text("tyre_manufacturer_id").notNull(),
  },
  (season_entrant_tyre_manufacturer) => ({
    season_entrant_tyre_manufacturer_tyre_manufacturer_fkey: foreignKey({
      name: "season_entrant_tyre_manufacturer_tyre_manufacturer_fkey",
      columns: [season_entrant_tyre_manufacturer.tyre_manufacturer_id],
      foreignColumns: [tyre_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_tyre_manufacturer_engine_manufacturer_fkey: foreignKey({
      name: "season_entrant_tyre_manufacturer_engine_manufacturer_fkey",
      columns: [season_entrant_tyre_manufacturer.engine_manufacturer_id],
      foreignColumns: [engine_manufacturer.id],
    }).onUpdate("cascade"),
    season_entrant_tyre_manufacturer_constructor_fkey: foreignKey({
      name: "season_entrant_tyre_manufacturer_constructor_fkey",
      columns: [season_entrant_tyre_manufacturer.constructor_id],
      foreignColumns: [constructor.id],
    }).onUpdate("cascade"),
    season_entrant_tyre_manufacturer_entrant_fkey: foreignKey({
      name: "season_entrant_tyre_manufacturer_entrant_fkey",
      columns: [season_entrant_tyre_manufacturer.entrant_id],
      foreignColumns: [entrant.id],
    }).onUpdate("cascade"),
    season_entrant_tyre_manufacturer_season_fkey: foreignKey({
      name: "season_entrant_tyre_manufacturer_season_fkey",
      columns: [season_entrant_tyre_manufacturer.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_entrant_tyre_manufacturer_cpk: primaryKey({
      name: "season_entrant_tyre_manufacturer_cpk",
      columns: [
        season_entrant_tyre_manufacturer.year,
        season_entrant_tyre_manufacturer.entrant_id,
        season_entrant_tyre_manufacturer.constructor_id,
        season_entrant_tyre_manufacturer.engine_manufacturer_id,
        season_entrant_tyre_manufacturer.tyre_manufacturer_id,
      ],
    }),
  }),
);

export const season_tyre_manufacturer = sqliteTable(
  "season_tyre_manufacturer",
  {
    year: int("year").notNull(),
    tyre_manufacturer_id: text("tyre_manufacturer_id").notNull(),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (season_tyre_manufacturer) => ({
    season_tyre_manufacturer_tyre_manufacturer_fkey: foreignKey({
      name: "season_tyre_manufacturer_tyre_manufacturer_fkey",
      columns: [season_tyre_manufacturer.tyre_manufacturer_id],
      foreignColumns: [tyre_manufacturer.id],
    }).onUpdate("cascade"),
    season_tyre_manufacturer_season_fkey: foreignKey({
      name: "season_tyre_manufacturer_season_fkey",
      columns: [season_tyre_manufacturer.year],
      foreignColumns: [season.year],
    }).onUpdate("cascade"),
    season_tyre_manufacturer_cpk: primaryKey({
      name: "season_tyre_manufacturer_cpk",
      columns: [
        season_tyre_manufacturer.year,
        season_tyre_manufacturer.tyre_manufacturer_id,
      ],
    }),
  }),
);

export const tyre_manufacturer = sqliteTable(
  "tyre_manufacturer",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    country_id: text("country_id").notNull(),
    best_starting_grid_position: int("best_starting_grid_position"),
    best_race_result: int("best_race_result"),
    total_race_entries: int("total_race_entries").notNull(),
    total_race_starts: int("total_race_starts").notNull(),
    total_race_wins: int("total_race_wins").notNull(),
    total_race_laps: int("total_race_laps").notNull(),
    total_podiums: int("total_podiums").notNull(),
    total_podium_races: int("total_podium_races").notNull(),
    total_pole_positions: int("total_pole_positions").notNull(),
    total_fastest_laps: int("total_fastest_laps").notNull(),
  },
  (tyre_manufacturer) => ({
    tyre_manufacturer_country_fkey: foreignKey({
      name: "tyre_manufacturer_country_fkey",
      columns: [tyre_manufacturer.country_id],
      foreignColumns: [country.id],
    }).onUpdate("cascade"),
  }),
);

export const chassisRelations = relations(chassis, ({ one, many }) => ({
  constructor: one(constructor, {
    relationName: "chassisToconstructor",
    fields: [chassis.constructor_id],
    references: [constructor.id],
  }),
  season_entrant_chassis: many(season_entrant_chassis, {
    relationName: "chassisToseason_entrant_chassis",
  }),
}));

export const circuitRelations = relations(circuit, ({ one, many }) => ({
  country: one(country, {
    relationName: "circuitTocountry",
    fields: [circuit.country_id],
    references: [country.id],
  }),
  race: many(race, {
    relationName: "circuitTorace",
  }),
}));

export const constructorRelations = relations(constructor, ({ many, one }) => ({
  chassis: many(chassis, {
    relationName: "chassisToconstructor",
  }),
  country: one(country, {
    relationName: "constructorTocountry",
    fields: [constructor.country_id],
    references: [country.id],
  }),
  constructor_chronology_constructor_chronology_other_constructor_idToconstructor:
    many(constructor_chronology, {
      relationName: "constructor_chronology_other_constructor_idToconstructor",
    }),
  constructor_chronology_constructor_chronology_constructor_idToconstructor:
    many(constructor_chronology, {
      relationName: "constructor_chronology_constructor_idToconstructor",
    }),
  race_constructor_standing: many(race_constructor_standing, {
    relationName: "constructorTorace_constructor_standing",
  }),
  race_data: many(race_data, {
    relationName: "constructorTorace_data",
  }),
  season_constructor: many(season_constructor, {
    relationName: "constructorToseason_constructor",
  }),
  season_constructor_standing: many(season_constructor_standing, {
    relationName: "constructorToseason_constructor_standing",
  }),
  season_entrant_chassis: many(season_entrant_chassis, {
    relationName: "constructorToseason_entrant_chassis",
  }),
  season_entrant_constructor: many(season_entrant_constructor, {
    relationName: "constructorToseason_entrant_constructor",
  }),
  season_entrant_driver: many(season_entrant_driver, {
    relationName: "constructorToseason_entrant_driver",
  }),
  season_entrant_engine: many(season_entrant_engine, {
    relationName: "constructorToseason_entrant_engine",
  }),
  season_entrant_tyre_manufacturer: many(season_entrant_tyre_manufacturer, {
    relationName: "constructorToseason_entrant_tyre_manufacturer",
  }),
}));

export const constructor_chronologyRelations = relations(
  constructor_chronology,
  ({ one }) => ({
    constructor_constructor_chronology_other_constructor_idToconstructor: one(
      constructor,
      {
        relationName:
          "constructor_chronology_other_constructor_idToconstructor",
        fields: [constructor_chronology.other_constructor_id],
        references: [constructor.id],
      },
    ),
    constructor_constructor_chronology_constructor_idToconstructor: one(
      constructor,
      {
        relationName: "constructor_chronology_constructor_idToconstructor",
        fields: [constructor_chronology.constructor_id],
        references: [constructor.id],
      },
    ),
  }),
);

export const continentRelations = relations(continent, ({ many }) => ({
  country: many(country, {
    relationName: "continentTocountry",
  }),
}));

export const countryRelations = relations(country, ({ many, one }) => ({
  circuit: many(circuit, {
    relationName: "circuitTocountry",
  }),
  constructor: many(constructor, {
    relationName: "constructorTocountry",
  }),
  continent: one(continent, {
    relationName: "continentTocountry",
    fields: [country.continent_id],
    references: [continent.id],
  }),
  driver_driver_second_nationality_country_idTocountry: many(driver, {
    relationName: "driver_second_nationality_country_idTocountry",
  }),
  driver_driver_nationality_country_idTocountry: many(driver, {
    relationName: "driver_nationality_country_idTocountry",
  }),
  driver_driver_country_of_birth_country_idTocountry: many(driver, {
    relationName: "driver_country_of_birth_country_idTocountry",
  }),
  engine_manufacturer: many(engine_manufacturer, {
    relationName: "countryToengine_manufacturer",
  }),
  grand_prix: many(grand_prix, {
    relationName: "countryTogrand_prix",
  }),
  season_entrant: many(season_entrant, {
    relationName: "countryToseason_entrant",
  }),
  tyre_manufacturer: many(tyre_manufacturer, {
    relationName: "countryTotyre_manufacturer",
  }),
}));

export const driverRelations = relations(driver, ({ one, many }) => ({
  country_driver_second_nationality_country_idTocountry: one(country, {
    relationName: "driver_second_nationality_country_idTocountry",
    fields: [driver.second_nationality_country_id],
    references: [country.id],
  }),
  country_driver_nationality_country_idTocountry: one(country, {
    relationName: "driver_nationality_country_idTocountry",
    fields: [driver.nationality_country_id],
    references: [country.id],
  }),
  country_driver_country_of_birth_country_idTocountry: one(country, {
    relationName: "driver_country_of_birth_country_idTocountry",
    fields: [driver.country_of_birth_country_id],
    references: [country.id],
  }),
  driver_family_relationship_driver_family_relationship_other_driver_idTodriver:
    many(driver_family_relationship, {
      relationName: "driver_family_relationship_other_driver_idTodriver",
    }),
  driver_family_relationship_driver_family_relationship_driver_idTodriver: many(
    driver_family_relationship,
    {
      relationName: "driver_family_relationship_driver_idTodriver",
    },
  ),
  race_data: many(race_data, {
    relationName: "driverTorace_data",
  }),
  race_driver_standing: many(race_driver_standing, {
    relationName: "driverTorace_driver_standing",
  }),
  season_driver: many(season_driver, {
    relationName: "driverToseason_driver",
  }),
  season_driver_standing: many(season_driver_standing, {
    relationName: "driverToseason_driver_standing",
  }),
  season_entrant_driver: many(season_entrant_driver, {
    relationName: "driverToseason_entrant_driver",
  }),
}));

export const driver_family_relationshipRelations = relations(
  driver_family_relationship,
  ({ one }) => ({
    driver_driver_family_relationship_other_driver_idTodriver: one(driver, {
      relationName: "driver_family_relationship_other_driver_idTodriver",
      fields: [driver_family_relationship.other_driver_id],
      references: [driver.id],
    }),
    driver_driver_family_relationship_driver_idTodriver: one(driver, {
      relationName: "driver_family_relationship_driver_idTodriver",
      fields: [driver_family_relationship.driver_id],
      references: [driver.id],
    }),
  }),
);

export const engineRelations = relations(engine, ({ one, many }) => ({
  engine_manufacturer: one(engine_manufacturer, {
    relationName: "engineToengine_manufacturer",
    fields: [engine.engine_manufacturer_id],
    references: [engine_manufacturer.id],
  }),
  season_entrant_engine: many(season_entrant_engine, {
    relationName: "engineToseason_entrant_engine",
  }),
}));

export const engine_manufacturerRelations = relations(
  engine_manufacturer,
  ({ many, one }) => ({
    engine: many(engine, {
      relationName: "engineToengine_manufacturer",
    }),
    country: one(country, {
      relationName: "countryToengine_manufacturer",
      fields: [engine_manufacturer.country_id],
      references: [country.id],
    }),
    race_constructor_standing: many(race_constructor_standing, {
      relationName: "engine_manufacturerTorace_constructor_standing",
    }),
    race_data: many(race_data, {
      relationName: "engine_manufacturerTorace_data",
    }),
    season_constructor_standing: many(season_constructor_standing, {
      relationName: "engine_manufacturerToseason_constructor_standing",
    }),
    season_engine_manufacturer: many(season_engine_manufacturer, {
      relationName: "engine_manufacturerToseason_engine_manufacturer",
    }),
    season_entrant_chassis: many(season_entrant_chassis, {
      relationName: "engine_manufacturerToseason_entrant_chassis",
    }),
    season_entrant_constructor: many(season_entrant_constructor, {
      relationName: "engine_manufacturerToseason_entrant_constructor",
    }),
    season_entrant_driver: many(season_entrant_driver, {
      relationName: "engine_manufacturerToseason_entrant_driver",
    }),
    season_entrant_engine: many(season_entrant_engine, {
      relationName: "engine_manufacturerToseason_entrant_engine",
    }),
    season_entrant_tyre_manufacturer: many(season_entrant_tyre_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_tyre_manufacturer",
    }),
  }),
);

export const entrantRelations = relations(entrant, ({ many }) => ({
  season_entrant: many(season_entrant, {
    relationName: "entrantToseason_entrant",
  }),
  season_entrant_chassis: many(season_entrant_chassis, {
    relationName: "entrantToseason_entrant_chassis",
  }),
  season_entrant_constructor: many(season_entrant_constructor, {
    relationName: "entrantToseason_entrant_constructor",
  }),
  season_entrant_driver: many(season_entrant_driver, {
    relationName: "entrantToseason_entrant_driver",
  }),
  season_entrant_engine: many(season_entrant_engine, {
    relationName: "entrantToseason_entrant_engine",
  }),
  season_entrant_tyre_manufacturer: many(season_entrant_tyre_manufacturer, {
    relationName: "entrantToseason_entrant_tyre_manufacturer",
  }),
}));

export const grand_prixRelations = relations(grand_prix, ({ one, many }) => ({
  country: one(country, {
    relationName: "countryTogrand_prix",
    fields: [grand_prix.country_id],
    references: [country.id],
  }),
  race: many(race, {
    relationName: "grand_prixTorace",
  }),
}));

export const raceRelations = relations(race, ({ one, many }) => ({
  circuit: one(circuit, {
    relationName: "circuitTorace",
    fields: [race.circuit_id],
    references: [circuit.id],
  }),
  grand_prix: one(grand_prix, {
    relationName: "grand_prixTorace",
    fields: [race.grand_prix_id],
    references: [grand_prix.id],
  }),
  season: one(season, {
    relationName: "raceToseason",
    fields: [race.year],
    references: [season.year],
  }),
  race_constructor_standing: many(race_constructor_standing, {
    relationName: "raceTorace_constructor_standing",
  }),
  race_data: many(race_data, {
    relationName: "raceTorace_data",
  }),
  race_driver_standing: many(race_driver_standing, {
    relationName: "raceTorace_driver_standing",
  }),
}));

export const race_constructor_standingRelations = relations(
  race_constructor_standing,
  ({ one }) => ({
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerTorace_constructor_standing",
      fields: [race_constructor_standing.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorTorace_constructor_standing",
      fields: [race_constructor_standing.constructor_id],
      references: [constructor.id],
    }),
    race: one(race, {
      relationName: "raceTorace_constructor_standing",
      fields: [race_constructor_standing.race_id],
      references: [race.id],
    }),
  }),
);

export const race_dataRelations = relations(race_data, ({ one }) => ({
  tyre_manufacturer: one(tyre_manufacturer, {
    relationName: "race_dataTotyre_manufacturer",
    fields: [race_data.tyre_manufacturer_id],
    references: [tyre_manufacturer.id],
  }),
  engine_manufacturer: one(engine_manufacturer, {
    relationName: "engine_manufacturerTorace_data",
    fields: [race_data.engine_manufacturer_id],
    references: [engine_manufacturer.id],
  }),
  constructor: one(constructor, {
    relationName: "constructorTorace_data",
    fields: [race_data.constructor_id],
    references: [constructor.id],
  }),
  driver: one(driver, {
    relationName: "driverTorace_data",
    fields: [race_data.driver_id],
    references: [driver.id],
  }),
  race: one(race, {
    relationName: "raceTorace_data",
    fields: [race_data.race_id],
    references: [race.id],
  }),
}));

export const race_driver_standingRelations = relations(
  race_driver_standing,
  ({ one }) => ({
    driver: one(driver, {
      relationName: "driverTorace_driver_standing",
      fields: [race_driver_standing.driver_id],
      references: [driver.id],
    }),
    race: one(race, {
      relationName: "raceTorace_driver_standing",
      fields: [race_driver_standing.race_id],
      references: [race.id],
    }),
  }),
);

export const seasonRelations = relations(season, ({ many }) => ({
  race: many(race, {
    relationName: "raceToseason",
  }),
  season_constructor: many(season_constructor, {
    relationName: "seasonToseason_constructor",
  }),
  season_constructor_standing: many(season_constructor_standing, {
    relationName: "seasonToseason_constructor_standing",
  }),
  season_driver: many(season_driver, {
    relationName: "seasonToseason_driver",
  }),
  season_driver_standing: many(season_driver_standing, {
    relationName: "seasonToseason_driver_standing",
  }),
  season_engine_manufacturer: many(season_engine_manufacturer, {
    relationName: "seasonToseason_engine_manufacturer",
  }),
  season_entrant: many(season_entrant, {
    relationName: "seasonToseason_entrant",
  }),
  season_entrant_chassis: many(season_entrant_chassis, {
    relationName: "seasonToseason_entrant_chassis",
  }),
  season_entrant_constructor: many(season_entrant_constructor, {
    relationName: "seasonToseason_entrant_constructor",
  }),
  season_entrant_driver: many(season_entrant_driver, {
    relationName: "seasonToseason_entrant_driver",
  }),
  season_entrant_engine: many(season_entrant_engine, {
    relationName: "seasonToseason_entrant_engine",
  }),
  season_entrant_tyre_manufacturer: many(season_entrant_tyre_manufacturer, {
    relationName: "seasonToseason_entrant_tyre_manufacturer",
  }),
  season_tyre_manufacturer: many(season_tyre_manufacturer, {
    relationName: "seasonToseason_tyre_manufacturer",
  }),
}));

export const season_constructorRelations = relations(
  season_constructor,
  ({ one }) => ({
    constructor: one(constructor, {
      relationName: "constructorToseason_constructor",
      fields: [season_constructor.constructor_id],
      references: [constructor.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_constructor",
      fields: [season_constructor.year],
      references: [season.year],
    }),
  }),
);

export const season_constructor_standingRelations = relations(
  season_constructor_standing,
  ({ one }) => ({
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_constructor_standing",
      fields: [season_constructor_standing.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_constructor_standing",
      fields: [season_constructor_standing.constructor_id],
      references: [constructor.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_constructor_standing",
      fields: [season_constructor_standing.year],
      references: [season.year],
    }),
  }),
);

export const season_driverRelations = relations(season_driver, ({ one }) => ({
  driver: one(driver, {
    relationName: "driverToseason_driver",
    fields: [season_driver.driver_id],
    references: [driver.id],
  }),
  season: one(season, {
    relationName: "seasonToseason_driver",
    fields: [season_driver.year],
    references: [season.year],
  }),
}));

export const season_driver_standingRelations = relations(
  season_driver_standing,
  ({ one }) => ({
    driver: one(driver, {
      relationName: "driverToseason_driver_standing",
      fields: [season_driver_standing.driver_id],
      references: [driver.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_driver_standing",
      fields: [season_driver_standing.year],
      references: [season.year],
    }),
  }),
);

export const season_engine_manufacturerRelations = relations(
  season_engine_manufacturer,
  ({ one }) => ({
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_engine_manufacturer",
      fields: [season_engine_manufacturer.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_engine_manufacturer",
      fields: [season_engine_manufacturer.year],
      references: [season.year],
    }),
  }),
);

export const season_entrantRelations = relations(season_entrant, ({ one }) => ({
  country: one(country, {
    relationName: "countryToseason_entrant",
    fields: [season_entrant.country_id],
    references: [country.id],
  }),
  entrant: one(entrant, {
    relationName: "entrantToseason_entrant",
    fields: [season_entrant.entrant_id],
    references: [entrant.id],
  }),
  season: one(season, {
    relationName: "seasonToseason_entrant",
    fields: [season_entrant.year],
    references: [season.year],
  }),
}));

export const season_entrant_chassisRelations = relations(
  season_entrant_chassis,
  ({ one }) => ({
    chassis: one(chassis, {
      relationName: "chassisToseason_entrant_chassis",
      fields: [season_entrant_chassis.chassis_id],
      references: [chassis.id],
    }),
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_chassis",
      fields: [season_entrant_chassis.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_entrant_chassis",
      fields: [season_entrant_chassis.constructor_id],
      references: [constructor.id],
    }),
    entrant: one(entrant, {
      relationName: "entrantToseason_entrant_chassis",
      fields: [season_entrant_chassis.entrant_id],
      references: [entrant.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_entrant_chassis",
      fields: [season_entrant_chassis.year],
      references: [season.year],
    }),
  }),
);

export const season_entrant_constructorRelations = relations(
  season_entrant_constructor,
  ({ one }) => ({
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_constructor",
      fields: [season_entrant_constructor.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_entrant_constructor",
      fields: [season_entrant_constructor.constructor_id],
      references: [constructor.id],
    }),
    entrant: one(entrant, {
      relationName: "entrantToseason_entrant_constructor",
      fields: [season_entrant_constructor.entrant_id],
      references: [entrant.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_entrant_constructor",
      fields: [season_entrant_constructor.year],
      references: [season.year],
    }),
  }),
);

export const season_entrant_driverRelations = relations(
  season_entrant_driver,
  ({ one }) => ({
    driver: one(driver, {
      relationName: "driverToseason_entrant_driver",
      fields: [season_entrant_driver.driver_id],
      references: [driver.id],
    }),
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_driver",
      fields: [season_entrant_driver.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_entrant_driver",
      fields: [season_entrant_driver.constructor_id],
      references: [constructor.id],
    }),
    entrant: one(entrant, {
      relationName: "entrantToseason_entrant_driver",
      fields: [season_entrant_driver.entrant_id],
      references: [entrant.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_entrant_driver",
      fields: [season_entrant_driver.year],
      references: [season.year],
    }),
  }),
);

export const season_entrant_engineRelations = relations(
  season_entrant_engine,
  ({ one }) => ({
    engine: one(engine, {
      relationName: "engineToseason_entrant_engine",
      fields: [season_entrant_engine.engine_id],
      references: [engine.id],
    }),
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_engine",
      fields: [season_entrant_engine.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_entrant_engine",
      fields: [season_entrant_engine.constructor_id],
      references: [constructor.id],
    }),
    entrant: one(entrant, {
      relationName: "entrantToseason_entrant_engine",
      fields: [season_entrant_engine.entrant_id],
      references: [entrant.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_entrant_engine",
      fields: [season_entrant_engine.year],
      references: [season.year],
    }),
  }),
);

export const season_entrant_tyre_manufacturerRelations = relations(
  season_entrant_tyre_manufacturer,
  ({ one }) => ({
    tyre_manufacturer: one(tyre_manufacturer, {
      relationName: "season_entrant_tyre_manufacturerTotyre_manufacturer",
      fields: [season_entrant_tyre_manufacturer.tyre_manufacturer_id],
      references: [tyre_manufacturer.id],
    }),
    engine_manufacturer: one(engine_manufacturer, {
      relationName: "engine_manufacturerToseason_entrant_tyre_manufacturer",
      fields: [season_entrant_tyre_manufacturer.engine_manufacturer_id],
      references: [engine_manufacturer.id],
    }),
    constructor: one(constructor, {
      relationName: "constructorToseason_entrant_tyre_manufacturer",
      fields: [season_entrant_tyre_manufacturer.constructor_id],
      references: [constructor.id],
    }),
    entrant: one(entrant, {
      relationName: "entrantToseason_entrant_tyre_manufacturer",
      fields: [season_entrant_tyre_manufacturer.entrant_id],
      references: [entrant.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_entrant_tyre_manufacturer",
      fields: [season_entrant_tyre_manufacturer.year],
      references: [season.year],
    }),
  }),
);

export const season_tyre_manufacturerRelations = relations(
  season_tyre_manufacturer,
  ({ one }) => ({
    tyre_manufacturer: one(tyre_manufacturer, {
      relationName: "season_tyre_manufacturerTotyre_manufacturer",
      fields: [season_tyre_manufacturer.tyre_manufacturer_id],
      references: [tyre_manufacturer.id],
    }),
    season: one(season, {
      relationName: "seasonToseason_tyre_manufacturer",
      fields: [season_tyre_manufacturer.year],
      references: [season.year],
    }),
  }),
);

export const tyre_manufacturerRelations = relations(
  tyre_manufacturer,
  ({ many, one }) => ({
    race_data: many(race_data, {
      relationName: "race_dataTotyre_manufacturer",
    }),
    season_entrant_tyre_manufacturer: many(season_entrant_tyre_manufacturer, {
      relationName: "season_entrant_tyre_manufacturerTotyre_manufacturer",
    }),
    season_tyre_manufacturer: many(season_tyre_manufacturer, {
      relationName: "season_tyre_manufacturerTotyre_manufacturer",
    }),
    country: one(country, {
      relationName: "countryTotyre_manufacturer",
      fields: [tyre_manufacturer.country_id],
      references: [country.id],
    }),
  }),
);
