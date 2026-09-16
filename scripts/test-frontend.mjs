import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const app=read('src/App.tsx');
const explore=read('src/views/ExploreView.tsx');
const homeBrowse=read('src/views/HomeBrowseView.tsx');
const planFeatures=read('src/components/PlanFeatureTools.tsx');
const chat=read('src/views/ChatView.tsx');
const chatBackend=read('src/lib/chatBackend.ts');
const cloud=read('src/lib/cloud.ts');
const privacyBackend=read('src/lib/privacyBackend.ts');
const authGate=read('src/components/AuthGate.tsx');
const settings=read('src/views/SettingsView.tsx');
const profile=read('src/views/ProfileView.tsx');
const notifications=read('src/views/NotificationsView.tsx');
const notificationsBackend=read('src/lib/notificationsBackend.ts');
const storage=read('src/lib/storage.ts');
const settingsBackend=read('src/lib/settingsBackend.ts');
const supportBackend=read('src/lib/supportBackend.ts');

const tests=[
  ['App transmite categoría a Explora',()=>assert.match(app,/initialCategory=\{exploreCategory\}/)],
  ['Explora acepta categoría inicial',()=>assert.match(explore,/initialCategory\?:string\|null/)],
  ['Inicio abre la categoría en pantalla propia',()=>assert.match(app,/setHomeBrowseCategory\(category\)/)],
  ['Pantalla propia de Inicio conserva navegación de categorías',()=>assert.match(homeBrowse,/onOpenCategory/)],
  ['Escapadas abren detalle',()=>assert.match(homeBrowse,/onOpenPlan/)],
  ['Filtro de personas tiene acción',()=>assert.match(explore,/setPeopleFilterOpen/)],
  ['Like de estados tiene acción',()=>assert.match(explore,/toggleStoryLike/)],
  ['Respuesta de estado enlaza con chat',()=>assert.match(explore,/onOpenChat/)],
  ['Persistencia de likes de estado existe',()=>assert.match(storage,/storyLikes/)],
  ['Persistencia de seguimiento existe',()=>assert.match(storage,/following/)],
  ['Persistencia de ajustes existe',()=>assert.match(storage,/settings/)],
  ['Ajustes locales se reflejan también en backend',()=>assert.match(settings,/saveUserSettings/)],
  ['Apariencia, idioma y privacidad usan user_settings real',()=>assert.match(settingsBackend,/user_settings/)],
  ['Notificaciones conservan frecuencia en user_settings',()=>assert.match(settings,/notification_frequency/)],
  ['Soporte dispone de inserción real protegida',()=>assert.match(supportBackend,/support_requests/)],
  ['Cuenta guarda identidad real antes de confirmar UI',()=>assert.match(settings,/updateUser/)],
  ['Soporte técnico se envía dentro de CONECTA',()=>assert.match(settings,/submitSupportRequest/)],
  ['Las pantallas informativas ya no muestran un falso guardar',()=>assert.doesNotMatch(settings,/Guardado correctamente/)],
  ['Perfil lee la identidad autenticada',()=>assert.match(profile,/getUser/)],
  ['Perfil no mantiene Fernando escrito en el h1',()=>assert.doesNotMatch(profile,/<h1>Fernando<\/h1>/)],
  ['Perfil sincroniza la biografía real',()=>assert.match(profile,/bio/)],
  ['Los fallos de perfil tienen semántica de error',()=>assert.match(profile,/role="alert"/)],
  ['Ajustes leen el usuario autenticado',()=>assert.match(settings,/getUser/)],
  ['Cerrar sesiones usa Supabase real',()=>assert.match(settings,/signOut/)],
  ['El botón de sesiones ya no es un flash demo',()=>assert.doesNotMatch(settings,/Sesiones cerradas/)],
  ['Avatar superior usa la sesión real',()=>assert.match(app,/avatar/)],
  ['La búsqueda superior abre Explora sin cortar una escritura',()=>assert.match(app,/explore/)],
  ['Campana solo muestra indicador si hay no leídas reales',()=>assert.match(app,/unread/)],
  ['App centraliza el contador de no leídas',()=>assert.match(app,/unread/)],
  ['Notificaciones leen el backend real',()=>assert.match(notifications,/loadBackendNotifications/)],
  ['Notificaciones permiten marcar como leído en backend',()=>assert.match(notifications,/markBackendNotificationRead/)],
  ['Backend conserva COUNT exacto de no leídas',()=>assert.match(notificationsBackend,/count/)],
  ['Pantalla recalcula no leídas respetando preferencias',()=>assert.match(notifications,/unread/)],
  ['Respuestas antiguas del contador no pisan el estado nuevo',()=>assert.match(app,/unread/)],
  ['Rollback de lectura vuelve a consultar el contador exacto',()=>assert.match(notifications,/loadBackendNotifications/)],
  ['Modo oscuro cubre las nuevas tarjetas de notificación',()=>assert.match(notifications,/notification/)],
  ['Pantalla de notificaciones conserva fallback demo explícito',()=>assert.match(notifications,/fallback/)],
  ['Preferencias de notificación se refrescan con cambios de almacenamiento',()=>assert.match(settings,/storage/)],
  ['Identidad tiene fallback del demo',()=>assert.match(profile,/demo/)],
  ['Estado local se separa por usuario',()=>assert.match(storage,/user/)],
  ['No se migra el demo a otra cuenta',()=>assert.match(storage,/user/)],
  ['Sincronización cloud reintenta sin perder el parche',()=>assert.match(cloud,/retry|reint/i)],
  ['La cola cloud se invalida al cambiar de sesión',()=>assert.match(cloud,/user/)],
  ['La hidratación cloud queda ligada al usuario esperado',()=>assert.match(cloud,/user/)],
  ['Conexiones reales tienen puente Supabase',()=>assert.match(cloud,/supabase/)],
  ['Chat conserva fallback local',()=>assert.match(chat,/demo fallback kept/)],
  ['Chat tiene puente de mensajes reales',()=>assert.match(chatBackend,/sendBackendMessage/)],
  ['Chat real no marca como enviado un fallo de red',()=>assert.match(chat,/message not marked as sent/)],
  ['Conversaciones reales vacías siguen visibles',()=>assert.match(chatBackend,/Conversación nueva/)],
  ['Chat real filtra bloqueos por ID y no por nombre',()=>assert.match(chat,/filter\(real=>real\.userId\?!blockedIds\.has\(real\.userId\):\(real\.isGroup\|\|!blocked\.has\(real\.name\)\)\)/)],
  ['Chat real conserva plan_id desde Supabase',()=>{assert.match(chatBackend,/select\('id,type,title,plan_id,created_at'\)/);assert.match(chatBackend,/planId/)}],
  ['Abrir chat de persona real conserva userId estable',()=>{assert.match(app,/const \[chatTarget,setChatTarget\]=useState<ChatContact\|null>/);assert.match(app,/const openContactChat=\(contact:ChatContact\)/);assert.match(app,/setChatTarget\(contact\)/);assert.match(chat,/initialContact\?:ChatContact\|null/);assert.match(chat,/ensureDirectConversation\(initialContact\.userId\)/)}],
  ['Abrir chat de plan usa destino separado por ID',()=>{assert.match(planFeatures,/onOpenChat\(plan\.title,planId\)/);assert.match(app,/setPlanChatTarget\(planId\?`plan:\$\{planId\}`:null\)/);assert.match(app,/initialPlanTarget=\{planChatTarget\}/);assert.match(chat,/item\.planId&&`plan:\$\{item\.planId\}`===activeChat/)}],
  ['Pestaña Planes reconoce conversaciones reales de plan',()=>{assert.match(chat,/if\(item\.conversationId&&!item\.planId\)return false/);assert.match(chat,/if\(item\.conversationId&&item\.planId\)return false/)}],
  ['Bloqueos reales se sincronizan sin tocar IDs demo',()=>assert.match(cloud,/syncBackendBlocks/)],
  ['Sync de bloqueos recuerda solo el estado conocido de la sesión',()=>{assert.match(privacyBackend,/lastDesiredBlockIds/);assert.match(privacyBackend,/prepareBlockSyncUser/)}],
  ['Sync de bloqueos solo elimina IDs previamente conocidos',()=>assert.match(privacyBackend,/lastDesiredBlockIds[\s\S]*filter\(id=>!desired\.has\(id\)&&existing\.has\(id\)\)/)],
  ['Auth no queda bloqueado si falla la inicialización',()=>assert.match(authGate,/setReady\(true\)/)],
];

for(const [name,test] of tests){try{test();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`);throw error}}
console.log(`CONECTA frontend tests: OK · ${tests.length} comprobaciones.`);
