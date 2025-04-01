import logger from "@gridscout/logger";

import i18next from "i18next";
import Backend from "i18next-fs-backend";

import path from "node:path";

i18next.use(Backend).init(
  {
    backend: {
      loadPath: path.join(__dirname, "./locales/{{lng}}.json"),
    },
    fallbackLng: "en",
    preload: ["en", "it", "es"],
    interpolation: {
      escapeValue: false,
    },
  },
  (err) => {
    if (err) {
      logger.error("Error loading i18next");
      logger.error(err);
    } else {
      logger.debug("i18next loaded successfully");
    }
  },
);

export default i18next;
