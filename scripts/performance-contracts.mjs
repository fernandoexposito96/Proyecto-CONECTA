import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

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
// Telemetry remains deferred, but must not hold the visible startup experience.
assert.match(main, /setTimeout\([\s\S]*startTelemetry\(\)[\s\S]*1_500/);
assert.doesNotMatch(main, /4_000|4_250/);
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

// Data synchronization must stay scoped to the authenticated user's graph.
const initialLoader = await read("src/data/loadConectaData.ts");
assert.match(initialLoader, /from\("conversation_members"\)[\s\S]*\.eq\("user_id", currentUser\.id\)/);
assert.match(initialLoader, /from\("conversations"\)[\s\S]*\.in\("id", conversationIds\)/);
assert.match(initialLoader, /from\("connections"\)[\s\S]*requester_id\.eq\.\$\{currentUser\.id\},receiver_id\.eq\.\$\{currentUser\.id\}/);

const refreshes = await read("src/data/refreshConectaSlices.ts");
assert.match(refreshes, /from\("conversation_members"\)[\s\S]*\.eq\("user_id", userId\)/);
assert.match(refreshes, /from\("conversations"\)[\s\S]*\.in\("id", conversationIds\)/);
assert.match(refreshes, /from\("connections"\)[\s\S]*requester_id\.eq\.\$\{userId\},receiver_id\.eq\.\$\{userId\}/);
assert.match(refreshes, /from\("plans"\)[\s\S]*\.in\("status", \["published", "full"\]\)[\s\S]*from\("plan_members"\)[\s\S]*\.in\("plan_id", planIds\)/);

// Demo remains available for product QA but is clearly namespaced and deduplicated.
const demo = await read("src/demoMode.ts");
assert.match(demo, /DEMO_MODE_DEFAULT = true/);
assert.match(demo, /DEMO_ID_PREFIX = "demo-"/);
assert.match(demo, /demoProfiles:[\s\S]*demo-profile-/);
assert.match(demo, /demoPlans:[\s\S]*demo-plan-/);
assert.match(demo, /demoCommunities:[\s\S]*demo-community-/);
assert.match(demo, /mergeUnique/);
assert.match(demo, /localStorage\.setItem\(DEMO_STORAGE_KEY/);

// Production bundle budgets. These are intentionally generous enough for the
// current Premium product, but strict enough to catch accidental bundle bloat.
const assetNames = await readdir("dist/assets");
const assetStats = await Promise.all(
  assetNames.map(async (name) => ({ name, size: (await stat(join("dist/assets", name))).size })),
);
const jsAssets = assetStats.filter(({ name }) => name.endsWith(".js"));
const cssAssets = assetStats.filter(({ name }) => name.endsWith(".css"));
const totalJs = jsAssets.reduce((sum, asset) => sum + asset.size, 0);
const totalCss = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
const largestJs = jsAssets.reduce((largest, asset) => Math.max(largest, asset.size), 0);

const KB = 1024;
const BUDGETS = {
  totalJs: 2_000 * KB,
  totalCss: 650 * KB,
  largestJs: 700 * KB,
};

assert.ok(totalJs <= BUDGETS.totalJs, `JS budget exceeded: ${(totalJs / KB).toFixed(1)} KB > 2000 KB`);
assert.ok(totalCss <= BUDGETS.totalCss, `CSS budget exceeded: ${(totalCss / KB).toFixed(1)} KB > 650 KB`);
assert.ok(largestJs <= BUDGETS.largestJs, `largest JS chunk exceeded: ${(largestJs / KB).toFixed(1)} KB > 700 KB`);

console.log(`✓ CONECTA performance contracts passed — JS ${(totalJs / KB).toFixed(1)} KB, CSS ${(totalCss / KB).toFixed(1)} KB, largest chunk ${(largestJs / KB).toFixed(1)} KB`);
