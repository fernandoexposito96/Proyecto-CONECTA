import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary, NetworkStatusBanner } from "./components/AppResilience";
import { offlineVisual } from "./offlineVisuals";
import { scheduleIdlePrefetch } from "./idle-prefetch";
import { startImagePerformance } from "./image-performance";
import { startTelemetry } from "./telemetry";
import "./ui.css";
import "./homePremiumEnhancer";
import "./home-fused-hero";
import "./home-final-hero.css";
import "./structure-overhaul";
import "./conecta-calm-enhancer";

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

// Ajusta imágenes renderizadas por React sin bloquear el primer pintado.
startImagePerformance();

// Mantén la presentación visible durante 5 s y no reveles la app hasta el final.
// Así iOS nunca llega a enseñar iconos o elementos sin estilos durante el arranque.
window.setTimeout(() => {
  const splash = document.getElementById("boot-splash");
  document.documentElement.classList.add("boot-complete");
  if (!splash) return;
  splash.classList.add("boot-hide");
  window.setTimeout(() => splash.remove(), 280);
}, 5_000);

// Trabajo no crítico: siempre después de revelar la aplicación.
scheduleIdlePrefetch();
window.setTimeout(() => {
  void startTelemetry();
}, 5_250);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=conecta-home-approved-8", { updateViaCache: "none" });
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      await registration.update();
    } catch {
      // La aplicación continúa funcionando aunque no haya modo offline.
    }
  });
}
