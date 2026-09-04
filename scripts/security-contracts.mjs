import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".json", ".svg"]);

async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const frontendFiles = [...await collectFiles("src"), ...await collectFiles("public")];
const forbidden = [
  { name: "Supabase service-role token", pattern: /\bservice_role\b/i },
  { name: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]+/ },
  { name: "service-role environment variable", pattern: /SUPABASE_SERVICE_ROLE(?:_KEY)?/i },
  { name: "private/secret VITE variable", pattern: /VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE)[A-Z0-9_]*/ },
  { name: "embedded private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

for (const path of frontendFiles) {
  const content = await readFile(path, "utf8");
  for (const rule of forbidden) {
    assert.doesNotMatch(content, rule.pattern, `${rule.name} must never ship in frontend file ${path}`);
  }
}

const envExample = await readFile(".env.example", "utf8");
assert.match(envExample, /^VITE_SUPABASE_URL=/m);
assert.match(envExample, /^VITE_SUPABASE_PUBLISHABLE_KEY=/m);
assert.doesNotMatch(envExample, /SERVICE_ROLE|SECRET|PRIVATE_KEY/i);

const supabaseClient = await readFile("src/supabase.ts", "utf8");
assert.match(supabaseClient, /VITE_SUPABASE_PUBLISHABLE_KEY/);
assert.doesNotMatch(supabaseClient, /SUPABASE_SERVICE_ROLE|sb_secret_/i);

const leastPrivilegeMigration = await readFile(
  "supabase/migrations/20260904163000_enforce_least_privilege_api_roles.sql",
  "utf8",
);
assert.match(leastPrivilegeMigration, /revoke all privileges on all tables in schema public from anon/i);
assert.match(leastPrivilegeMigration, /revoke truncate, references, trigger[\s\S]*from authenticated/i);
assert.match(leastPrivilegeMigration, /revoke execute on all functions in schema private from public/i);

const retiredPasskeysMigration = await readFile(
  "supabase/migrations/20260904164500_retire_legacy_passkey_table.sql",
  "utf8",
);
assert.match(retiredPasskeysMigration, /revoke all privileges on table public\.passkey_credentials from anon, authenticated/i);

console.log(`✓ CONECTA security contracts passed — scanned ${frontendFiles.length} frontend files`);
