import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';

const sourcePath='src/lib/planLogic.ts';
const tmpDir=path.resolve('scripts/.logic-test-tmp');
const outPath=path.join(tmpDir,'planLogic.mjs');
fs.rmSync(tmpDir,{recursive:true,force:true});
fs.mkdirSync(tmpDir,{recursive:true});

try{
  const source=fs.readFileSync(sourcePath,'utf8');
  const result=ts.transpileModule(source,{
    compilerOptions:{
      module:ts.ModuleKind.ESNext,
      target:ts.ScriptTarget.ES2022,
      esModuleInterop:true,
    },
    fileName:sourcePath,
  });
  fs.writeFileSync(outPath,result.outputText);
  const {createPlanFromDraft,filterExplorePlans,hourFromPlanTime,normalizeSpots}=await import(`${pathToFileURL(outPath).href}?v=1`);

  assert.equal(normalizeSpots('1'),2);
  assert.equal(normalizeSpots('6'),6);
  assert.equal(normalizeSpots('99'),50);
  assert.equal(normalizeSpots('abc'),2);

  assert.equal(createPlanFromDraft({title:'   ',place:'Tarragona',when:'Hoy · 19:00',spots:'6',category:'Deporte',image:'x'}),null);
  assert.deepEqual(createPlanFromDraft({title:'  Pádel  ',place:' Tarragona ',when:' Hoy · 19:00 ',spots:'80',category:'Deporte',image:'x'}),{
    title:'Pádel',place:'Tarragona',time:'Hoy · 19:00',spots:'50 plazas',distance:'0 km',category:'Deporte',image:'x'
  });

  assert.equal(hourFromPlanTime('Hoy · 19:59'),19);
  assert.equal(hourFromPlanTime('Hoy · 20:00'),20);
  assert.equal(hourFromPlanTime('Hoy · 24:00'),null);
  assert.equal(hourFromPlanTime('Sin hora'),null);

  const plans=[
    {title:'Mañana temprano',image:'x',time:'Hoy · 11:59',place:'Reus',distance:'8 km',spots:'4 plazas',category:'Deporte'},
    {title:'Café de tarde',image:'x',time:'Hoy · 12:00',place:'Tarragona',distance:'3 km',spots:'4 plazas',category:'Café'},
    {title:'Última hora de tarde',image:'x',time:'Hoy · 19:59',place:'Salou',distance:'2 km',spots:'4 plazas',category:'Café'},
    {title:'Cena',image:'x',time:'Hoy · 20:00',place:'Tarragona',distance:'5 km',spots:'4 plazas',category:'Comida'},
    {title:'Ruta sábado',image:'x',time:'Sáb · 10:00',place:'La Mussara',distance:'26 km',spots:'8 plazas',category:'Senderismo'},
    {title:'Plan lunes',image:'x',time:'Lun · 18:00',place:'Tarragona',distance:'1 km',spots:'8 plazas',category:'Deporte'},
  ];
  const run=(overrides={})=>filterExplorePlans(plans,{timeFilter:'all',category:null,query:'',sortAsc:true,...overrides});

  assert.deepEqual(run({timeFilter:'afternoon'}).map(p=>p.title),['Última hora de tarde','Café de tarde']);
  assert.deepEqual(run({timeFilter:'tonight'}).map(p=>p.title),['Cena']);
  assert.deepEqual(run({timeFilter:'today'}).map(p=>p.title),['Última hora de tarde','Café de tarde','Cena','Mañana temprano']);
  assert.deepEqual(run({timeFilter:'weekend'}).map(p=>p.title),['Ruta sábado']);
  assert.deepEqual(run({category:'Café'}).map(p=>p.title),['Última hora de tarde','Café de tarde']);
  assert.deepEqual(run({query:'tArRaGoNa'}).map(p=>p.title),['Plan lunes','Café de tarde','Cena']);
  assert.deepEqual(run({sortAsc:false}).map(p=>p.distance),['26 km','8 km','5 km','3 km','2 km','1 km']);

  const mixedPlans=[
    {title:'Demo cercano',image:'x',time:'Hoy · 18:00',place:'Tarragona',distance:'1 km',spots:'4 plazas',category:'Social'},
    {backendId:'real-1',title:'Plan real',image:'x',time:'Hoy · 18:00',place:'Tarragona',distance:'Cerca de ti',spots:'4 plazas',category:'Social'},
  ];
  const mixed=filterExplorePlans(mixedPlans,{timeFilter:'all',category:null,query:'',sortAsc:true});
  assert.deepEqual(mixed.map(p=>p.title),['Plan real','Demo cercano']);

  console.log('Logic unit tests: 18/18 OK');
} finally {
  fs.rmSync(tmpDir,{recursive:true,force:true});
}
