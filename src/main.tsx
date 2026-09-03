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

// CONECTA nueva: una sola interfaz React y una sola fuente de verdad.
document.documentElement.dataset.theme = "light";
document.documentElement.style.colorScheme = "light";
document.documentElement.dataset.ui = "conecta-clean-react";
window.localStorage.setItem("conecta-theme", "light");

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
      const registration = await navigator.serviceWorker.register("./sw.js?v=conecta-clean-1", { updateViaCache: "none" });
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      await registration.update();
    } catch {
      // La aplicación continúa funcionando aunque no haya modo offline.
    }
  });
}
