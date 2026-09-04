import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary, NetworkStatusBanner } from "./components/AppResilience";
import { offlineVisual } from "./offlineVisuals";
import { scheduleIdlePrefetch } from "./idle-prefetch";
import { startImagePerformance } from "./image-performance";
import { startTelemetry } from "./telemetry";
import { initMonitoring } from "./monitoring";
import "./ui.css";

// Monitoring is intentionally optional: without VITE_SENTRY_DSN nothing is sent.
void initMonitoring();

// CONECTA nueva: una sola interfaz React y una sola fuente de verdad.
const savedTheme = window.localStorage.getItem("conecta-theme");
const initialTheme = savedTheme === "dark" ? "dark" : "light";
document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;
document.documentElement.dataset.ui = "conecta-clean-react";

document.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.offlineFallback === "1") return;
    target.dataset.offlineFallback = "1";
    const seed = `${target.currentSrc || target.src}|${target.alt}|${target.closest("article,button,section")?.textContent ?? ""}`;
    target.src = offlineVisual(seed.slice(0, 220));
  },
  true,
);

const root = document.getElementById("app");
if (!root) throw new Error("No se encontró el contenedor principal de CONECTA.");
createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <NetworkStatusBanner />
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

startImagePerformance();

window.requestAnimationFrame(() => {
  const splash = document.getElementById("boot-splash");
  document.documentElement.classList.add("boot-complete");
  if (!splash) return;
  splash.classList.add("boot-hide");
  window.setTimeout(() => splash.remove(), 280);
});

scheduleIdlePrefetch();
window.setTimeout(() => {
  void startTelemetry();
}, 1_500);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.error("No se pudo activar el modo offline de CONECTA.", error);
    }
  });
}
