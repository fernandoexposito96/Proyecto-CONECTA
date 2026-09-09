import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const stylesDir = path.join(srcDir, 'styles');
const indexPath = path.join(stylesDir, 'index.css');
const htmlPath = path.join(root, 'index.html');
const imageAssetsDir = path.join(root, 'public', 'assets', 'images');

const expectedStyleImports = [
  './base.css',
  './navigation.css',
  './home.css',
  './explore.css',
  './plans.css',
  './chat.css',
  './profile.css',
  './settings.css',
  './utility-views.css',
  './theme.css',
  './error-boundary.css',
];

const forbiddenLegacyStyles = [
  'premium.css',
  'mobile.css',
  'explore-social.css',
  'functional.css',
  'bottom-nav.css',
  'mobile-edge.css',
  'mobile-layout.css',
  'settings-max.css',
  'settings-polish.css',
  'premium-max-v3.css',
  'home-premium-tune.css',
  'bottom-nav-polish.css',
  'mobile-layout-final.css',
  'mobile-edge-final.css',
  'settings-reference-final.css',
];

const failures = [];
const fail = message => failures.push(message);

if (!fs.existsSync(indexPath)) {
  fail('Falta src/styles/index.css');
} else {
  const indexCss = fs.readFileSync(indexPath, 'utf8');
  const imports = [...indexCss.matchAll(/@import\s+['"]([^'"]+)['"]\s*;/g)].map(match => match[1]);
  if (imports.length !== new Set(imports).size) fail('Hay imports CSS duplicados en src/styles/index.css');
  if (JSON.stringify(imports) !== JSON.stringify(expectedStyleImports)) {
    fail(`El orden/listado de estilos no coincide con la arquitectura aprobada. Actual: ${imports.join(', ')}`);
  }
}

for (const file of forbiddenLegacyStyles) {
  if (fs.existsSync(path.join(stylesDir, file))) fail(`Ha reaparecido una capa CSS antigua: src/styles/${file}`);
}

const cssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css')).sort();
const allowedCssFiles = ['index.css', ...expectedStyleImports.map(item => item.replace('./', ''))].sort();
for (const file of cssFiles) {
  if (!allowedCssFiles.includes(file)) fail(`CSS no registrado en la arquitectura: src/styles/${file}`);
  const css = fs.readFileSync(path.join(stylesDir, file), 'utf8');
  if (!css.trim()) fail(`CSS vacío: src/styles/${file}`);
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  if (open !== close) fail(`Llaves CSS desbalanceadas en src/styles/${file}: ${open} abiertas / ${close} cerradas`);
  const importantCount = (css.match(/!important/g) || []).length;
  if (file !== 'base.css' && importantCount > 0) fail(`No se permiten parches !important fuera de base.css: src/styles/${file}`);
  if (file === 'base.css' && importantCount > 3) fail(`base.css contiene demasiados !important (${importantCount}); revisar capas`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(srcDir).filter(file => /\.(ts|tsx|css)$/.test(file));
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const legacy of forbiddenLegacyStyles) {
    if (text.includes(legacy)) fail(`Referencia antigua a ${legacy} en ${path.relative(root, file)}`);
  }
}

const cssImports = [];
for (const file of sourceFiles.filter(file => /\.(ts|tsx)$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)) {
    cssImports.push({ file: path.relative(root, file).split(path.sep).join('/'), target: match[1] });
  }
}
if (cssImports.length !== 1 || cssImports[0].file !== 'src/main.tsx' || cssImports[0].target !== './styles/index.css') {
  fail(`Los estilos deben entrar solo por src/main.tsx -> ./styles/index.css. Encontrado: ${JSON.stringify(cssImports)}`);
}

const runtimeFiles = [...sourceFiles, htmlPath];
const localImageReferences = new Set();
for (const file of runtimeFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('images.unsplash.com')) {
    fail(`Imagen remota de Unsplash detectada en ${path.relative(root, file)}; las imágenes de CONECTA deben servirse localmente`);
  }
  for (const match of text.matchAll(/\.\/assets\/images\/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg))/gi)) {
    localImageReferences.add(match[1]);
  }
}

if (!fs.existsSync(imageAssetsDir)) {
  fail('Falta public/assets/images');
} else {
  for (const image of localImageReferences) {
    const file = path.join(imageAssetsDir, image);
    if (!fs.existsSync(file)) fail(`Imagen local referenciada pero inexistente: public/assets/images/${image}`);
    else if (fs.statSync(file).size < 1000) fail(`Imagen local sospechosamente pequeña: public/assets/images/${image}`);
  }
}

if (failures.length) {
  console.error('\nCONECTA structural check: FAIL');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('CONECTA structural check: OK');
console.log(`- ${cssFiles.length} archivos CSS controlados`);
console.log('- 0 capas CSS legacy');
console.log('- 0 imports CSS duplicados');
console.log('- entrada CSS única: src/main.tsx -> src/styles/index.css');
console.log('- 0 imágenes Unsplash cargadas en tiempo de ejecución');
console.log(`- ${localImageReferences.size} referencias de imagen local verificadas`);
