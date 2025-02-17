import { ErgastClient } from "@/api";
import { Logger } from "@/utils";

(async () => {
  const ergast = new ErgastClient();

  const start = Date.now();

  // const driverData = await ergast.driver.getDriver("max_verstappen");

  // if (driverData.isErr()) {
  //   console.error(driverData.unwrapErr());
  //   return;
  // }

  // console.log(driverData.unwrap());

  // const driverStandings = await ergast.standings.getDriverStandings(2024);

  // if (driverStandings.isErr()) {
  //   console.error(driverStandings.unwrapErr());
  //   return;
  // }

  // console.log(driverStandings.unwrap().standings);

  // const constructorStandings =
  //   await ergast.standings.getConstructorStandings(2024);

  // if (constructorStandings.isErr()) {
  //   console.error(constructorStandings.unwrapErr());
  //   return;
  // }

  // console.log(constructorStandings.unwrap());

  // const calendar = await ergast.calendar.getCalendar();

  // if (calendar.isErr()) {W
  //   console.error(calendar.unwrapErr());
  //   return;
  // }

  // console.log(calendar.unwrap().races);

  const end = Date.now();
  Logger.info(`Time: ${end - start}ms`);
})();
