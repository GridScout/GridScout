import logger from "@gridscout/logger";

import i18next from "i18next";
import Backend from "i18next-fs-backend";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next.use(Backend).init(
  {
    backend: {
      loadPath: path.join(__dirname, "./locales/{{lng}}.json"),
    },
    fallbackLng: "en",
    preload: ["en"],
    interpolation: {
      escapeValue: false,
    },
  },
  (err) => {
    if (err) {
      logger.error("Error loading i18next:", err);
    } else {
      logger.debug("i18next loaded successfully");
    }
  },
);

export default i18next;
