import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const scanRoots=['src/lib','src/hooks'];
const failures=[];
const warnings=[];
const sourceExt=/\.(?:ts|tsx|js|mjs)$/;
const patchTerms=['TEMPORARY','WORKAROUND','QUICK-FIX','QUICK FIX','MONKEY-PATCH','MONKEY PATCH','HOTFIX'];
const obsoleteTerms=['DEPRECATED','OBSOLETE'];
const layeredName=/(?:copy|backup|old|new|final|fixed|fix|patch|temp|tmp|v\d+)\.(?:ts|tsx|js|mjs)$/i;
const duplicateSuffix=/(?:[-_.](?:copy|backup|old|new|final|fixed|fix|patch|temp|tmp|v\d+))$/i;

function walk(dir){
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs))return [];
  return fs.readdirSync(abs,{withFileTypes:true}).flatMap(entry=>{
    const rel=path.join(dir,entry.name);
    return entry.isDirectory()?walk(rel):[rel];
  });
}

const files=scanRoots.flatMap(walk).filter(file=>sourceExt.test(file));
const canonicalNames=new Map();
for(const file of files){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  const upper=text.toUpperCase();
  const lines=text.split(/\r?\n/).length;
  const bytes=Buffer.byteLength(text);
  if(lines>500||bytes>30000)failures.push(`${file}: demasiado grande (${lines} líneas / ${bytes} bytes); dividir antes de seguir creciendo`);
  else if(lines>350||bytes>20000)warnings.push(`${file}: se acerca al límite de mantenibilidad (${lines} líneas / ${bytes} bytes)`);
  if(patchTerms.some(term=>upper.includes(term)))failures.push(`${file}: marcador de parche temporal detectado`);
  if(obsoleteTerms.some(term=>upper.includes(term)))warnings.push(`${file}: contiene marcador deprecated/obsolete; revisar retirada`);

  const basename=path.basename(file);
  if(layeredName.test(basename))failures.push(`${file}: nombre de capa/parche detectado; modifica el módulo canónico en vez de añadir otra versión`);
  const ext=path.extname(basename);
  const stem=basename.slice(0,-ext.length);
  const canonical=stem.replace(duplicateSuffix,'').toLocaleLowerCase('en');
  const domain=path.dirname(file);
  const key=`${domain}/${canonical}${ext}`;
  const previous=canonicalNames.get(key);
  if(previous&&previous!==file)failures.push(`${file}: posible capa duplicada de ${previous}; debe existir una sola implementación canónica`);
  else canonicalNames.set(key,file);
}

const libDir=path.join(root,'src','lib');
if(fs.existsSync(libDir)){
  const direct=fs.readdirSync(libDir,{withFileTypes:true}).filter(entry=>entry.isFile()&&sourceExt.test(entry.name));
  if(direct.length>30)warnings.push(`src/lib tiene ${direct.length} módulos directos; agrupar por dominio antes de que crezca más`);
}

if(failures.length){
  console.error('\nCONECTA maintainability guard: FAIL\n'+failures.map(item=>`- ${item}`).join('\n'));
  process.exit(1);
}
console.log(`CONECTA maintainability guard: OK · ${files.length} módulos internos revisados · sin capas de parche duplicadas.`);
if(warnings.length)console.warn('\nAvisos de mantenibilidad:\n'+warnings.map(item=>`- ${item}`).join('\n'));
