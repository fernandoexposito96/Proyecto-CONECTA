import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const publicRoot=path.join(root,'public');
const imageRoot=path.join(publicRoot,'assets','images');
const textExtensions=new Set(['.ts','.tsx','.js','.mjs','.css','.html','.json','.webmanifest']);
const errors=[];
const warnings=[];

function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())return walk(full);
    return [full];
  });
}

const textFiles=[...walk(srcRoot),...walk(path.join(root,'scripts')),path.join(root,'index.html'),path.join(root,'package.json')]
  .filter(file=>fs.existsSync(file)&&textExtensions.has(path.extname(file)));

const imageRefs=new Set();
const conflictPattern=/^(<{7}|={7}|>{7})/m;
const imagePattern=/assets\/images\/([^'"`)\s}]+)/g;

for(const file of textFiles){
  const rel=path.relative(root,file);
  const text=fs.readFileSync(file,'utf8');
  if(conflictPattern.test(text))errors.push(`${rel}: contiene marcadores de conflicto Git`);
  if(/\bdebugger\s*;?/.test(text))errors.push(`${rel}: contiene debugger`);
  let match;
  while((match=imagePattern.exec(text)))imageRefs.add(match[1]);
}

for(const image of imageRefs){
  if(!fs.existsSync(path.join(imageRoot,image)))errors.push(`Imagen referenciada pero inexistente: public/assets/images/${image}`);
}

const diskImages=fs.existsSync(imageRoot)?fs.readdirSync(imageRoot).filter(name=>/\.(?:jpe?g|png|webp|avif|svg)$/i.test(name)):[];
for(const image of diskImages){
  if(!imageRefs.has(image))warnings.push(`Imagen sin referencia actual: public/assets/images/${image}`);
}

const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(indexHtml.includes('manifest.webmanifest')&&!fs.existsSync(path.join(publicRoot,'sw.js'))){
  errors.push('Hay manifest.webmanifest pero falta public/sw.js');
}

if(errors.length){
  console.error('\nCONECTA lint — errores:\n'+errors.map(item=>`- ${item}`).join('\n'));
  process.exit(1);
}

console.log(`CONECTA lint OK · ${textFiles.length} archivos revisados · ${imageRefs.size} imágenes referenciadas.`);
if(warnings.length)console.warn('\nAvisos no bloqueantes:\n'+warnings.map(item=>`- ${item}`).join('\n'));
