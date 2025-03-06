CREATE TABLE `chassis` (
	`id` text PRIMARY KEY NOT NULL,
	`constructor_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `circuit` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`previous_names` text,
	`type` text NOT NULL,
	`direction` text NOT NULL,
	`place_name` text NOT NULL,
	`country_id` text NOT NULL,
	`latitude` numeric NOT NULL,
	`longitude` numeric NOT NULL,
	`length` numeric NOT NULL,
	`turns` integer NOT NULL,
	`total_races_held` integer NOT NULL,
	FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `constructor_chronology` (
	`constructor_id` text NOT NULL,
	`position_display_order` integer NOT NULL,
	`other_constructor_id` text NOT NULL,
	`year_from` integer NOT NULL,
	`year_to` integer,
	PRIMARY KEY(`constructor_id`, `position_display_order`),
	FOREIGN KEY (`other_constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `constructor_chronology_constructor_id_other_constructor_id_year_from_year_to_key` ON `constructor_chronology` (`constructor_id`,`other_constructor_id`,`year_from`,`year_to`);--> statement-breakpoint
CREATE TABLE `continent` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`demonym` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `continent_code_unique` ON `continent` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `continent_name_unique` ON `continent` (`name`);--> statement-breakpoint
CREATE TABLE `country` (
	`id` text PRIMARY KEY NOT NULL,
	`alpha2_code` text NOT NULL,
	`alpha3_code` text NOT NULL,
	`name` text NOT NULL,
	`demonym` text,
	`continent_id` text NOT NULL,
	FOREIGN KEY (`continent_id`) REFERENCES `continent`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `country_alpha2_code_unique` ON `country` (`alpha2_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `country_alpha3_code_unique` ON `country` (`alpha3_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `country_name_unique` ON `country` (`name`);--> statement-breakpoint
CREATE TABLE `driver` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`full_name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`permanent_number` text,
	`gender` text NOT NULL,
	`date_of_birth` numeric NOT NULL,
	`date_of_death` numeric,
	`place_of_birth` text NOT NULL,
	`country_of_birth_country_id` text NOT NULL,
	`nationality_country_id` text NOT NULL,
	`second_nationality_country_id` text,
	`best_championship_position` integer,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_championship_wins` integer NOT NULL,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_points` numeric NOT NULL,
	`total_championship_points` numeric NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	`total_driver_of_the_day` integer NOT NULL,
	`total_grand_slams` integer NOT NULL,
	FOREIGN KEY (`second_nationality_country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`nationality_country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`country_of_birth_country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `driver_family_relationship` (
	`driver_id` text NOT NULL,
	`position_display_order` integer NOT NULL,
	`other_driver_id` text NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`driver_id`, `position_display_order`),
	FOREIGN KEY (`other_driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `driver_family_relationship_driver_id_other_driver_id_type_key` ON `driver_family_relationship` (`driver_id`,`other_driver_id`,`type`);--> statement-breakpoint
CREATE TABLE `engine` (
	`id` text PRIMARY KEY NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`capacity` numeric,
	`configuration` text,
	`aspiration` text,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `engine_manufacturer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country_id` text NOT NULL,
	`best_championship_position` integer,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_championship_wins` integer NOT NULL,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_podium_races` integer NOT NULL,
	`total_points` numeric NOT NULL,
	`total_championship_points` numeric NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entrant` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grand_prix` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`short_name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`country_id` text,
	`total_races_held` integer NOT NULL,
	FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `race` (
	`id` integer PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`round` integer NOT NULL,
	`date` numeric NOT NULL,
	`time` text,
	`grand_prix_id` text NOT NULL,
	`official_name` text NOT NULL,
	`qualifying_format` text NOT NULL,
	`sprint_qualifying_format` text,
	`circuit_id` text NOT NULL,
	`circuit_type` text NOT NULL,
	`direction` text NOT NULL,
	`course_length` numeric NOT NULL,
	`turns` integer NOT NULL,
	`laps` integer NOT NULL,
	`distance` numeric NOT NULL,
	`scheduled_laps` integer,
	`scheduled_distance` numeric,
	`drivers_championship_decider` integer,
	`constructors_championship_decider` integer,
	`pre_qualifying_date` numeric,
	`pre_qualifying_time` text,
	`free_practice_1_date` numeric,
	`free_practice_1_time` text,
	`free_practice_2_date` numeric,
	`free_practice_2_time` text,
	`free_practice_3_date` numeric,
	`free_practice_3_time` text,
	`free_practice_4_date` numeric,
	`free_practice_4_time` text,
	`qualifying_1_date` numeric,
	`qualifying_1_time` text,
	`qualifying_2_date` numeric,
	`qualifying_2_time` text,
	`qualifying_date` numeric,
	`qualifying_time` text,
	`sprint_qualifying_date` numeric,
	`sprint_qualifying_time` text,
	`sprint_race_date` numeric,
	`sprint_race_time` text,
	`warming_up_date` numeric,
	`warming_up_time` text,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuit`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`grand_prix_id`) REFERENCES `grand_prix`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `race_year_round_key` ON `race` (`year`,`round`);--> statement-breakpoint
CREATE TABLE `race_constructor_standing` (
	`race_id` integer NOT NULL,
	`position_display_order` integer NOT NULL,
	`position_number` integer,
	`position_text` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`points` numeric NOT NULL,
	`positions_gained` integer,
	PRIMARY KEY(`race_id`, `position_display_order`),
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`race_id`) REFERENCES `race`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `race_data` (
	`race_id` integer NOT NULL,
	`type` text NOT NULL,
	`position_display_order` integer NOT NULL,
	`position_number` integer,
	`position_text` text NOT NULL,
	`driver_number` text NOT NULL,
	`driver_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`tyre_manufacturer_id` text NOT NULL,
	`practice_time` text,
	`practice_time_millis` integer,
	`practice_gap` text,
	`practice_gap_millis` integer,
	`practice_interval` text,
	`practice_interval_millis` integer,
	`practice_laps` integer,
	`qualifying_time` text,
	`qualifying_time_millis` integer,
	`qualifying_q1` text,
	`qualifying_q1_millis` integer,
	`qualifying_q2` text,
	`qualifying_q2_millis` integer,
	`qualifying_q3` text,
	`qualifying_q3_millis` integer,
	`qualifying_gap` text,
	`qualifying_gap_millis` integer,
	`qualifying_interval` text,
	`qualifying_interval_millis` integer,
	`qualifying_laps` integer,
	`starting_grid_position_qualification_position_number` integer,
	`starting_grid_position_qualification_position_text` text,
	`starting_grid_position_grid_penalty` text,
	`starting_grid_position_grid_penalty_positions` integer,
	`starting_grid_position_time` text,
	`starting_grid_position_time_millis` integer,
	`race_shared_car` integer,
	`race_laps` integer,
	`race_time` text,
	`race_time_millis` integer,
	`race_time_penalty` text,
	`race_time_penalty_millis` integer,
	`race_gap` text,
	`race_gap_millis` integer,
	`race_gap_laps` integer,
	`race_interval` text,
	`race_interval_millis` integer,
	`race_reason_retired` text,
	`race_points` numeric,
	`race_pole_position` integer,
	`race_qualification_position_number` integer,
	`race_qualification_position_text` text,
	`race_grid_position_number` integer,
	`race_grid_position_text` text,
	`race_positions_gained` integer,
	`race_pit_stops` integer,
	`race_fastest_lap` integer,
	`race_driver_of_the_day` integer,
	`race_grand_slam` integer,
	`fastest_lap_lap` integer,
	`fastest_lap_time` text,
	`fastest_lap_time_millis` integer,
	`fastest_lap_gap` text,
	`fastest_lap_gap_millis` integer,
	`fastest_lap_interval` text,
	`fastest_lap_interval_millis` integer,
	`pit_stop_stop` integer,
	`pit_stop_lap` integer,
	`pit_stop_time` text,
	`pit_stop_time_millis` integer,
	`driver_of_the_day_percentage` numeric,
	PRIMARY KEY(`race_id`, `type`, `position_display_order`),
	FOREIGN KEY (`tyre_manufacturer_id`) REFERENCES `tyre_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`race_id`) REFERENCES `race`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `race_driver_standing` (
	`race_id` integer NOT NULL,
	`position_display_order` integer NOT NULL,
	`position_number` integer,
	`position_text` text NOT NULL,
	`driver_id` text NOT NULL,
	`points` numeric NOT NULL,
	`positions_gained` integer,
	PRIMARY KEY(`race_id`, `position_display_order`),
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`race_id`) REFERENCES `race`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season` (
	`year` integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `season_constructor` (
	`year` integer NOT NULL,
	`constructor_id` text NOT NULL,
	`position_number` integer,
	`position_text` text,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_1_and_2_finishes` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_podium_races` integer NOT NULL,
	`total_points` numeric NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	PRIMARY KEY(`year`, `constructor_id`),
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_constructor_standing` (
	`year` integer NOT NULL,
	`position_display_order` integer NOT NULL,
	`position_number` integer,
	`position_text` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`points` numeric NOT NULL,
	PRIMARY KEY(`year`, `position_display_order`),
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_driver` (
	`year` integer NOT NULL,
	`driver_id` text NOT NULL,
	`position_number` integer,
	`position_text` text,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_points` numeric NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	`total_driver_of_the_day` integer NOT NULL,
	`total_grand_slams` integer NOT NULL,
	PRIMARY KEY(`year`, `driver_id`),
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_driver_standing` (
	`year` integer NOT NULL,
	`position_display_order` integer NOT NULL,
	`position_number` integer,
	`position_text` text NOT NULL,
	`driver_id` text NOT NULL,
	`points` numeric NOT NULL,
	PRIMARY KEY(`year`, `position_display_order`),
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_engine_manufacturer` (
	`year` integer NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`position_number` integer,
	`position_text` text,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_podium_races` integer NOT NULL,
	`total_points` numeric NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	PRIMARY KEY(`year`, `engine_manufacturer_id`),
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`country_id` text NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`),
	FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant_chassis` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`chassis_id` text NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`, `constructor_id`, `engine_manufacturer_id`, `chassis_id`),
	FOREIGN KEY (`chassis_id`) REFERENCES `chassis`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant_constructor` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`, `constructor_id`, `engine_manufacturer_id`),
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant_driver` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`rounds` text,
	`rounds_text` text,
	`test_driver` integer NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`, `constructor_id`, `engine_manufacturer_id`, `driver_id`),
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant_engine` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`engine_id` text NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`, `constructor_id`, `engine_manufacturer_id`, `engine_id`),
	FOREIGN KEY (`engine_id`) REFERENCES `engine`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_entrant_tyre_manufacturer` (
	`year` integer NOT NULL,
	`entrant_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`engine_manufacturer_id` text NOT NULL,
	`tyre_manufacturer_id` text NOT NULL,
	PRIMARY KEY(`year`, `entrant_id`, `constructor_id`, `engine_manufacturer_id`, `tyre_manufacturer_id`),
	FOREIGN KEY (`tyre_manufacturer_id`) REFERENCES `tyre_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`engine_manufacturer_id`) REFERENCES `engine_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructor`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`entrant_id`) REFERENCES `entrant`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_tyre_manufacturer` (
	`year` integer NOT NULL,
	`tyre_manufacturer_id` text NOT NULL,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_podium_races` integer NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	PRIMARY KEY(`year`, `tyre_manufacturer_id`),
	FOREIGN KEY (`tyre_manufacturer_id`) REFERENCES `tyre_manufacturer`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`year`) REFERENCES `season`(`year`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tyre_manufacturer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country_id` text NOT NULL,
	`best_starting_grid_position` integer,
	`best_race_result` integer,
	`total_race_entries` integer NOT NULL,
	`total_race_starts` integer NOT NULL,
	`total_race_wins` integer NOT NULL,
	`total_race_laps` integer NOT NULL,
	`total_podiums` integer NOT NULL,
	`total_podium_races` integer NOT NULL,
	`total_pole_positions` integer NOT NULL,
	`total_fastest_laps` integer NOT NULL,
	FOREIGN KEY (`country_id`) REFERENCES `country`(`id`) ON UPDATE cascade ON DELETE no action
);
