export async function startTelemetry() {
  // Telemetría mínima y local: no bloquea el arranque ni envía secretos.
  window.addEventListener("conecta:ui-error", (event) => {
    const detail = (event as CustomEvent).detail;
    console.error("[CONECTA UI]", detail?.message ?? detail);
  });
}
