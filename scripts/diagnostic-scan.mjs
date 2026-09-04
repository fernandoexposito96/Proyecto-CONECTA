import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const startedAt = new Date();
const results = [];
const maxFindings = Math.min(Math.max(Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS ?? "999", 10) || 999, 1), 999);
let sequence = 0;

let previousReport = null;
try {
  const previousResponse = await fetch(`https://fernandoexposito96.github.io/Proyecto-CONECTA/diagnostic/report.json?t=${Date.now()}`, {
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(12000),
  });
  if (previousResponse.ok) previousReport = await previousResponse.json();
} catch {
  previousReport = null;
}

const clean = (value, max = 1400) => String(value ?? "").replace(/\x1b\[[0-9;]*m/g, "").trim().slice(0, max);
const slug = (value) => clean(value, 160).toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, "-").replace(/^-|-$/g, "").slice(0, 90);
const add = (id, area, label, status, detail, severity = "info", meta = {}) => {
  results.push({ id: id || `finding-${++sequence}`, area, label, status, detail: clean(detail), severity, ...meta });
};
const addUnique = (() => {
  const seen = new Set();
  return (id, area, label, status, detail, severity = "info", meta = {}) => {
    const key = `${area}|${label}|${clean(detail, 500)}`;
    if (seen.has(key)) return;
    seen.add(key);
    add(id, area, label, status, detail, severity, meta);
  };
})();

const errorPattern = /\b(error|failed|failure|exception|fatal|critical|vulnerab|insecure|denied|forbidden|cannot|can't|invalid)\b/i;
const warningPattern = /\b(warn(?:ing)?|deprecated|missing|not found|timeout|retry|slow|unstable|flaky|unavailable|skipped|not tested|not executed|todo|fixme|hack)\b/i;

const parseCommandOutput = (checkId, area, label, output) => {
  let errorIndex = 0;
  let warningIndex = 0;
  for (const raw of String(output || "").split(/\r?\n/)) {
    const line = clean(raw, 1200);
    if (!line || /^>\s|^npm notice/i.test(line)) continue;
    if (errorPattern.test(line)) {
      addUnique(`${checkId}-error-${++errorIndex}-${slug(line)}`, area, `${label} · detalle ${errorIndex}`, "fail", line, "error", { source: "command-output", parent_check: checkId });
    } else if (warningPattern.test(line)) {
      addUnique(`${checkId}-warn-${++warningIndex}-${slug(line)}`, area, `${label} · aviso ${warningIndex}`, "warn", line, "warning", { source: "command-output", parent_check: checkId });
    }
  }
};

const run = (id, area, label, command, args, severity = "error") => {
  const t0 = Date.now();
  const proc = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = `${proc.stdout || ""}\n${proc.stderr || ""}`.trim();
  const ok = proc.status === 0;
  add(id, area, label, ok ? "ok" : "fail", ok ? `Correcto · ${Math.round((Date.now() - t0) / 100) / 10}s` : clean(output.slice(-1800)) || `Salida ${proc.status}`, ok ? "info" : severity, { duration_ms: Date.now() - t0, source: "command" });
  parseCommandOutput(id, area, label, output);
};

const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const rel = (full) => path.relative(root, full).replaceAll(path.sep, "/");

// 1) Comprobaciones ejecutables: no se resume un comando fallido en un único contador.
run("lint", "Código", "ESLint", "npm", ["run", "lint"]);
run("typescript", "Código", "TypeScript", "npm", ["run", "check"]);
run("build", "Build", "Compilación Vite", "npm", ["run", "build"], "critical");
run("smoke", "Pruebas", "Smoke tests", "npm", ["run", "test:smoke"], "critical");
run("performance", "Rendimiento", "Contratos de rendimiento", "npm", ["run", "test:performance"]);
run("security", "Seguridad", "Contratos de seguridad", "npm", ["run", "test:security"], "critical");
run("audit", "Dependencias", "pnpm audit (producción)", "pnpm", ["audit", "--prod", "--audit-level=high"], "warning");

// 2) Estructura mínima de una PWA CONECTA desplegable.
const required = [
  "src/main.tsx", "src/App.tsx", "src/ui.css", "src/supabase.ts",
  "public/manifest.json", "public/sw.js", ".github/workflows/deploy-pages.yml",
  ".github/workflows/diagnostic-hourly.yml", "scripts/smoke-test.mjs",
  "scripts/performance-contracts.mjs", "scripts/security-contracts.mjs",
];
for (const file of required) {
  add(`structure-${slug(file)}`, "Estructura", file, exists(file) ? "ok" : "fail", exists(file) ? "Presente" : "Archivo crítico ausente", exists(file) ? "info" : "critical", { source: "filesystem", file });
}

// 3) Inventario profundo por archivo fuente.
const sourceFiles = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs|css|html|json)$/.test(entry.name)) sourceFiles.push(full);
  }
};
walk(path.join(root, "src"));
walk(path.join(root, "public"));

let scannedBytes = 0;
let scannedLines = 0;
let staticFindings = 0;
const staticWatch = (file, lineNo, label, detail, kind = "warning") => {
  staticFindings += 1;
  addUnique(`static-${slug(rel(file))}-${lineNo}-${slug(label)}`, "Código estático", label, "warn", `${rel(file)}:${lineNo} · ${detail}`, kind, { source: "static", file: rel(file), line: lineNo });
};

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  scannedBytes += Buffer.byteLength(text);
  scannedLines += lines.length;

  // Ficheros excesivamente grandes dificultan mantenimiento y esconden regresiones.
  if (lines.length > 1800) staticWatch(file, 1, "Archivo excesivamente grande", `${lines.length} líneas; conviene modularizar para reducir riesgo de regresiones.`);
  if (/\.css$/.test(file)) {
    const importantCount = (text.match(/!important\b/g) || []).length;
    if (importantCount > 25) staticWatch(file, 1, "Deuda CSS por !important", `${importantCount} usos de !important detectados.`);
  }

  lines.forEach((line, index) => {
    const n = index + 1;
    if (/\b(?:TODO|FIXME|HACK)\b/i.test(line)) staticWatch(file, n, "Trabajo pendiente marcado en código", clean(line, 420));
    if (/console\.(?:log|warn|error)\s*\(/.test(line)) staticWatch(file, n, "Console en código de cliente", clean(line, 420));
    if (/dangerouslySetInnerHTML\s*=/.test(line)) staticWatch(file, n, "HTML dinámico sensible", "Uso de dangerouslySetInnerHTML; revisar sanitización y origen del contenido.", "warning");
    if (/href\s*=\s*["']#["']/.test(line)) staticWatch(file, n, "Enlace placeholder", clean(line, 420));
    if (/onClick\s*=\s*\{\s*\(?.*\)?\s*=>\s*\{?\s*\}?\s*\}/.test(line)) staticWatch(file, n, "Acción aparentemente vacía", clean(line, 420));
    if (/\b(?:alert|confirm|prompt)\s*\(/.test(line) && /\.(?:ts|tsx|js)$/.test(file)) staticWatch(file, n, "Diálogo nativo en experiencia de usuario", clean(line, 420));
    if (/localStorage\.(?:setItem|getItem)\s*\([^\n]*(?:token|password|secret|session)/i.test(line)) staticWatch(file, n, "Dato sensible potencial en localStorage", clean(line, 420), "warning");
    if (/<img\b/i.test(line) && !/\balt\s*=/.test(line)) staticWatch(file, n, "Imagen sin alt visible", clean(line, 420));
  });
}
add("source-inventory", "Cobertura", "Inventario fuente", "ok", `${sourceFiles.length} archivos · ${scannedLines} líneas · ${(scannedBytes / 1024).toFixed(1)} KiB analizados`, "info", { source: "static", files_scanned: sourceFiles.length, lines_scanned: scannedLines, bytes_scanned: scannedBytes });

// 4) CSS y capas históricas.
try {
  const ui = read("src/ui.css");
  const imports = [...ui.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const last = imports.at(-1) || "";
  add("css-entry", "Interfaz", "Entrada CSS y responsive final", imports.length && last.includes("universal-responsive.css") ? "ok" : "fail", `${imports.length} capas · última: ${last || "ninguna"}`, imports.length && last.includes("universal-responsive.css") ? "info" : "error");
  const legacyLayers = imports.filter((x) => /hotfix|prototype|overhaul|legacy/i.test(x));
  legacyLayers.forEach((x, i) => addUnique(`css-legacy-${i}-${slug(x)}`, "Interfaz", "Capa CSS histórica", "warn", x, "warning", { source: "css-import" }));
} catch (error) {
  add("css-entry", "Interfaz", "Entrada CSS", "fail", String(error), "error");
}

// 5) PWA, caché y manifest.
try {
  const sw = read("public/sw.js");
  const cacheMatch = sw.match(/SHELL_CACHE=['"]([^'"]+)/);
  const hasCleanup = /caches\.keys\(\)/.test(sw) && /caches\.delete/.test(sw);
  const hasClaim = /clients\.claim/.test(sw);
  const hasSkipWaiting = /skipWaiting/.test(sw);
  add("pwa-cache-cleanup", "PWA", "Limpieza de cachés anteriores", hasCleanup ? "ok" : "warn", `cache=${cacheMatch?.[1] || "desconocida"} · limpieza=${hasCleanup ? "sí" : "no"}`, hasCleanup ? "info" : "warning");
  add("pwa-clients-claim", "PWA", "Activación inmediata de Service Worker", hasClaim && hasSkipWaiting ? "ok" : "warn", `clients.claim=${hasClaim ? "sí" : "no"} · skipWaiting=${hasSkipWaiting ? "sí" : "no"}`, hasClaim && hasSkipWaiting ? "info" : "warning");
} catch (error) {
  add("pwa-cache", "PWA", "Service Worker", "fail", String(error), "error");
}
try {
  const manifest = JSON.parse(read("public/manifest.json"));
  const fields = ["name", "short_name", "start_url", "display", "icons"];
  for (const field of fields) {
    const ok = Array.isArray(manifest[field]) ? manifest[field].length > 0 : Boolean(manifest[field]);
    add(`manifest-${field}`, "PWA", `Manifest · ${field}`, ok ? "ok" : "fail", ok ? "Configurado" : "Ausente o vacío", ok ? "info" : "error");
  }
} catch (error) {
  add("manifest-parse", "PWA", "Manifest válido", "fail", String(error), "error");
}

// 6) Supabase: configuración local y prueba remota solo si hay secretos reales.
try {
  const supabase = read("src/supabase.ts");
  const envExample = exists(".env.example") ? read(".env.example") : "";
  const sourceConfigured = /VITE_SUPABASE_URL/.test(supabase) && /VITE_SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY)/.test(supabase);
  const exampleConfigured = /VITE_SUPABASE_URL/.test(envExample) && /VITE_SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY)/.test(envExample);
  const runtimeKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const runtimeConfigured = Boolean(process.env.VITE_SUPABASE_URL && runtimeKey);
  add("supabase-source-config", "Conexiones", "Supabase configurado en código", sourceConfigured ? "ok" : "fail", sourceConfigured ? "Variables esperadas presentes" : "Faltan referencias de configuración", sourceConfigured ? "info" : "critical");
  add("supabase-env-example", "Conexiones", "Plantilla de entorno Supabase", exampleConfigured ? "ok" : "warn", exampleConfigured ? "Variables documentadas" : "Plantilla incompleta", exampleConfigured ? "info" : "warning");
  if (runtimeConfigured) {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`, { headers: { apikey: runtimeKey }, signal: AbortSignal.timeout(12000) });
      add("supabase-health", "Conexiones", "Supabase Auth health", response.ok ? "ok" : "fail", `HTTP ${response.status}`, response.ok ? "info" : "critical");
    } catch (error) {
      add("supabase-health", "Conexiones", "Supabase Auth health", "fail", String(error), "critical");
    }
  } else {
    add("supabase-health", "Conexiones", "Supabase Auth health", "warn", "No ejecutado: faltan secretos VITE_SUPABASE_URL/KEY en el workflow. No se marca como correcto.", "warning", { source: "runtime", not_executed: true });
  }
} catch (error) {
  add("supabase-config", "Conexiones", "Configuración Supabase", "fail", String(error), "critical");
}

// 7) Producción real.
try {
  const response = await fetch("https://fernandoexposito96.github.io/Proyecto-CONECTA/", { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "cache-control": "no-cache" } });
  add("production", "Producción", "GitHub Pages accesible", response.ok ? "ok" : "fail", `HTTP ${response.status} · ${response.url}`, response.ok ? "info" : "critical");
} catch (error) {
  add("production", "Producción", "GitHub Pages accesible", "fail", String(error), "critical");
}

// 8) Tres capas. Se limita al final, nunca durante la detección.
const rawErrors = results.filter((r) => r.status === "fail");
const rawWatch = results.filter((r) => r.status === "warn" || (r.status === "ok" && r.severity === "warning"));
const errors = rawErrors.slice(0, maxFindings);
const watch = rawWatch.slice(0, Math.max(0, maxFindings - errors.length));

const previousById = new Map((previousReport?.results || []).map((item) => [item.id, item]));
const currentById = new Map(results.map((item) => [item.id, item]));
const previousCorrected = Array.isArray(previousReport?.corrected) ? previousReport.corrected : [];
const correctedMap = new Map();
for (const item of previousCorrected) {
  const current = currentById.get(item.id);
  if (current?.status === "ok" && current.severity !== "warning") correctedMap.set(item.id, { ...item, detail: current.detail, area: current.area, label: current.label });
}
for (const current of results) {
  const previous = previousById.get(current.id);
  const wasBad = previous && (previous.status === "fail" || previous.status === "warn" || previous.severity === "warning");
  const nowGood = current.status === "ok" && current.severity !== "warning";
  if (wasBad && nowGood) correctedMap.set(current.id, { id: current.id, area: current.area, label: current.label, status: "corrected", severity: "resolved", detail: current.detail, previous_status: previous.status, corrected_at: new Date().toISOString() });
}
const corrected = [...correctedMap.values()].slice(0, maxFindings);

const counts = {
  critical: errors.filter((r) => r.severity === "critical").length,
  errors: errors.filter((r) => r.severity !== "critical").length,
  warnings: watch.length,
  corrected: corrected.length,
  ok: results.filter((r) => r.status === "ok" && r.severity !== "warning").length,
  total_checks: results.length,
  detected_before_limit: rawErrors.length + rawWatch.length,
};
const weightedPenalty = counts.critical * 12 + counts.errors * 4 + counts.warnings * 1.2;
const score = Math.max(0, Math.min(100, Math.round(100 - weightedPenalty)));
const overall = counts.critical ? "critical" : counts.errors ? "error" : counts.warnings ? "warning" : "healthy";
const finishedAt = new Date();
const activeFindings = errors.length + watch.length;
const truncated = rawErrors.length + rawWatch.length > activeFindings;
const coverage = {
  executable_checks: 7,
  files_scanned: sourceFiles.length,
  lines_scanned: scannedLines,
  bytes_scanned: scannedBytes,
  static_findings: staticFindings,
  production_checked: true,
  supabase_runtime_checked: results.some((r) => r.id === "supabase-health" && !r.not_executed),
};

const report = {
  schema: 3,
  app: "CONECTA",
  agent: "NORA",
  engine: "deep-diagnostic-v3",
  overall,
  score,
  max_findings: maxFindings,
  truncated,
  counts,
  coverage,
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  duration_ms: finishedAt - startedAt,
  commit: process.env.GITHUB_SHA || "local",
  run_id: process.env.GITHUB_RUN_ID || null,
  previous_report_loaded: Boolean(previousReport),
  coverage_note: `NORA v3 ejecuta pruebas de código/build/smoke/rendimiento/seguridad/dependencias y además inspecciona ${sourceFiles.length} archivos (${scannedLines} líneas) de forma estática, PWA, Supabase y producción. Cada línea problemática confirmada se registra como hallazgo independiente. "Vigilar" incluye riesgos, deuda técnica y comprobaciones no ejecutadas; nunca se convierten en OK. Capacidad máxima visible: ${maxFindings}.`,
  errors,
  watch,
  corrected,
  results,
};

const outDir = path.join(root, "public", "diagnostic");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`NORA deep diagnostic v3: ${overall} · health ${score}/100 · ${results.length} checks/findings · errors ${errors.length} · watch ${watch.length} · corrected ${corrected.length} · coverage ${sourceFiles.length} files/${scannedLines} lines${truncated ? " · TRUNCATED" : ""}`);
