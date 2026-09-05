import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const reportPath = path.join(root, "public", "diagnostic", "report.json");
const validateMarker = path.join(root, ".nora", "validate-ok.json");
if (!fs.existsSync(reportPath)) {
  console.error("NORA deep checks: falta public/diagnostic/report.json");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const clean = (value, max = 1800) => String(value ?? "").replace(/\x1b\[[0-9;]*m/g, "").trim().slice(-max);

const checks = [
  { id: "deep-unit", area: "Pruebas", label: "Tests unitarios", script: "test:unit", severity: "error", markerKey: "unit" },
  { id: "deep-e2e", area: "Pruebas", label: "E2E Chromium + iPhone/WebKit", script: "test:e2e", severity: "critical", markerKey: "e2e" },
  { id: "deep-accessibility", area: "Accesibilidad", label: "Escaneo automatizado de accesibilidad", script: "test:accessibility", severity: "error", markerKey: "accessibility" },
];

const results = Array.isArray(report.results) ? report.results.filter((item) => !checks.some((check) => check.id === item.id)) : [];
let validated = null;
try {
  if (fs.existsSync(validateMarker)) validated = JSON.parse(fs.readFileSync(validateMarker, "utf8"));
} catch {
  validated = null;
}

for (const check of checks) {
  if (validated?.[check.markerKey] === true) {
    results.push({
      id: check.id,
      area: check.area,
      label: check.label,
      status: "ok",
      severity: "info",
      detail: `Correcto · verificado por la puerta de calidad completa (${validated.commit || "commit actual"})`,
      duration_ms: 0,
      source: "validated-quality-gate",
    });
    continue;
  }

  // Fallback para ejecuciones locales: si no existe el marcador de CI, se ejecuta la prueba.
  const started = Date.now();
  const proc = spawnSync("pnpm", ["run", check.script], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
    maxBuffer: 24 * 1024 * 1024,
  });
  const ok = proc.status === 0;
  const output = clean(`${proc.stdout || ""}\n${proc.stderr || ""}`);
  results.push({
    id: check.id,
    area: check.area,
    label: check.label,
    status: ok ? "ok" : "fail",
    severity: ok ? "info" : check.severity,
    detail: ok ? `Correcto · ${Math.round((Date.now() - started) / 100) / 10}s` : output || `Salida ${proc.status}`,
    duration_ms: Date.now() - started,
    source: "deep-functional-check",
  });
}

report.results = results;
const maxFindings = report.max_findings || 999;
const rawErrors = results.filter((item) => item.status === "fail");
const rawWatch = results.filter((item) => item.status === "warn" || (item.status === "ok" && item.severity === "warning"));
report.errors = rawErrors.slice(0, maxFindings);
report.watch = rawWatch.slice(0, Math.max(0, maxFindings - report.errors.length));
report.positives = results.filter((item) => item.status === "ok" && item.severity !== "warning").slice(0, maxFindings);

report.counts = {
  ...(report.counts || {}),
  critical: report.errors.filter((item) => item.severity === "critical").length,
  errors: report.errors.filter((item) => item.severity !== "critical").length,
  warnings: report.watch.length,
  corrected: Array.isArray(report.corrected) ? report.corrected.length : 0,
  positives: report.positives.length,
  ok: report.positives.length,
  total_checks: results.length,
  detected_before_limit: rawErrors.length + rawWatch.length,
};

const penalty = report.counts.critical * 12 + report.counts.errors * 4 + report.counts.warnings * 1.2;
report.score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
report.overall = report.counts.critical ? "critical" : report.counts.errors ? "error" : report.counts.warnings ? "warning" : "healthy";
report.schema = 5;
report.engine = "deep-diagnostic-v5.1";
report.coverage = {
  ...(report.coverage || {}),
  unit_tests_checked: true,
  e2e_chromium_iphone_checked: true,
  accessibility_checked: true,
  executable_checks: Number(report.coverage?.executable_checks || 0) + 3,
};
report.coverage_note = `NORA v5.1 revisa código, TypeScript, build, tests unitarios, smoke, rendimiento, seguridad, dependencias, E2E Chromium + iPhone/WebKit, accesibilidad, contrato visual, imágenes, PWA, Supabase y producción. FALLOS son problemas confirmados; AVERÍAS / VIGILAR son riesgos o comprobaciones pendientes; CORREGIDOS son fallos anteriores resueltos; POSITIVOS son comprobaciones correctas actuales. Capacidad máxima visible: ${maxFindings}.`;
report.finished_at = new Date().toISOString();

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`NORA v5.1: ${report.overall} · salud ${report.score}/100 · fallos ${report.errors.length} · averías/vigilar ${report.watch.length} · positivos ${report.positives.length}`);
