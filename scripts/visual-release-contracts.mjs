import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const checks = [];

function check(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail });
}

const main = read("src/main.tsx");
const app = read("src/App.tsx");
const homeCss = read("src/views/home-reference-v4.css");
const chat = read("src/views/AdvancedChatView.tsx");
const chatCss = read("src/views/advanced-chat.css");
const ui = read("src/ui.css");

check("no-photo-enhancer-file", !exists("src/photoEnhancer.ts"), "No debe existir src/photoEnhancer.ts");
check("no-photo-enhancer-bootstrap", !/photoEnhancer|startPhotoEnhancer/.test(main), "main.tsx no debe importar ni ejecutar photoEnhancer");
check("global-image-fallback", /HTMLImageElement/.test(main) && /offlineVisual/.test(main) && /addEventListener\(\s*["']error["']/.test(main), "Fallback global de imágenes mediante offlineVisual");

check("home-hero-photo", /className=\"hero-card\"/.test(app) && /media\/cards\/social-city\.webp/.test(app), "Inicio conserva hero fotográfico real");
check("home-plan-photo-cards", /<PlanCard/.test(app) && /className=\"plans-grid\"/.test(app), "Inicio contiene tarjetas de planes con imagen");
check("home-people-avatars", /className=\"people-list\"/.test(app) && /<PersonRow/.test(app), "Inicio contiene personas con avatar");
check("home-mobile-cards", /@media\s*\(\s*max-width\s*:\s*820px\s*\)/.test(homeCss) && /action-card-grid/.test(homeCss) && /grid-template-columns\s*:\s*repeat\(4\s*,/.test(homeCss), "Accesos móviles de Inicio estructurados en cuatro tarjetas");
check("home-bottom-nav-safe", /bottom-nav/.test(homeCss) && /safe-area-inset-bottom/.test(homeCss), "Barra inferior móvil respeta safe area");

check("chat-photo-avatar", /conversation-avatar photo/.test(chat) && /conversationPhoto\(/.test(chat) && /<img src=\{conversationPhoto/.test(chat), "Chat usa fotos reales/fallback en conversaciones y cabecera");
check("chat-photo-fallback", /conversationFallback/.test(chat) && /groupConversationFallback/.test(chat), "Chat dispone de fallback para conversación privada y grupo");
check("chat-photo-cards-mobile", /conversation-panel>button/.test(chatCss) && /flex:0 0 178px/.test(chatCss) && /scroll-snap/.test(chatCss), "Chat móvil usa tarjetas fotográficas horizontales");
check("chat-mobile-safe-compose", /safe-area-inset-bottom/.test(chatCss) && /minmax\(0,1fr\)/.test(chatCss), "Compositor de Chat evita cortes y respeta safe area");

check("single-css-entry", /advanced-chat\.css/.test(ui) && /home-reference-v4\.css/.test(ui), "Inicio y Chat tienen entradas CSS explícitas");
check("no-hotfix-imports", !/@import\s+["'][^"']*(?:hotfix|legacy)[^"']*["']/i.test(ui), "ui.css no importa hotfixes ni capas legacy");

const failures = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.id} · ${item.detail}`);
}

const report = {
  schema: 1,
  app: "CONECTA",
  scope: "visual-release",
  commit: process.env.GITHUB_SHA || "local",
  checked_at: new Date().toISOString(),
  total: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  checks,
};

const outDir = path.join(root, "public", "diagnostic");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "visual-release.json"), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`Visual release contracts failed: ${failures.length}/${checks.length}`);
  process.exit(1);
}
console.log(`Visual release contracts: ${checks.length}/${checks.length} OK`);
