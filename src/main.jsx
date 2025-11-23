// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ===== PWA / SERVICE WORKER =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

    // ============================
    // 🔥 DEV MODE — ПОВНЕ ВІДКЛЮЧЕННЯ SW
    // ============================
    if (isLocal) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      console.log("Service Workers disabled in DEV mode");
      return; // <-- Дуже важливо!
    }

    // ============================
    // 🔐 PROD — РЕЄСТРАЦІЯ SW ТІЛЬКИ НА HTTPS
    // ============================
    if (location.protocol === "https:") {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("SW registration failed:", err));
    } else {
      console.warn("Service Worker requires HTTPS in production.");
    }
  });
}

