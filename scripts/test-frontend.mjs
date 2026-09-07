import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(path,'utf8');
const app=read('src/App.tsx');
const home=read('src/views/HomeView.tsx');
const explore=read('src/views/ExploreView.tsx');
const profile=read('src/views/ProfileView.tsx');
const settings=read('src/views/SettingsView.tsx');
const navigation=read('src/components/AppNavigation.tsx');
const cloud=read('src/lib/cloud.ts');
const identity=read('src/lib/identity.ts');
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
  ['Perfil lee la identidad autenticada',()=>assert.match(profile,/accountFromUser\(data\.user,stored\)/)],
  ['Perfil no mantiene Fernando escrito en el h1',()=>assert.doesNotMatch(profile,/<h1>Fernando/)],
  ['Ajustes leen el usuario autenticado',()=>assert.match(settings,/supabase\.auth\.getUser\(\)/)],
  ['Cerrar sesiones usa Supabase real',()=>assert.match(settings,/supabase\.auth\.signOut\(\{scope:'global'\}\)/)],
  ['El botón de sesiones ya no es un flash demo',()=>assert.doesNotMatch(settings,/Sesiones demo cerradas/)],
  ['Avatar superior usa la sesión real',()=>assert.match(navigation,/avatarFromUser\(data\.user,account\.name\)/)],
  ['Identidad tiene fallback del demo',()=>assert.match(identity,/demoAccount/)],
  ['Estado local se separa por usuario',()=>assert.match(cloud,/authUserMarker/)],
  ['No se migra el demo a otra cuenta',()=>assert.match(cloud,/localStateBelongsToUser/)],
];

for(const [name,check] of checks){
  try{check();console.log(`✓ ${name}`)}
  catch(error){console.error(`✗ ${name}`);throw error}
}
console.log(`Frontend smoke tests: ${checks.length}/${checks.length} OK`);
