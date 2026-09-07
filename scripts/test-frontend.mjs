import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(path,'utf8');
const app=read('src/App.tsx');
const home=read('src/views/HomeView.tsx');
const explore=read('src/views/ExploreView.tsx');
const storage=read('src/lib/storage.ts');

const checks=[
  ['App transmite categoría a Explora',()=>assert.match(app,/initialCategory=\{exploreCategory\}/)],
  ['Explora acepta categoría inicial',()=>assert.match(explore,/initialCategory\?:string\|null/)],
  ['Inicio abre la categoría elegida',()=>assert.match(home,/openExplore\('all',name\)/)],
  ['Escapadas abren detalle',()=>assert.match(home,/onClick=\{\(\)=>openEscape\(/)],
  ['Filtro de personas tiene acción',()=>assert.match(explore,/onClick=\{cyclePeopleFilter\}/)],
  ['Like de estados tiene acción',()=>assert.match(explore,/onClick=\{\(\)=>toggleStoryLike\(/)],
  ['Respuesta de estado enlaza con chat',()=>assert.match(explore,/sendStoryReply/)],
  ['Persistencia de likes de estado existe',()=>assert.match(storage,/storyLikes:/)],
  ['Persistencia de seguimiento existe',()=>assert.match(storage,/organizerFollows:/)],
  ['Persistencia de ajustes existe',()=>assert.match(storage,/settingsAccount:/)],
];

for(const [name,check] of checks){
  try{check();console.log(`✓ ${name}`)}
  catch(error){console.error(`✗ ${name}`);throw error}
}
console.log(`Frontend smoke tests: ${checks.length}/${checks.length} OK`);
