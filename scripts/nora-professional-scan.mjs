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
report.schema = Math.max(4, Number(report.schema) || 0);
report.engine = 'professional-diagnostic-v4';
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
const rawErrors = report.results.filter((x) => x.status === 'fail');
const rawWatch = report.results.filter((x) => x.status === 'warn' || (x.status === 'ok' && x.severity === 'warning'));
report.errors = rawErrors.slice(0, max);
report.watch = rawWatch.slice(0, Math.max(0, max - report.errors.length));

report.counts = {
  ...(report.counts || {}),
  critical: report.errors.filter((x) => x.severity === 'critical').length,
  errors: report.errors.filter((x) => x.severity !== 'critical').length,
  warnings: report.watch.length,
  corrected: Array.isArray(report.corrected) ? report.corrected.length : 0,
  ok: report.results.filter((x) => x.status === 'ok' && x.severity !== 'warning').length,
  total_checks: report.results.length,
  detected_before_limit: rawErrors.length + rawWatch.length,
};

const weightedPenalty = report.counts.critical * 12 + report.counts.errors * 4 + report.counts.warnings * 1.2;
report.score = Math.max(0, Math.min(100, Math.round(100 - weightedPenalty)));
report.overall = report.counts.critical ? 'critical' : report.counts.errors ? 'error' : report.counts.warnings ? 'warning' : 'healthy';
report.truncated = rawErrors.length + rawWatch.length > report.errors.length + report.watch.length;
report.coverage = {
  ...(report.coverage || {}),
  vitest_checked: true,
  playwright_checked: true,
  chromium_checked: true,
  webkit_iphone_checked: true,
  accessibility_axe_checked: true,
};
report.coverage_note = `${report.coverage_note || ''} Validación profesional integrada: Vitest + Playwright en Chromium + WebKit/iPhone + Axe. Estas pruebas forman parte del mismo informe; una prueba no ejecutada o fallida nunca se contabiliza como positiva. El score se recalcula después de incorporar la validación profesional.`.trim();
report.finished_at = new Date().toISOString();
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`NORA professional v4 · base=${base.ok ? 'ok' : 'fail'} · unit=${unit.ok ? 'ok' : 'fail'} · browser=${browser.ok ? 'ok' : 'fail'} · health=${report.score}/100`);
process.exit(base.ok && unit.ok && browser.ok ? 0 : 1);
