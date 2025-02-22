import logger from "@gridscout/logger";
import { ErgastClient } from "@gridscout/api";
import { MeilisearchClient } from "@gridscout/meilisearch";

const meilisearch = new MeilisearchClient();
const ergast = new ErgastClient();

(async () => {
  const currentDrivers = await ergast.driver.getAllDrivers(
    new Date().getFullYear(),
  );
  const drivers = await ergast.driver.getAllDrivers();

  if (currentDrivers.isErr()) {
    logger.error("Error fetching current drivers", currentDrivers.unwrapErr());
    return;
  }

  if (drivers.isErr()) {
    logger.error("Error fetching drivers", drivers.unwrapErr());
    return;
  }

  // for each driver, only get their id, name, and poster (from wikipedia using the url provided)
  const driverData = await Promise.all(
    drivers.unwrap().MRData.DriverTable.Drivers.map(async (driver) => {
      const id = driver.driverId;
      const name = `${driver.givenName} ${driver.familyName}`;
      const current_grid = currentDrivers
        .unwrap()
        .MRData.DriverTable.Drivers.find(
          (currentDriver) => currentDriver.driverId === id,
        );

      return { id, name, current_grid: !!current_grid };
    }),
  );

  meilisearch.updateDriverDocuments(driverData);
})();
