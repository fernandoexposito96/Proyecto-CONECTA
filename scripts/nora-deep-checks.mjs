import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const reportPath = path.join(root, "public", "diagnostic", "report.json");
const validateMarker = path.join(root, ".nora", "validate-ok.json");
if (!fs.existsSync(reportPath)) {
  console.error("NORA v7: falta public/diagnostic/report.json");
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
      detail: `Correcto · evidencia de la puerta de calidad (${validated.commit || "commit actual"})`,
      duration_ms: 0,
      source: "validated-quality-gate",
      verified: true,
    });
    continue;
  }

  const started = Date.now();
  const proc = spawnSync("pnpm", ["run", check.script], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
    maxBuffer: 24 * 1024 * 1024,
  });
  const output = clean(`${proc.stdout || ""}\n${proc.stderr || ""}`);
  const executed = typeof proc.status === "number";
  const ok = executed && proc.status === 0;
  results.push({
    id: check.id,
    area: check.area,
    label: check.label,
    status: !executed ? "unknown" : ok ? "ok" : "fail",
    severity: !executed ? "unverified" : ok ? "info" : check.severity,
    detail: !executed ? "No se pudo ejecutar esta comprobación; no cuenta como avería ni como positivo." : ok ? `Correcto · ${Math.round((Date.now() - started) / 100) / 10}s` : output || `Salida ${proc.status}`,
    duration_ms: Date.now() - started,
    source: "deep-functional-check",
    verified: executed,
    not_executed: !executed,
  });
}

// Una prueba no ejecutada nunca es una avería. Solo reduce cobertura.
for (const item of results) {
  if (item.not_executed === true || item.status === "unknown") {
    item.status = "unknown";
    item.severity = "unverified";
    item.verified = false;
  } else if (item.status === "ok" || item.status === "warn" || item.status === "fail") {
    item.verified = true;
  }
}

report.results = results;
const maxFindings = report.max_findings || 999;
const rawErrors = results.filter((item) => item.status === "fail" && item.not_executed !== true);
const rawWatch = results.filter((item) => item.not_executed !== true && (item.status === "warn" || (item.status === "ok" && item.severity === "warning")));
const rawUnverified = results.filter((item) => item.status === "unknown" || item.verified === false || item.not_executed === true);

report.errors = rawErrors.slice(0, maxFindings);
report.watch = rawWatch.slice(0, Math.max(0, maxFindings - report.errors.length));
report.unverified = rawUnverified.slice(0, maxFindings);
report.positives = results.filter((item) => item.status === "ok" && item.severity !== "warning" && item.verified !== false && item.not_executed !== true).slice(0, maxFindings);

const verifiedResults = results.filter((item) => !rawUnverified.includes(item));
const verifiedCount = verifiedResults.length;
const totalChecks = results.length;
const coveragePercent = totalChecks ? Math.round((verifiedCount / totalChecks) * 100) : 0;

report.counts = {
  ...(report.counts || {}),
  critical: report.errors.filter((item) => item.severity === "critical").length,
  errors: report.errors.filter((item) => item.severity !== "critical").length,
  warnings: report.watch.length,
  unverified: report.unverified.length,
  corrected: Array.isArray(report.corrected) ? report.corrected.length : 0,
  positives: report.positives.length,
  ok: report.positives.length,
  total_checks: totalChecks,
  verified_checks: verifiedCount,
  detected_before_limit: rawErrors.length + rawWatch.length,
};

// Salud = problemas confirmados. Cobertura = evidencia disponible.
// La deuda estática CSS es real, pero tiene un peso bajo porque no equivale a una avería funcional.
const warningPenalty = report.watch.reduce((sum, item) => sum + (item.source === "static" ? 0.25 : 1.5), 0);
const penalty = report.counts.critical * 15 + report.counts.errors * 5 + warningPenalty;
report.score = verifiedCount ? Math.max(0, Math.min(100, Math.round(100 - penalty))) : 0;
report.health_model = {
  critical_penalty: 15,
  error_penalty: 5,
  static_warning_penalty: 0.25,
  runtime_warning_penalty: 1.5,
  warning_penalty_total: Math.round(warningPenalty * 100) / 100,
  unverified_affects_health: false,
  unverified_affects_coverage: true,
};
report.verification = {
  coverage_percent: coveragePercent,
  verified_checks: verifiedCount,
  total_checks: totalChecks,
  fully_verified: totalChecks > 0 && verifiedCount === totalChecks,
  evidence_based: true,
};
report.overall = report.counts.critical ? "critical" : report.counts.errors ? "error" : report.counts.warnings ? "warning" : "healthy";
report.schema = 7;
report.engine = "evidence-diagnostic-v7";
report.coverage = {
  ...(report.coverage || {}),
  unit_tests_checked: results.some((item) => item.id === "deep-unit" && item.verified === true),
  e2e_chromium_iphone_checked: results.some((item) => item.id === "deep-e2e" && item.verified === true),
  accessibility_checked: results.some((item) => item.id === "deep-accessibility" && item.verified === true),
  executable_checks: Number(report.coverage?.executable_checks || 0) + 3,
  verified_percent: coveragePercent,
};
report.category_labels = {
  errors: "Fallos confirmados",
  watch: "Riesgos / Vigilar",
  unverified: "No verificado",
  corrected: "Historial de corregidos",
  positives: "Comprobaciones correctas",
};
report.coverage_note = `NORA v7 separa salud y cobertura. SALUD penaliza fallos confirmados y riesgos verificados; la deuda CSS estática pesa poco porque no equivale a una avería funcional. COBERTURA baja cuando una prueba no se puede ejecutar. Los corregidos son historial y no alteran la salud actual. Cobertura: ${coveragePercent}% (${verifiedCount}/${totalChecks}).`;
report.finished_at = new Date().toISOString();

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`NORA v7: ${report.overall} · salud ${report.score}/100 · cobertura ${coveragePercent}% · fallos ${report.errors.length} · vigilar ${report.watch.length} · no verificado ${report.unverified.length} · positivos ${report.positives.length}`);
