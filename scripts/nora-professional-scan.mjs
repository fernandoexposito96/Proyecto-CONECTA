import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = (label, command, args) => {
  const started = Date.now();
  const proc = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
    maxBuffer: 30 * 1024 * 1024,
  });
  return {
    label,
    ok: proc.status === 0,
    exitCode: proc.status ?? 1,
    duration_ms: Date.now() - started,
    output: `${proc.stdout || ''}\n${proc.stderr || ''}`.trim().slice(-6000),
  };
};

const base = run('Diagnóstico profundo NORA', 'node', ['scripts/diagnostic-scan.mjs']);
const unit = run('Vitest · pruebas unitarias', 'npm', ['run', 'test:unit']);
const browser = run('Playwright · Chromium + iPhone/WebKit + Axe', 'npm', ['run', 'test:e2e']);

const reportPath = 'public/diagnostic/report.json';
if (!fs.existsSync(reportPath)) {
  console.error('NORA no generó public/diagnostic/report.json');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
report.schema = Math.max(3, Number(report.schema) || 0);
report.professional_validation = {
  unit: { ok: unit.ok, exitCode: unit.exitCode, duration_ms: unit.duration_ms },
  browser: { ok: browser.ok, exitCode: browser.exitCode, duration_ms: browser.duration_ms },
};

const addResult = (id, area, label, result, severity = 'critical') => ({
  id,
  area,
  label,
  status: result.ok ? 'ok' : 'fail',
  severity: result.ok ? 'info' : severity,
  detail: result.ok ? `Correcto · ${(result.duration_ms / 1000).toFixed(1)}s` : (result.output || `Salida ${result.exitCode}`),
  source: 'professional-validation',
  duration_ms: result.duration_ms,
});

const extra = [
  addResult('vitest-professional', 'Pruebas', 'Vitest · pruebas unitarias', unit, 'error'),
  addResult('playwright-professional', 'Experiencia real', 'Playwright · Chromium + iPhone/WebKit + Axe', browser, 'critical'),
];

report.results = [...(report.results || []).filter((x) => !extra.some((e) => e.id === x.id)), ...extra];
const max = Math.max(1, Math.min(999, Number(report.max_findings) || 999));
report.errors = report.results.filter((x) => x.status === 'fail').slice(0, max);
report.watch = report.results.filter((x) => x.status === 'warn' || (x.status === 'ok' && x.severity === 'warning')).slice(0, Math.max(0, max - report.errors.length));
report.counts = {
  ...(report.counts || {}),
  critical: report.errors.filter((x) => x.severity === 'critical').length,
  errors: report.errors.filter((x) => x.severity !== 'critical').length,
  warnings: report.watch.length,
  ok: report.results.filter((x) => x.status === 'ok' && x.severity !== 'warning').length,
};
report.overall = report.counts.critical ? 'critical' : report.counts.errors ? 'error' : report.counts.warnings ? 'warning' : 'healthy';
report.coverage_note = `${report.coverage_note || ''} Validación profesional integrada: Vitest + Playwright en Chromium + WebKit/iPhone + Axe. Estas pruebas forman parte del mismo informe y una prueba fallida nunca se contabiliza como positiva.`.trim();
report.finished_at = new Date().toISOString();
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`NORA professional scan · base=${base.ok ? 'ok' : 'fail'} · unit=${unit.ok ? 'ok' : 'fail'} · browser=${browser.ok ? 'ok' : 'fail'}`);
process.exit(base.ok && unit.ok && browser.ok ? 0 : 1);
