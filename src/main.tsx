import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary, NetworkStatusBanner } from "./components/AppResilience";
import { offlineVisual } from "./offlineVisuals";
import { startTelemetry } from "./telemetry";
import "./conecta-premium.css";
import "./home-premium.css";
import "./homePremiumEnhancer";
import "./quick-icons-polish.css";
import "./quick-icons-polish";
import "./mobile-premium-fix.css";
import "./mobile-compact-hotfix.css";
import "./mobile-nav-polish.css";
import "./accessibility.css";
import "./premium-max-overhaul.css";
import "./prototype-exact-mobile.css";
import "./secondary-views-premium.css";
import "./secondary-views-premium";
import "./three-pages-final.css";
import "./explore-chip-hotfix.css";
import "./secondary-content-max.css";
import "./secondary-content-max";
import "./structure-overhaul.css";
import "./structure-overhaul";
import "./core-views-visual.css";
import "./premium-social-experience.css";
import "./drawer-reference-premium.css";
import "./mobile-dialogs-safe.css";
import "./confirmation-final-polish.css";

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
void startTelemetry();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=conecta-v1", { updateViaCache: "none" });
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      await registration.update();
    } catch {
      // La aplicación continúa funcionando aunque no haya modo offline.
    }
  });
}
