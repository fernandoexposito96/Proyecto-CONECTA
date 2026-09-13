import fs from 'node:fs';
import process from 'node:process';

const read=(path)=>fs.readFileSync(path,'utf8');
const exists=(path)=>fs.existsSync(path);
const checks=[];
const check=(name,ok,details='')=>checks.push({name,ok:Boolean(ok),details});

const pkg=JSON.parse(read('package.json'));
const deploy=read('.github/workflows/deploy.yml');
const guard=read('.github/workflows/hardening-guard.yml');
const robot=read('.github/workflows/robot-repair.yml');
const sw=read('public/sw.js');
const plans=read('src/lib/realPlansBackend.ts');
const chat=read('src/lib/chatBackend.ts');
const notifications=read('src/lib/notificationsBackend.ts');

check('1. Validación completa',typeof pkg.scripts?.check==='string'&&pkg.scripts.check.includes('tsc --noEmit'));
check('2. Build de producción',typeof pkg.scripts?.build==='string'&&pkg.scripts.build.includes('vite build'));
check('3. Demo/estructura protegidos',guard.includes('Protect demo and visual structure')&&guard.includes('src/(views|components|styles|data)'));
check('4. Presupuesto de bundle',exists('scripts/check-bundle-budget.mjs')&&guard.includes('check-bundle-budget.mjs'));
check('5. Auditoría de dependencias',guard.includes('npm audit --omit=dev --audit-level=high')||deploy.includes('npm audit --omit=dev'));
check('6. PWA sin interceptar Supabase',sw.includes("url.origin!==self.location.origin")&&sw.includes("request.method!=='GET'"));
check('7. Caché PWA acotada',sw.includes('MAX_RUNTIME_ENTRIES')&&sw.includes('trimCache'));
check('8. Consultas principales acotadas',plans.includes('.limit(100)')&&notifications.includes('Math.min(limit,200)')&&chat.includes('Math.min(limit,200)'));
check('9. Filtrado pesado delegado a Supabase',plans.includes(".in('status',[...activeStatusList])"));
check('10. Robot sin auto-merge peligroso',!/(?:gh\s+pr\s+merge|merge_pull_request|enable[-_ ]auto[-_ ]merge)/i.test(robot));

let failed=0;
for(const item of checks){
  const symbol=item.ok?'✅':'❌';
  console.log(`${symbol} ${item.name}${item.details?` — ${item.details}`:''}`);
  if(!item.ok)failed++;
}
console.log(`\nHardening CONECTA: ${checks.length-failed}/${checks.length} bloques verificados.`);
if(failed){
  process.exitCode=1;
}
