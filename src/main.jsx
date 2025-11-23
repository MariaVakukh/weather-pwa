import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isLocal =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (isLocal) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      console.log("Service Workers disabled in DEV mode");
      return;
    }

    if (location.protocol === "https:") {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}service-worker.js`)
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("SW registration failed:", err));
    }
  });
}

