import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const warnings=[];
function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const files=walk(path.join(root,'src')).filter(file=>/\.(?:ts|tsx)$/.test(file));
for(const file of files){
  const rel=path.relative(root,file);
  const text=fs.readFileSync(file,'utf8');
  if(/\bservice_role\b|SUPABASE_SERVICE_ROLE/i.test(text))failures.push(`${rel}: credencial service-role no puede existir en frontend`);
  if(/\beval\s*\(|new\s+Function\s*\(/.test(text))failures.push(`${rel}: ejecución dinámica de código detectada`);
  if(/\.from\([^\n]+\)[\s\S]{0,250}\.select\([^\n]*\)[\s\S]{0,350}\.order\(/.test(text)&&!/\.limit\(/.test(text))warnings.push(`${rel}: revisar consulta ordenada sin límite aparente`);
}

const swPath=path.join(root,'public','sw.js');
if(fs.existsSync(swPath)){
  const sw=fs.readFileSync(swPath,'utf8');
  if(!sw.includes("request.method!=='GET'")||!sw.includes('url.origin!==self.location.origin'))failures.push('public/sw.js: debe excluir métodos no GET y orígenes externos');
}

if(failures.length){
  console.error('\nCONECTA runtime safety: FAIL\n'+failures.map(item=>`- ${item}`).join('\n'));
  process.exit(1);
}
console.log(`CONECTA runtime safety: OK · ${files.length} archivos frontend revisados.`);
if(warnings.length)console.warn('\nAvisos runtime:\n'+warnings.map(item=>`- ${item}`).join('\n'));
