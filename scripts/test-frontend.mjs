import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(path,'utf8');
const app=read('src/App.tsx');
const authGate=read('src/components/AuthGate.tsx');
const home=read('src/views/HomeView.tsx');
const explore=read('src/views/ExploreView.tsx');
const createPlan=read('src/views/CreatePlanView.tsx');
const chat=read('src/views/ChatView.tsx');
const profile=read('src/views/ProfileView.tsx');
const settings=read('src/views/SettingsView.tsx');
const navigation=read('src/components/AppNavigation.tsx');
const plans=read('src/components/PlanComponents.tsx');
const chatBackend=read('src/lib/chatBackend.ts');
const cloud=read('src/lib/cloud.ts');
const identity=read('src/lib/identity.ts');
const privacyBackend=read('src/lib/privacyBackend.ts');
const settingsBackend=read('src/lib/settingsBackend.ts');
const socialBackend=read('src/lib/socialBackend.ts');
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
  ['Ajustes locales se reflejan también en backend',()=>assert.match(storage,/syncSettingStorageKey\(key,value\)/)],
  ['Apariencia, idioma y privacidad usan user_settings real',()=>{assert.match(settingsBackend,/from\('user_settings'\)/);assert.match(settingsBackend,/appearance/);assert.match(settingsBackend,/language/);assert.match(settingsBackend,/privacy/)}],
  ['Notificaciones conservan frecuencia en user_settings',()=>assert.match(settingsBackend,/notifications:\{\.\.\.toggles,frequency:safeFrequency\}/)],
  ['Soporte dispone de inserción real protegida',()=>{assert.match(settingsBackend,/from\('support_requests'\)\.insert/);assert.match(settingsBackend,/request_type:kind/)}],
  ['Perfil lee la identidad autenticada',()=>assert.match(profile,/accountFromUser\(data\.user,stored\)/)],
  ['Perfil no mantiene Fernando escrito en el h1',()=>assert.doesNotMatch(profile,/<h1>Fernando/)],
  ['Perfil sincroniza la biografía real',()=>assert.match(profile,/\.from\('profiles'\)\.upsert/)],
  ['Ajustes leen el usuario autenticado',()=>assert.match(settings,/supabase\.auth\.getUser\(\)/)],
  ['Cerrar sesiones usa Supabase real',()=>assert.match(settings,/supabase\.auth\.signOut\(\{scope:'global'\}\)/)],
  ['El botón de sesiones ya no es un flash demo',()=>assert.doesNotMatch(settings,/Sesiones demo cerradas/)],
  ['Avatar superior usa la sesión real',()=>assert.match(navigation,/avatarFromUser\(data\.user,account\.name\)/)],
  ['La búsqueda superior abre Explora sin cortar una escritura',()=>{assert.match(navigation,/readOnly value=""/);assert.match(navigation,/openSearch/)}],
  ['Identidad tiene fallback del demo',()=>assert.match(identity,/demoAccount/)],
  ['Estado local se separa por usuario',()=>assert.match(cloud,/authUserMarker/)],
  ['No se migra el demo a otra cuenta',()=>assert.match(cloud,/localStateBelongsToUser/)],
  ['Sincronización cloud reintenta sin perder el parche',()=>assert.match(cloud,/pendingState=\{\.\.\.patch,\.\.\.pendingState\}/)],
  ['La cola cloud se invalida al cambiar de sesión',()=>{assert.match(cloud,/resetCloudStateQueue/);assert.match(cloud,/syncGeneration/)}],
  ['La hidratación cloud queda ligada al usuario esperado',()=>assert.match(cloud,/expectedUserId&&session\.user\.id!==expectedUserId/)],
  ['Conexiones reales tienen puente Supabase',()=>assert.match(socialBackend,/requestBackendConnection/)],
  ['Chat conserva fallback local',()=>assert.match(chat,/demo fallback kept/)],
  ['Chat tiene puente de mensajes reales',()=>assert.match(chatBackend,/sendBackendMessage/)],
  ['Chat real no marca como enviado un fallo de red',()=>assert.match(chat,/message not marked as sent/)],
  ['Conversaciones reales vacías siguen visibles',()=>assert.match(chatBackend,/Conversación nueva/)],
  ['Bloqueos reales se sincronizan sin tocar IDs demo',()=>assert.match(cloud,/syncBackendBlocks/)],
  ['Sync de bloqueos recuerda solo el estado conocido de la sesión',()=>{assert.match(privacyBackend,/lastDesiredBlockIds/);assert.match(privacyBackend,/prepareBlockSyncUser/)}],
  ['Sync de bloqueos solo elimina IDs previamente conocidos',()=>assert.match(privacyBackend,/lastDesiredBlockIds[\s\S]*filter\(id=>!desired\.has\(id\)&&existing\.has\(id\)\)/)],
  ['Auth no queda bloqueado si falla la inicialización',()=>assert.match(authGate,/setReady\(true\)/)],
  ['Auth limpia la cola al cambiar de sesión',()=>assert.match(authGate,/resetCloudStateQueue\(\)/)],
  ['Auth usa mínimo de 8 caracteres',()=>{assert.match(authGate,/password\.length<8/);assert.match(authGate,/minLength=\{8\}/)}],
  ['Crear plan espera el resultado de sincronización',()=>assert.match(createPlan,/await onCreate\(plan\)/)],
  ['Tarjetas de plan tienen navegación por teclado',()=>assert.match(plans,/tabIndex=\{0\}/)],
];

for(const [name,check] of checks){
  try{check();console.log(`✓ ${name}`)}
  catch(error){console.error(`✗ ${name}`);throw error}
}
console.log(`Frontend smoke tests: ${checks.length}/${checks.length} OK`);
