import { Logger } from "@/utils";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";

i18next.use(Backend).init(
  {
    backend: {
      loadPath: path.join(__dirname, "./locales/{{lng}}.json"),
    },
    fallbackLng: "en",
    // removed "it" from preload, will re-add later
    preload: ["en"],
    interpolation: {
      escapeValue: false,
    },
  },
  (err) => {
    if (err) {
      Logger.error("Error loading i18next:", err);
    } else {
      Logger.debug("i18next loaded successfully");
    }
  },
);

export default i18next;
