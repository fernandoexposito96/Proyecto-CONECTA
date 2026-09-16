import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcDir=path.join(root,'src');
const stylesDir=path.join(srcDir,'styles');
const indexPath=path.join(stylesDir,'index.css');
const failures=[];
const fail=message=>failures.push(message);

const forbiddenLegacyStyles=[
  'premium.css','mobile.css','explore-social.css','functional.css','bottom-nav.css',
  'mobile-edge.css','mobile-layout.css','settings-max.css','settings-polish.css',
  'premium-max-v3.css','home-premium-tune.css','bottom-nav-polish.css',
  'mobile-layout-final.css','mobile-edge-final.css','settings-reference-final.css','quality-polish.css'
];

if(!fs.existsSync(indexPath)) fail('Falta src/styles/index.css');

const cssFiles=fs.existsSync(stylesDir)?fs.readdirSync(stylesDir).filter(file=>file.endsWith('.css')).sort():[];
const imports=[];
if(fs.existsSync(indexPath)){
  const indexCss=fs.readFileSync(indexPath,'utf8');
  imports.push(...[...indexCss.matchAll(/@import\s+['"]([^'"]+)['"]\s*;/g)].map(match=>match[1]));
  if(imports.length!==new Set(imports).size) fail('Hay imports CSS duplicados en src/styles/index.css');
}

for(const file of forbiddenLegacyStyles){
  if(fs.existsSync(path.join(stylesDir,file))) fail(`Ha reaparecido una capa CSS antigua: src/styles/${file}`);
}

for(const file of cssFiles){
  const css=fs.readFileSync(path.join(stylesDir,file),'utf8');
  if(!css.trim()) fail(`CSS vacío: src/styles/${file}`);
  const open=(css.match(/{/g)||[]).length;
  const close=(css.match(/}/g)||[]).length;
  if(open!==close) fail(`Llaves CSS desbalanceadas en src/styles/${file}: ${open} abiertas / ${close} cerradas`);
}

// New styles are allowed. They only need to be registered in index.css so the app has
// one predictable CSS entry point; this intentionally avoids a frozen allow-list.
for(const file of cssFiles.filter(file=>file!=='index.css')){
  if(!imports.includes(`./${file}`)) fail(`CSS sin registrar en src/styles/index.css: src/styles/${file}`);
}
for(const imported of imports){
  if(imported.startsWith('./')&&!fs.existsSync(path.join(stylesDir,imported.slice(2)))) fail(`Import CSS inexistente: ${imported}`);
}

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const sourceFiles=walk(srcDir).filter(file=>/\.(ts|tsx|css)$/.test(file));
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const legacy of forbiddenLegacyStyles){
    if(text.includes(legacy)) fail(`Referencia antigua a ${legacy} en ${path.relative(root,file)}`);
  }
}

const cssImports=[];
for(const file of sourceFiles.filter(file=>/\.(ts|tsx)$/.test(file))){
  const text=fs.readFileSync(file,'utf8');
  for(const match of text.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)) cssImports.push({file:path.relative(root,file).split(path.sep).join('/'),target:match[1]});
}
if(cssImports.length!==1||cssImports[0].file!=='src/main.tsx'||cssImports[0].target!=='./styles/index.css'){
  fail(`Los estilos deben entrar solo por src/main.tsx -> ./styles/index.css. Encontrado: ${JSON.stringify(cssImports)}`);
}

if(failures.length){
  console.error('\nCONECTA structural check: FAIL');
  for(const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log('CONECTA structural check: OK');
console.log(`- ${cssFiles.length} archivos CSS válidos; se permiten ampliaciones registradas`);
console.log('- 0 capas CSS legacy conocidas');
console.log('- entrada CSS única: src/main.tsx -> src/styles/index.css');
