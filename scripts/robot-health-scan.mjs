import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const envLimit = Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS ?? "1999", 10);
const MAX_FINDINGS = Number.isFinite(envLimit) && envLimit > 0 ? Math.min(envLimit, 1999) : 1999;
const checks = [
  ["Lint", ["npm", ["run", "lint"]]],
  ["TypeScript", ["npm", ["run", "check"]]],
  ["Build", ["npm", ["run", "build"]]],
  ["Smoke tests", ["npm", ["run", "test:smoke"]]],
  ["Performance contracts", ["npm", ["run", "test:performance"]]],
  ["Security contracts", ["npm", ["run", "test:security"]]],
];

const results = [];
const findings = [];
const findingPattern = /(error|warning|warn|fail|failed|failure|exception|deprecated|vulnerab|insecure|not found|missing|timeout|denied|forbidden)/i;

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
    if (!line || !findingPattern.test(line)) continue;
    if (findings.length >= MAX_FINDINGS) break;
    findings.push({ check: name, severity: /error|fail|exception|vulnerab|insecure|denied|forbidden/i.test(line) ? "error" : "warning", message: line.slice(0, 1200) });
  }
}

mkdirSync("robot-reports", { recursive: true });
const hardFailures = results.filter((item) => item.status === "failed");
const summary = {
  generatedAt: new Date().toISOString(),
  maxFindings: MAX_FINDINGS,
  findingsCount: findings.length,
  truncated: findings.length >= MAX_FINDINGS,
  hardFailureCount: hardFailures.length,
  checks: results,
  findings,
};
writeFileSync("robot-reports/latest.json", JSON.stringify(summary, null, 2));

const lines = [
  "# CONECTA Robot · Informe completo",
  "",
  `Generado: ${summary.generatedAt}`,
  `Capacidad máxima: ${MAX_FINDINGS.toLocaleString("es-ES")} hallazgos`,
  `Hallazgos detectados: ${findings.length}${summary.truncated ? " (límite alcanzado)" : ""}`,
  `Pruebas con fallo duro: ${hardFailures.length}`,
  "",
  "## Estado de punta a punta",
  "",
  ...results.map((item) => `- ${item.status === "passed" ? "✅" : "❌"} ${item.name} · exit ${item.exitCode}`),
  "",
  "## Todos los fallos y avisos detectados",
  "",
  ...(findings.length ? findings.map((item, index) => `${index + 1}. **${item.severity.toUpperCase()} · ${item.check}** — ${item.message.replace(/\|/g, "\\|")}`) : ["No se han detectado líneas de error/aviso en esta ejecución."]),
  "",
  "> Este informe no convierte una prueba no ejecutada en un éxito. Si una comprobación falla, queda marcada como fallo duro.",
];
writeFileSync("robot-reports/latest.md", lines.join("\n"));

console.log(lines.join("\n"));
process.exit(hardFailures.length ? 1 : 0);
