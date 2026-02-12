// frontend/src/main.jsx
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// i18n bootstrap (ES/EN). Guardamos idioma en localStorage ("lang").
const savedLang = localStorage.getItem("lang");
const initialLang = savedLang === "en" || savedLang === "es" ? savedLang : "es";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      es: {
        translation: {
          appName: "DronHangar",

          lang: {
            aria: "Selector de idioma",
          },

          nav: {
            home: "Inicio",
            manage: "Gestión",
            login: "Iniciar sesión",
            drone: "Dron #{{id}}",
            dumpParse: "Dron #{{droneId}} · Dump #{{dumpId}} · Parse",
          },

          footer: {
            tagline: "Gestión y consulta de drones",
          },
        },
      },
      en: {
        translation: {
          appName: "DronHangar",

          lang: {
            aria: "Language selector",
          },

          nav: {
            home: "Home",
            manage: "Manage",
            login: "Sign in",
            drone: "Drone #{{id}}",
            dumpParse: "Drone #{{droneId}} · Dump #{{dumpId}} · Parse",
          },

          footer: {
            tagline: "Drone management and lookup",
          },
        },
      },
    },
    lng: initialLang,
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  // Persistencia: cada cambio de idioma se guarda.
  i18n.on("languageChanged", (lng) => {
    if (lng === "es" || lng === "en") localStorage.setItem("lang", lng);
  });
}

createRoot(document.getElementById("root")).render(<App />);
