type PerfSnapshot = {
  lcp?: number;
  cls?: number;
  longTasks: number;
  longTaskMs: number;
  uiErrors: number;
  updatedAt: number;
};

type LayoutShiftEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
};

type WindowWithPerf = Window & {
  __CONECTA_PERF__?: PerfSnapshot;
};

const snapshot: PerfSnapshot = {
  longTasks: 0,
  longTaskMs: 0,
  uiErrors: 0,
  updatedAt: Date.now(),
};

const publish = () => {
  snapshot.updatedAt = Date.now();
  (window as WindowWithPerf).__CONECTA_PERF__ = { ...snapshot };
};

const observe = (type: string, handler: (entry: PerformanceEntry) => void) => {
  if (!("PerformanceObserver" in window)) return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) handler(entry);
      publish();
    });
    observer.observe({ type, buffered: true });
  } catch {
    // Algunos navegadores no implementan todos los entryTypes.
  }
};

export async function startTelemetry() {
  // Telemetría local, sin red y sin datos personales. Sirve para detectar regresiones.
  window.addEventListener("conecta:ui-error", (event) => {
    snapshot.uiErrors += 1;
    publish();
    const detail = (event as CustomEvent).detail;
    console.error("[CONECTA UI]", detail?.message ?? detail);
  });

  observe("largest-contentful-paint", (entry) => {
    snapshot.lcp = Math.round(entry.startTime);
  });

  observe("layout-shift", (entry) => {
    const shift = entry as LayoutShiftEntry;
    if (shift.hadRecentInput) return;
    snapshot.cls = Number(((snapshot.cls ?? 0) + (shift.value ?? 0)).toFixed(4));
  });

  observe("longtask", (entry) => {
    snapshot.longTasks += 1;
    snapshot.longTaskMs += Math.round(entry.duration);
  });

  publish();
}
