import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const tmp=path.resolve('scripts/.react-test-tmp');
fs.rmSync(tmp,{recursive:true,force:true});
fs.mkdirSync(tmp,{recursive:true});

const compile=(sourcePath,outName,transform=(code)=>code)=>{
  const source=fs.readFileSync(sourcePath,'utf8');
  const result=ts.transpileModule(source,{
    compilerOptions:{
      jsx:ts.JsxEmit.ReactJSX,
      module:ts.ModuleKind.ESNext,
      target:ts.ScriptTarget.ES2022,
      esModuleInterop:true,
    },
    fileName:sourcePath,
  });
  const out=path.join(tmp,outName);
  fs.writeFileSync(out,transform(result.outputText));
  return out;
};

try{
  const categoryPath=compile('src/components/CategoryIcon.tsx','CategoryIcon.mjs');
  const {CategoryIcon}=await import(`${pathToFileURL(categoryPath).href}?v=1`);
  const categoryMarkup=renderToStaticMarkup(React.createElement(CategoryIcon,{name:'Deporte'}));
  assert.match(categoryMarkup,/<svg/);
  console.log('✓ CategoryIcon renderiza un icono React');

  fs.writeFileSync(path.join(tmp,'settingsBackend.mjs'),'export async function syncSettingStorageKey(){ return false; }\n');
  fs.writeFileSync(path.join(tmp,'PlanFeatureTools.mjs'),'export function PlanFeatureTools(){ return null; }\n');
  compile('src/lib/storage.ts','storage.mjs',code=>code
    .replace("'./settingsBackend'","'./settingsBackend.mjs'")
    .replace('"./settingsBackend"','"./settingsBackend.mjs"'));
  compile('src/lib/privacy.ts','privacy.mjs',code=>code.replace("'./storage'","'./storage.mjs'").replace('"./storage"','"./storage.mjs"'));
  const planPath=compile('src/components/PlanComponents.tsx','PlanComponents.mjs',code=>code
    .replace("'../lib/storage'","'./storage.mjs'")
    .replace('"../lib/storage"','"./storage.mjs"')
    .replace("'../lib/privacy'","'./privacy.mjs'")
    .replace('"../lib/privacy"','"./privacy.mjs"')
    .replace("'./PlanFeatureTools'","'./PlanFeatureTools.mjs'")
    .replace('"./PlanFeatureTools"','"./PlanFeatureTools.mjs"'));
  global.window={
    localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{},key:()=>null,length:0},
  };
  const {PlanCards}=await import(`${pathToFileURL(planPath).href}?v=1`);
  const sample={title:'Plan de prueba',image:'image-fallback.svg',time:'Hoy · 19:00',place:'Tarragona',distance:'2 km',spots:'6 plazas',category:'Deporte'};
  const markup=renderToStaticMarkup(React.createElement(PlanCards,{items:[sample],onPlan:()=>{}}));
  assert.match(markup,/Plan de prueba/);
  assert.match(markup,/Añadir a favoritos/);
  console.log('✓ PlanCards renderiza datos y acciones del demo');

  console.log('React smoke tests: 2/2 OK');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
