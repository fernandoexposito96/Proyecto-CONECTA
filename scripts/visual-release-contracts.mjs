import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const checks = [];

function check(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail });
}

function importCount(source, file) {
  return [...source.matchAll(/@import\s+["']([^"']+)["']/g)].filter((match) => match[1].includes(file)).length;
}

function cssBracesBalanced(source) {
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (const char of source) {
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (inString) {
      if (char === quote) inString = false;
      continue;
    }
    if (char === '"' || char === "'") { inString = true; quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0 && !inString;
}

const main = read("src/main.tsx");
const app = read("src/App.tsx");
const homeCss = read("src/views/home-reference-v4.css");
const chat = read("src/views/AdvancedChatView.tsx");
const chatCss = read("src/views/advanced-chat.css");
const ui = read("src/ui.css");

// Ausencia de parches visuales o capas antiguas.
check("no-photo-enhancer-file", !exists("src/photoEnhancer.ts"), "No debe existir src/photoEnhancer.ts");
check("no-photo-enhancer-bootstrap", !/photoEnhancer|startPhotoEnhancer/.test(main), "main.tsx no debe importar ni ejecutar photoEnhancer");
check("no-hotfix-imports", !/@import\s+["'][^"']*(?:hotfix|legacy|prototype)[^"']*["']/i.test(ui), "ui.css no importa hotfixes, prototipos ni capas legacy");
check("single-home-css-entry", importCount(ui, "premium-reference-v5.css") === 1 && importCount(ui, "home-reference-v4.css") === 0, "Inicio debe usar una sola capa visual Premium V5 y ninguna capa V4 superpuesta");
check("single-chat-css-entry", importCount(ui, "advanced-chat.css") === 1, "Chat debe tener una sola entrada CSS final");

// Cobertura de imágenes y fallbacks.
check("global-image-fallback", /HTMLImageElement/.test(main) && /offlineVisual/.test(main) && /addEventListener\(\s*["']error["']/.test(main), "Fallback global de imágenes mediante offlineVisual");
check("home-hero-photo", /className=\"hero-card\"/.test(app) && /media\/cards\/social-city\.webp/.test(app), "Inicio conserva hero fotográfico real");
check("home-plan-photo-cards", /<PlanCard/.test(app) && /className=\"plans-grid\"/.test(app), "Inicio contiene tarjetas de planes con imagen");
check("home-plan-image-fallback", /plan\.image_url\s*\|\|\s*categoryImage/.test(app), "Las tarjetas de plan disponen de fallback por categoría");
check("home-people-avatars", /className=\"people-list\"/.test(app) && /<PersonRow/.test(app), "Inicio contiene personas con avatar");
check("home-avatar-fallback", /person\.avatar_url\s*\|\|\s*avatarFallback/.test(app), "Las personas de Inicio disponen de fallback de avatar");
check("chat-photo-avatar", /conversation-avatar photo/.test(chat) && /conversationPhoto\(/.test(chat) && /<img src=\{conversationPhoto/.test(chat), "Chat usa fotos reales/fallback en conversaciones y cabecera");
check("chat-photo-fallback", /conversationFallback/.test(chat) && /groupConversationFallback/.test(chat), "Chat dispone de fallback para conversación privada y grupo");
check("chat-images-crop-safe", /conversation-avatar\.photo img[^}]*object-fit:cover/.test(chatCss.replace(/\s+/g, " ")), "Avatares del Chat recortan imágenes sin deformarlas");

// Estructura móvil, safe areas y prevención de solapes/cortes.
check("home-mobile-cards", /@media\s*\(\s*max-width\s*:\s*820px\s*\)/.test(homeCss) && /action-card-grid/.test(homeCss) && /grid-template-columns\s*:\s*repeat\(4\s*,/.test(homeCss), "Accesos móviles de Inicio estructurados en cuatro tarjetas");
check("home-bottom-nav-safe", /bottom-nav/.test(homeCss) && /safe-area-inset-bottom/.test(homeCss), "Barra inferior móvil respeta safe area");
check("chat-photo-cards-mobile", /conversation-panel>button/.test(chatCss) && /flex:0 0 178px/.test(chatCss) && /scroll-snap/.test(chatCss), "Chat móvil usa tarjetas fotográficas horizontales");
check("chat-mobile-safe-compose", /safe-area-inset-bottom/.test(chatCss) && /minmax\(0,1fr\)/.test(chatCss), "Compositor de Chat evita cortes y respeta safe area");
check("chat-mobile-overflow-contained", /overflow-x:auto/.test(chatCss) && /scrollbar-width:none/.test(chatCss), "Carrusel móvil de conversaciones contiene el overflow horizontal");
check("chat-mobile-narrow-390", /@media\s*\(\s*max-width\s*:\s*390px\s*\)/.test(chatCss), "Chat incluye adaptación específica para pantallas muy estrechas");

// Saneamiento de render: CSS final parseable y estructura visual esperada.
check("home-css-balanced", cssBracesBalanced(homeCss), "CSS de Inicio mantiene llaves equilibradas");
check("chat-css-balanced", cssBracesBalanced(chatCss), "CSS de Chat mantiene llaves equilibradas");
check("ui-css-balanced", cssBracesBalanced(ui), "CSS de entrada mantiene llaves equilibradas");
check("home-render-structure", /hero-card/.test(homeCss) && /action-card-grid/.test(homeCss) && /plans-grid/.test(homeCss), "Inicio conserva hero, accesos y rejilla de planes");
check("chat-render-structure", /chat-layout/.test(chatCss) && /conversation-panel/.test(chatCss) && /message-panel/.test(chatCss) && /message-form/.test(chatCss), "Chat conserva lista, conversación y compositor");

const failures = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.id} · ${item.detail}`);
}

const report = {
  schema: 2,
  app: "CONECTA",
  scope: "published-home-chat-visual-release",
  commit: process.env.GITHUB_SHA || "local",
  checked_at: new Date().toISOString(),
  max_findings: Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS || "999", 10) || 999,
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
