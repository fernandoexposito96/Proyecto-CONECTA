import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const startedAt = new Date();
const results = [];
const maxFindings = Math.min(Math.max(Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS ?? "999", 10) || 999, 1), 999);

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

const add = (id, area, label, status, detail, severity = "info", meta = {}) => {
  results.push({ id, area, label, status, detail, severity, ...meta });
};

const run = (id, area, label, command, args, severity = "error") => {
  const t0 = Date.now();
  const proc = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    maxBuffer: 8 * 1024 * 1024,
  });
  const output = `${proc.stdout || ""}\n${proc.stderr || ""}`.trim();
  const ok = proc.status === 0;
  add(
    id,
    area,
    label,
    ok ? "ok" : "fail",
    ok ? `Correcto · ${Math.round((Date.now() - t0) / 100) / 10}s` : output.slice(-1400) || `Salida ${proc.status}`,
    ok ? "info" : severity,
    { duration_ms: Date.now() - t0 },
  );
};

const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

run("lint", "Código", "ESLint", "npm", ["run", "lint"]);
run("typescript", "Código", "TypeScript", "npm", ["run", "check"]);
run("build", "Build", "Compilación Vite", "npm", ["run", "build"], "critical");
run("smoke", "Pruebas", "Smoke tests", "npm", ["run", "test:smoke"], "critical");
run("performance", "Rendimiento", "Contratos de rendimiento", "npm", ["run", "test:performance"]);
run("security", "Seguridad", "Contratos de seguridad", "npm", ["run", "test:security"], "critical");
run("audit", "Dependencias", "npm audit (producción)", "npm", ["audit", "--omit=dev", "--audit-level=high"], "warning");

const required = [
  "src/main.tsx",
  "src/App.tsx",
  "src/ui.css",
  "src/supabase.ts",
  "public/manifest.json",
  "public/sw.js",
  ".github/workflows/deploy-pages.yml",
];
const missing = required.filter((f) => !exists(f));
add(
  "structure",
  "Estructura",
  "Archivos críticos",
  missing.length ? "fail" : "ok",
  missing.length ? `Faltan: ${missing.join(", ")}` : `${required.length}/${required.length} presentes`,
  missing.length ? "critical" : "info",
);

try {
  const ui = read("src/ui.css");
  const imports = [...ui.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const last = imports.at(-1) || "";
  add(
    "css-entry",
    "Interfaz",
    "Entrada CSS única",
    imports.length && last.includes("universal-responsive.css") ? "ok" : "fail",
    `${imports.length} capas · última: ${last || "ninguna"}`,
    last.includes("universal-responsive.css") ? "info" : "error",
  );
  const legacyLayers = imports.filter((x) => /hotfix|prototype|overhaul/i.test(x));
  add(
    "css-debt",
    "Interfaz",
    "Capas históricas/hotfix",
    legacyLayers.length <= 4 ? "ok" : "warn",
    legacyLayers.length ? `${legacyLayers.length}: ${legacyLayers.join(", ")}` : "Sin capas históricas detectadas",
    legacyLayers.length <= 4 ? "info" : "warning",
  );
} catch (error) {
  add("css-entry", "Interfaz", "Entrada CSS única", "fail", String(error), "error");
}

try {
  const sw = read("public/sw.js");
  const cacheMatch = sw.match(/SHELL_CACHE=['"]([^'"]+)/);
  const hasCleanup = /caches\.keys\(\)/.test(sw) && /caches\.delete/.test(sw);
  const hasClaim = /clients\.claim/.test(sw);
  add(
    "pwa-cache",
    "PWA",
    "Service Worker y limpieza de caché",
    hasCleanup && hasClaim ? "ok" : "warn",
    `cache=${cacheMatch?.[1] || "desconocida"} · limpieza=${hasCleanup ? "sí" : "no"} · claim=${hasClaim ? "sí" : "no"}`,
    hasCleanup && hasClaim ? "info" : "warning",
  );
} catch (error) {
  add("pwa-cache", "PWA", "Service Worker y limpieza de caché", "fail", String(error), "error");
}

try {
  const manifest = JSON.parse(read("public/manifest.json"));
  const ok = Boolean(manifest.name && manifest.start_url && manifest.display);
  add("manifest", "PWA", "Manifest", ok ? "ok" : "fail", `name=${manifest.name || "?"} · start=${manifest.start_url || "?"} · display=${manifest.display || "?"}`, ok ? "info" : "error");
} catch (error) {
  add("manifest", "PWA", "Manifest", "fail", String(error), "error");
}

try {
  const supabase = read("src/supabase.ts");
  const envExample = exists(".env.example") ? read(".env.example") : "";
  const sourceConfigured = /VITE_SUPABASE_URL/.test(supabase) && /VITE_SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY)/.test(supabase);
  const exampleConfigured = /VITE_SUPABASE_URL/.test(envExample) && /VITE_SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY)/.test(envExample);
  const runtimeKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const runtimeConfigured = Boolean(process.env.VITE_SUPABASE_URL && runtimeKey);
  add(
    "supabase-config",
    "Conexiones",
    "Configuración Supabase",
    sourceConfigured && exampleConfigured ? "ok" : "fail",
    `código=${sourceConfigured ? "sí" : "no"} · env.example=${exampleConfigured ? "sí" : "no"} · secretos CI=${runtimeConfigured ? "disponibles" : "no configurados"}`,
    sourceConfigured && exampleConfigured ? (runtimeConfigured ? "info" : "warning") : "critical",
  );

  if (runtimeConfigured) {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`, {
        headers: { apikey: runtimeKey },
        signal: AbortSignal.timeout(12000),
      });
      add("supabase-health", "Conexiones", "Supabase Auth health", response.ok ? "ok" : "fail", `HTTP ${response.status}`, response.ok ? "info" : "critical");
    } catch (error) {
      add("supabase-health", "Conexiones", "Supabase Auth health", "fail", String(error), "critical");
    }
  } else {
    add("supabase-health", "Conexiones", "Supabase Auth health", "warn", "No se prueba en remoto hasta configurar las variables Supabase del workflow.", "warning");
  }
} catch (error) {
  add("supabase-config", "Conexiones", "Configuración Supabase", "fail", String(error), "critical");
}

try {
  const response = await fetch("https://fernandoexposito96.github.io/Proyecto-CONECTA/", {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { "cache-control": "no-cache" },
  });
  add("production", "Producción", "GitHub Pages accesible", response.ok ? "ok" : "fail", `HTTP ${response.status} · ${response.url}`, response.ok ? "info" : "critical");
} catch (error) {
  add("production", "Producción", "GitHub Pages accesible", "fail", String(error), "critical");
}

const sourceFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs|css|html)$/.test(entry.name)) sourceFiles.push(full);
  }
};
if (exists("src")) walk(path.join(root, "src"));
let todoCount = 0;
let consoleCount = 0;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  todoCount += (text.match(/\b(?:TODO|FIXME|HACK)\b/gi) || []).length;
  consoleCount += (text.match(/console\.(?:log|warn|error)\s*\(/g) || []).length;
}
add("todos", "Mantenimiento", "TODO/FIXME/HACK", todoCount === 0 ? "ok" : "warn", `${todoCount} marcas encontradas`, todoCount === 0 ? "info" : "warning");
add("console", "Mantenimiento", "Console en código cliente", consoleCount <= 3 ? "ok" : "warn", `${consoleCount} llamadas detectadas`, consoleCount <= 3 ? "info" : "warning");

const errors = results.filter((r) => r.status === "fail").slice(0, maxFindings);
const watch = results.filter((r) => r.status === "warn" || (r.status === "ok" && r.severity === "warning")).slice(0, Math.max(0, maxFindings - errors.length));

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
  if (wasBad && nowGood) {
    correctedMap.set(current.id, {
      id: current.id,
      area: current.area,
      label: current.label,
      status: "corrected",
      severity: "resolved",
      detail: current.detail,
      previous_status: previous.status,
      corrected_at: new Date().toISOString(),
    });
  }
}
const corrected = [...correctedMap.values()].slice(0, maxFindings);

const counts = {
  critical: errors.filter((r) => r.severity === "critical").length,
  errors: errors.filter((r) => r.severity !== "critical").length,
  warnings: watch.length,
  corrected: corrected.length,
  ok: results.filter((r) => r.status === "ok" && r.severity !== "warning").length,
};
const score = Math.max(0, Math.min(100, 100 - counts.critical * 25 - counts.errors * 10 - counts.warnings * 3));
const overall = counts.critical ? "critical" : counts.errors ? "error" : counts.warnings ? "warning" : "healthy";
const finishedAt = new Date();
const report = {
  schema: 2,
  app: "CONECTA",
  agent: "NORA",
  overall,
  score,
  max_findings: maxFindings,
  counts,
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  duration_ms: finishedAt - startedAt,
  commit: process.env.GITHUB_SHA || "local",
  run_id: process.env.GITHUB_RUN_ID || null,
  previous_report_loaded: Boolean(previousReport),
  coverage_note: "Escaneo automatizado real de código, build, pruebas, seguridad, rendimiento, PWA, configuración y producción. Errores contiene fallos confirmados; Vigilar contiene avisos o puntos no concluyentes; Errores corregidos solo contiene comprobaciones que antes estaban mal o en vigilancia y ahora pasan correctamente. Una prueba no ejecutada nunca se marca como correcta.",
  errors,
  watch,
  corrected,
  results,
};

const outDir = path.join(root, "public", "diagnostic");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Diagnostic report: ${overall} · score ${score}/100 · ${results.length} checks · errors ${errors.length} · watch ${watch.length} · corrected ${corrected.length}`);
