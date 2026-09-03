import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

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

test("service worker uses the canonical cache", async () => {
  const sw = await read("public/sw.js");
  assert.match(sw, /conecta-v1/);
  assert.doesNotMatch(sw, /Index1996|raw\.githack/i);
});

test("single CSS entrypoint remains enforced", async () => {
  const main = await read("src/main.tsx");
  assert.match(main, /import\s+["']\.\/ui\.css["']/);
  const cssImports = [...main.matchAll(/import\s+["']([^"']+\.css)["']/g)].map((match) => match[1]);
  assert.deepEqual(cssImports, ["./ui.css"]);
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
