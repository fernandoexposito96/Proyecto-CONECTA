import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const exists = async (path) => { try { await access(path); return true; } catch { return false; } };

const checks = [];
const test = (name, fn) => checks.push({ name, fn });

test("production build exists", async () => {
  assert.equal(await exists("dist/index.html"), true, "dist/index.html is missing; run the build first");
});

test("app mount point survives build", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /id=["']app["']/);
  assert.match(html, /manifest\.json/);
});

test("PWA manifest is installable", async () => {
  const manifest = JSON.parse(await read("public/manifest.json"));
  assert.equal(manifest.name, "CONECTA Premium");
  assert.equal(manifest.short_name, "CONECTA");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1, "PWA needs at least one installable icon");
  assert.ok(manifest.icons.some((icon) => icon?.src && (icon.sizes === "any" || typeof icon.sizes === "string")), "PWA icon metadata is invalid");
});

test("service worker uses persistent asset caches", async () => {
  const sw = await read("public/sw.js");
  assert.match(sw, /conecta-v\d+-shell/);
  assert.match(sw, /conecta-v\d+-assets/);
  assert.match(sw, /conecta-v\d+-images/);
  assert.match(sw, /cacheFirst/);
  assert.match(sw, /staleWhileRevalidate/);
  assert.match(sw, /\/assets\//);
  assert.match(sw, /startsWith\(['"]conecta-/);
  assert.match(sw, /request\.mode===['"]navigate['"]/);
  assert.doesNotMatch(sw, /Index1996|raw\.githack/i);
  assert.doesNotMatch(sw, /CLEAR_CONECTA_CACHES/, "normal app startup must never purge all offline caches");
  assert.match(sw, /response\.type!==['"]opaque['"]/, "cross-origin image responses must remain cacheable");
  const main = await read("src/main.tsx");
  assert.doesNotMatch(main, /CLEAR_CONECTA_CACHES/, "app startup must preserve PWA caches");
});

test("stable vendor chunks remain split", async () => {
  const vite = await read("vite.config.ts");
  for (const chunk of ["vendor-react", "vendor-supabase", "vendor-icons", "vendor-qrcode"]) {
    assert.ok(vite.includes(chunk), `${chunk} manual chunk is missing`);
  }
  const assets = await readdir("dist/assets");
  for (const chunk of ["vendor-react", "vendor-supabase", "vendor-icons", "vendor-qrcode"]) {
    assert.ok(assets.some((file) => file.startsWith(`${chunk}-`) && file.endsWith(".js")), `${chunk} was not emitted as its own JS chunk`);
  }
});

test("initial Supabase loading scopes relationship-heavy rows", async () => {
  const loader = await read("src/data/loadConectaData.ts");
  assert.match(loader, /\.in\(["']plan_id["'],\s*planIds\)/);
  assert.match(loader, /\.in\(["']community_id["'],\s*communityIds\)/);
  assert.match(loader, /requester_id\.eq\.\$\{currentUser\.id\},receiver_id\.eq\.\$\{currentUser\.id\}/);
  assert.doesNotMatch(loader, /from\(["']plan_members["']\).*?limit\(INITIAL_LIMITS\.planMembers\).*?from\(["']profiles["']\)/s, "plan members should not be part of the broad first-phase query batch");
});

test("partial refreshes avoid wildcard payloads", async () => {
  const refreshes = await read("src/data/refreshConectaSlices.ts");
  assert.doesNotMatch(refreshes, /\.select\(["']\*["']\)/, "hot refresh paths must select explicit columns");
  for (const columns of ["PLAN_MEMBER_COLUMNS", "SAVED_ITEM_COLUMNS", "CONNECTION_COLUMNS", "CONVERSATION_COLUMNS"]) {
    assert.ok(refreshes.includes(columns), `${columns} is missing from partial refreshes`);
  }
});

test("database hot paths keep supporting indexes", async () => {
  const migration = await read("supabase/migrations/20260903224000_add_runtime_performance_indexes.sql");
  for (const indexName of [
    "plans_status_starts_at_idx",
    "plan_members_plan_joined_idx",
    "community_members_community_joined_idx",
    "notifications_user_created_idx",
    "saved_items_user_type_item_idx",
    "connections_requester_created_idx",
    "connections_receiver_created_idx",
    "messages_conversation_created_idx",
  ]) {
    assert.ok(migration.includes(indexName), `${indexName} performance index is missing`);
  }
  assert.match(migration, /create index if not exists/i);
});

test("single CSS entrypoint remains enforced", async () => {
  const main = await read("src/main.tsx");
  assert.match(main, /import\s+["']\.\/ui\.css["']/);
  const cssImports = [...main.matchAll(/import\s+["']([^"']+\.css)["']/g)].map((match) => match[1]);
  assert.deepEqual(cssImports, ["./ui.css"]);
});

test("responsive layer is loaded last and imports stay valid", async () => {
  const css = await read("src/ui.css");
  const imports = [...css.matchAll(/^@import\s+["']([^"']+)["'];/gm)].map((match) => match[1]);
  assert.equal(imports.at(-1), "./universal-responsive.css", "universal responsive layer must be the final CSS import");
  const lastImportEnd = css.lastIndexOf("@import");
  const firstRule = css.search(/\n\s*\.[A-Za-z_-]|\n\s*#[A-Za-z_-]|\n\s*:[A-Za-z_-]|\n\s*@media/);
  assert.ok(firstRule === -1 || lastImportEnd < firstRule, "all @import rules must appear before CSS style rules");
  assert.equal(await exists("src/universal-responsive.css"), true, "responsive safeguard file is missing");
});

test("desktop labels stay readable and offscreen rendering is bounded", async () => {
  const css = await read("src/universal-responsive.css");
  assert.match(css, /white-space:nowrap!important/);
  assert.match(css, /min-width:max-content!important/);
  assert.match(css, /content-visibility:auto/);
  assert.match(css, /contain-intrinsic-size:auto 360px/);
  assert.match(css, /grid-template-columns:repeat\(auto-fit,minmax\(min\(260px,100%\),1fr\)\)!important/);
});

test("startup splash is removed as soon as React paints", async () => {
  const html = await read("index.html");
  const main = await read("src/main.tsx");
  assert.match(html, /#boot-splash[^}]*background:#000/s);
  assert.match(html, /boot-word[^}]*font-size:clamp\(30px,8vw,46px\)/s);
  assert.match(html, />CONECTA<\/div>/);
  assert.doesNotMatch(html, /boot-line|spinner|LoaderCircle/i);
  assert.match(main, /requestAnimationFrame/);
  assert.doesNotMatch(main, /4_000|4000/);
});

test("critical product views are present", async () => {
  const app = await read("src/App.tsx");
  for (const view of ["HomeView", "ExploreView", "ChatView", "ProfileView"]) assert.ok(app.includes(view), `${view} is missing`);
  assert.equal(await exists("src/views/AdvancedChatView.tsx"), true);
  assert.equal(await exists("src/views/SecurityView.tsx"), true);
});

test("authentication and safety paths remain wired", async () => {
  const auth = await read("src/views/AuthFlowViews.tsx");
  const security = await read("src/views/SecurityView.tsx");
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /signUp/);
  assert.match(auth, /signInWithConectaPasskey/);
  assert.match(security, /delete-conecta-account|Eliminar cuenta/i);
});

test("legacy deployment references do not return", async () => {
  const files = ["src/main.tsx", "public/sw.js", "public/manifest.json", "vite.config.ts"];
  for (const path of files) {
    const content = await read(path);
    assert.doesNotMatch(content, /Index1996|raw\.githack/i, `legacy reference found in ${path}`);
  }
});

let failures = 0;
for (const { name, fn } of checks) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

console.log(`\nCONECTA smoke: ${checks.length - failures}/${checks.length} checks passed`);
if (failures) process.exit(1);
