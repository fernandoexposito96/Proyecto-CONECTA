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
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:sourcePath,
  });
  fs.writeFileSync(outPath,result.outputText);
  const {createPlanFromDraft,filterExplorePlans,hourFromPlanTime,normalizeSpots}=await import(`${pathToFileURL(outPath).href}?v=1`);

  assert.equal(normalizeSpots('1'),2);assert.equal(normalizeSpots('6'),6);assert.equal(normalizeSpots('99'),50);assert.equal(normalizeSpots('abc'),2);
  assert.equal(createPlanFromDraft({title:'   ',place:'Tarragona',when:'Hoy · 19:00',spots:'6',category:'Deporte',image:'x'}),null);
  assert.deepEqual(createPlanFromDraft({title:'  Pádel  ',place:' Tarragona ',when:' Hoy · 19:00 ',spots:'80',category:'Deporte',image:'x'}),{title:'Pádel',place:'Tarragona',time:'Hoy · 19:00',spots:'50 plazas',distance:'0 km',category:'Deporte',image:'x'});
  const future=new Date(Date.now()+86_400_000);const futurePlan=createPlanFromDraft({title:'Plan real',place:'Tarragona',when:future.toISOString(),spots:'6',category:'Social',image:'x'});assert.ok(futurePlan?.startsAt);assert.equal(futurePlan?.distance,'Ubicación por confirmar');
  const past=new Date(Date.now()-86_400_000);assert.equal(createPlanFromDraft({title:'Plan pasado',place:'Tarragona',when:past.toISOString(),spots:'6',category:'Social',image:'x'}),null);

  assert.equal(hourFromPlanTime('Hoy · 19:59'),19);assert.equal(hourFromPlanTime('Hoy · 20:00'),20);assert.equal(hourFromPlanTime('Hoy · 24:00'),null);assert.equal(hourFromPlanTime('Sin hora'),null);
  const plans=[
    {title:'Mañana temprano',image:'x',time:'Hoy · 11:59',place:'Reus',distance:'8 km',spots:'4 plazas',category:'Deporte'},
    {title:'Café de tarde',image:'x',time:'Hoy · 12:00',place:'Tarragona',distance:'3 km',spots:'4 plazas',category:'Café'},
    {title:'Última hora de tarde',image:'x',time:'Hoy · 19:59',place:'Salou',distance:'2 km',spots:'4 plazas',category:'Café'},
    {title:'Cena',image:'x',time:'Hoy · 20:00',place:'Tarragona',distance:'5 km',spots:'4 plazas',category:'Comida'},
    {title:'Ruta sábado',image:'x',time:'Sáb · 10:00',place:'La Mussara',distance:'26 km',spots:'8 plazas',category:'Senderismo'},
    {title:'Plan lunes',image:'x',time:'Lun · 18:00',place:'Tarragona',distance:'1 km',spots:'8 plazas',category:'Deporte'},
  ];
  const run=(overrides={})=>filterExplorePlans(plans,{timeFilter:'all',category:null,query:'',sortAsc:true,...overrides});
  assert.deepEqual(run({timeFilter:'afternoon'}).map(p=>p.title),['Última hora de tarde','Café de tarde']);assert.deepEqual(run({timeFilter:'tonight'}).map(p=>p.title),['Cena']);assert.deepEqual(run({timeFilter:'today'}).map(p=>p.title),['Última hora de tarde','Café de tarde','Cena','Mañana temprano']);assert.deepEqual(run({timeFilter:'weekend'}).map(p=>p.title),['Ruta sábado']);assert.deepEqual(run({category:'Café'}).map(p=>p.title),['Última hora de tarde','Café de tarde']);assert.deepEqual(run({query:'tArRaGoNa'}).map(p=>p.title),['Plan lunes','Café de tarde','Cena']);assert.deepEqual(run({sortAsc:false}).map(p=>p.distance),['26 km','8 km','5 km','3 km','2 km','1 km']);
  const mixedPlans=[{title:'Demo cercano',image:'x',time:'Hoy · 18:00',place:'Tarragona',distance:'1 km',spots:'4 plazas',category:'Social'},{backendId:'real-1',title:'Plan real',image:'x',time:'Hoy · 18:00',place:'Tarragona',distance:'Cerca de ti',spots:'4 plazas',category:'Social'}];
  const mixed=filterExplorePlans(mixedPlans,{timeFilter:'all',category:null,query:'',sortAsc:true});assert.deepEqual(mixed.map(p=>p.title),['Plan real','Demo cercano']);
  const date=new Date();date.setHours(18,0,0,0);const real={...mixedPlans[1],time:'fecha localizada sin Hoy',startsAt:date.toISOString()};const filterReal=(timeFilter,items=[real])=>filterExplorePlans(items,{timeFilter,category:null,query:'',sortAsc:true});assert.equal(filterReal('today').length,1);assert.equal(filterReal('afternoon').length,1);assert.equal(filterReal('tonight').length,0);date.setHours(21);real.startsAt=date.toISOString();assert.equal(filterReal('tonight').length,1);date.setDate(date.getDate()+1);real.startsAt=date.toISOString();assert.equal(filterReal('today').length,0);real.startsAt='invalid';assert.equal(filterReal('today').length,0);const sunday=new Date();sunday.setDate(sunday.getDate()+(7-sunday.getDay())%7);sunday.setHours(18,0,0,0);real.startsAt=sunday.toISOString();assert.equal(filterReal('weekend').length,1);sunday.setDate(sunday.getDate()+7);real.startsAt=sunday.toISOString();assert.equal(filterReal('weekend').length,0);

  // Exercise database-to-UI conversion, including absent and malformed coordinates.
  fs.writeFileSync(path.join(tmpDir,'supabase.mjs'),`export const supabase={from(table){const query={select(){return query},in(){return query},gte(){return query},order(){return query},limit(){return query},then(resolve,reject){return Promise.resolve({data:table==='plans'?globalThis.__coordinateRows:[],error:null}).then(resolve,reject)}};return query}};`);
  const backendSource=fs.readFileSync('src/lib/realPlansBackend.ts','utf8');
  const backendResult=ts.transpileModule(backendSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},fileName:'realPlansBackend.ts'});
  fs.writeFileSync(path.join(tmpDir,'realPlansBackend.mjs'),backendResult.outputText.replace(/(['"])\.\/supabase\1/,"'./supabase.mjs'"));
  const {fetchRealPlans}=await import(pathToFileURL(path.join(tmpDir,'realPlansBackend.mjs')).href);
  const row={id:'coordinate-test',creator_id:'',title:'Coordinate test',category:'Social',location_name:null,starts_at:null,max_people:2,image_url:null,visibility:'public',share_slug:null};
  try{
    for(const invalid of [null,undefined,'',' ',false,true,[],{},NaN,Infinity,'not a coordinate']){
      globalThis.__coordinateRows=[{...row,latitude:invalid,longitude:invalid}];
      const [plan]=await fetchRealPlans();
      assert.equal(plan.latitude,undefined);assert.equal(plan.longitude,undefined);
      assert.equal(plan.distance,'Ubicación por confirmar');
    }
    for(const [latitude,longitude] of [[0,0],['41.1189','1.2445'],[-90,-180],[90,180]]){
      globalThis.__coordinateRows=[{...row,latitude,longitude}];
      const [plan]=await fetchRealPlans();
      assert.equal(plan.latitude,Number(latitude));assert.equal(plan.longitude,Number(longitude));
      assert.equal(plan.distance,'Ubicación disponible');
    }
    globalThis.__coordinateRows=[{...row,latitude:91,longitude:-181}];
    const [invalidRange]=await fetchRealPlans();
    assert.equal(invalidRange.latitude,undefined);assert.equal(invalidRange.longitude,undefined);
    console.log('✓ Missing coordinates stay missing; real zero and coordinate boundaries remain valid');
  }finally{delete globalThis.__coordinateRows;}

  console.log('Logic unit tests: OK');
} finally {fs.rmSync(tmpDir,{recursive:true,force:true});}
