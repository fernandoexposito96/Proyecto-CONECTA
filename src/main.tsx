import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary, NetworkStatusBanner } from "./components/AppResilience";
import { offlineVisual } from "./offlineVisuals";
import { scheduleIdlePrefetch } from "./idle-prefetch";
import { startImagePerformance } from "./image-performance";
import { startTelemetry } from "./telemetry";
import { captureMonitoringError, initMonitoring } from "./monitoring";
import "./ui.css";

// Monitoring is intentionally optional: without VITE_SENTRY_DSN nothing is sent.
void initMonitoring();

// CONECTA nueva: una sola interfaz React y una sola fuente de verdad.
const savedTheme = window.localStorage.getItem("conecta-theme");
const initialTheme = savedTheme === "dark" ? "dark" : "light";
document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;
document.documentElement.dataset.ui = "conecta-clean-react";

const appBase = new URL(import.meta.env.BASE_URL, window.location.origin);
const localImageFallbacks = [
  "media/cards/social-city.webp",
  "media/cards/active-coast.webp",
  "media/cards/creative-community.webp",
  "media/cards/safe-planning.webp",
].map((path) => new URL(path, appBase).href);

function fallbackIndex(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  return Math.abs(hash) % localImageFallbacks.length;
}

document.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;

    const stage = target.dataset.imageFallbackStage ?? "0";
    const seed = `${target.currentSrc || target.src}|${target.alt}|${target.closest("article,button,section")?.textContent ?? ""}`;

    // Primer rescate: usa una fotografía local empaquetada con la aplicación.
    // Así una URL externa rota nunca convierte la tarjeta en el antiguo logo genérico.
    if (stage === "0") {
      target.dataset.imageFallbackStage = "1";
      target.src = localImageFallbacks[fallbackIndex(seed)];
      return;
    }

    // Último rescate totalmente offline si incluso el asset local no puede cargarse.
    if (stage === "1") {
      target.dataset.imageFallbackStage = "2";
      target.src = offlineVisual(seed.slice(0, 220));
    }
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
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      void captureMonitoringError(error, "service-worker-registration");
    }
  });
}
