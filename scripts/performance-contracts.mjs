import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

const sw = await read("public/sw.js");
assert.match(sw, /CACHE_LIMITS/);
assert.match(sw, /trimCache/);
assert.match(sw, /\[ASSET_CACHE\]:120/);
assert.match(sw, /\[IMAGE_CACHE\]:80/);

const telemetry = await read("src/telemetry.ts");
for (const metric of ["largest-contentful-paint", "layout-shift", "longtask"]) {
  assert.ok(telemetry.includes(metric), `${metric} observer is missing`);
}
assert.match(telemetry, /__CONECTA_PERF__/);
assert.doesNotMatch(telemetry, /fetch\(|sendBeacon|XMLHttpRequest/);

const main = await read("src/main.tsx");
assert.match(main, /setTimeout\([\s\S]*startTelemetry\(\)[\s\S]*5_250/);
assert.match(main, /startImagePerformance\(\)/);
assert.match(main, /scheduleIdlePrefetch\(\)/);

const prefetch = await read("src/idle-prefetch.ts");
assert.match(prefetch, /requestIdleCallback/);
assert.match(prefetch, /saveData/);
assert.match(prefetch, /visibilityState/);
assert.match(prefetch, /heavyViewLoaders\[index\+\+\]/);

const images = await read("src/image-performance.ts");
assert.match(images, /decoding = "async"/);
assert.match(images, /loading = "lazy"/);
assert.match(images, /fetchPriority = "low"/);
assert.match(images, /fetchPriority = "high"/);

console.log("✓ CONECTA performance contracts passed");
