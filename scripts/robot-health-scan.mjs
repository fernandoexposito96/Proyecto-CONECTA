import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const envLimit = Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS ?? "999", 10);
const MAX_FINDINGS = Number.isFinite(envLimit) && envLimit > 0 ? Math.min(envLimit, 999) : 999;
const checks = [
  ["Lint", ["npm", ["run", "lint"]]],
  ["TypeScript", ["npm", ["run", "check"]]],
  ["Build", ["npm", ["run", "build"]]],
  ["Smoke tests", ["npm", ["run", "test:smoke"]]],
  ["Performance contracts", ["npm", ["run", "test:performance"]]],
  ["Security contracts", ["npm", ["run", "test:security"]]],
];

const results = [];
const errors = [];
const watch = [];
const errorPattern = /(error|fail|failed|failure|exception|vulnerab|insecure|denied|forbidden|critical|fatal)/i;
const watchPattern = /(warning|warn|deprecated|not found|missing|timeout|retry|slow|unstable|flaky|unavailable|skipped|not tested|not executed)/i;

const pushFinding = (bucket, item) => {
  if (errors.length + watch.length >= MAX_FINDINGS) return;
  bucket.push(item);
};

for (const [name, [command, args]] of checks) {
  const startedAt = new Date().toISOString();
  const run = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32", maxBuffer: 20 * 1024 * 1024 });
  const stdout = run.stdout ?? "";
  const stderr = run.stderr ?? "";
  const output = `${stdout}\n${stderr}`.trim();
  const status = run.status === 0 ? "passed" : "failed";
  results.push({ name, status, exitCode: run.status ?? 1, startedAt });

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || errors.length + watch.length >= MAX_FINDINGS) continue;
    if (errorPattern.test(line)) {
      pushFinding(errors, { check: name, severity: "error", message: line.slice(0, 1200) });
      continue;
    }
    if (watchPattern.test(line)) {
      pushFinding(watch, { check: name, severity: "watch", message: line.slice(0, 1200) });
    }
  }
}

mkdirSync("robot-reports", { recursive: true });
const positives = results.filter((item) => item.status === "passed");
const hardFailures = results.filter((item) => item.status === "failed");
const summary = {
  generatedAt: new Date().toISOString(),
  maxFindings: MAX_FINDINGS,
  findingsCount: errors.length + watch.length,
  truncated: errors.length + watch.length >= MAX_FINDINGS,
  errorCount: errors.length,
  watchCount: watch.length,
  positiveCount: positives.length,
  hardFailureCount: hardFailures.length,
  checks: results,
  errors,
  watch,
  positives,
};
writeFileSync("robot-reports/latest.json", JSON.stringify(summary, null, 2));

const lines = [
  "# NORA · CONECTA Diagnostic",
  "",
  `Generado: ${summary.generatedAt}`,
  `Capacidad máxima: ${MAX_FINDINGS} hallazgos`,
  `Errores: ${errors.length}`,
  `Vigilar: ${watch.length}`,
  `Puntos positivos: ${positives.length}`,
  `Fallos duros: ${hardFailures.length}`,
  `Total hallazgos: ${summary.findingsCount}${summary.truncated ? " (límite alcanzado)" : ""}`,
  "",
  "## 1 · Errores",
  "",
  ...(hardFailures.length ? hardFailures.map((item) => `- ❌ ${item.name} · fallo duro · exit ${item.exitCode}`) : ["- No hay fallos duros en las comprobaciones ejecutadas."]),
  ...(errors.length ? ["", ...errors.map((item, index) => `${index + 1}. ❌ **${item.check}** — ${item.message.replace(/\|/g, "\\|")}`)] : ["", "No se han detectado errores adicionales."]),
  "",
  "## 2 · Vigilar",
  "",
  ...(watch.length ? watch.map((item, index) => `${index + 1}. ⚠️ **${item.check}** — ${item.message.replace(/\|/g, "\\|")}`) : ["- No hay avisos que vigilar en esta ejecución."]),
  "",
  "## 3 · Puntos positivos",
  "",
  ...(positives.length ? positives.map((item) => `- ✅ ${item.name} · comprobación superada · exit ${item.exitCode}`) : ["- No hay comprobaciones confirmadas como correctas en esta ejecución."]),
  "",
  "## Estado de punta a punta",
  "",
  ...results.map((item) => `- ${item.status === "passed" ? "✅" : "❌"} ${item.name} · ${item.status} · exit ${item.exitCode}`),
  "",
  "> NORA separa lo crítico de lo que solo requiere vigilancia. Solo marca como positivo lo que ha sido comprobado y superado realmente; una prueba no ejecutada nunca se convierte en OK.",
];
writeFileSync("robot-reports/latest.md", lines.join("\n"));

console.log(lines.join("\n"));
process.exit(hardFailures.length ? 1 : 0);
