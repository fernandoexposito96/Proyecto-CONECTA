import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const app=read('src/App.tsx');
const planTools=read('src/components/PlanFeatureTools.tsx');
const planFeatures=read('src/lib/planFeaturesBackend.ts');
const invite=read('src/lib/inviteBackend.ts');
const auth=read('src/components/AuthGate.tsx');
const safety=read('src/lib/safetyBackend.ts');
const security=read('src/views/settings/SecuritySettingsScreens.tsx');
const verification=read('src/lib/verificationBackend.ts');
const summary=read('src/lib/socialSummaryBackend.ts');
const calendar=read('src/views/CalendarView.tsx');
const notifications=read('src/views/NotificationsView.tsx');
const notificationsBackend=read('src/lib/notificationsBackend.ts');

const checks=[
  ['Planes reales entran en la aplicación',()=>assert.match(app,/fetchRealPlans\(\)/)],
  ['Invitación se acepta tras autenticación',()=>{assert.match(app,/acceptPlanInvite\(code\)/);assert.match(auth,/invitePending/);assert.match(invite,/accept_plan_invite/)}],
  ['Encuestas usan tablas reales',()=>{assert.match(planFeatures,/from\('plan_polls'\)/);assert.match(planFeatures,/from\('plan_poll_votes'\)/);assert.match(planTools,/Encuesta de grupo/)}],
  ['Invitación pública se genera desde el plan',()=>{assert.match(planFeatures,/from\('plan_invites'\)/);assert.match(planTools,/shareInvite/)}],
  ['Check-in usa RPC protegido',()=>{assert.match(planFeatures,/issue_plan_checkin_code/);assert.match(planFeatures,/checkin_with_code/);assert.match(planTools,/Check-in/)}],
  ['Seguridad crea sesión real con contacto de emergencia',()=>{assert.match(safety,/from\('safety_sessions'\)/);assert.match(safety,/from\('emergency_contacts'\)/);assert.match(security,/Contacto de emergencia/)}],
  ['Selfie usa almacenamiento privado y revisión real',()=>{assert.match(verification,/identity-video/);assert.match(verification,/identity_verifications/);assert.match(security,/Verificación por selfie/)}],
  ['Wrapped semanal calcula racha y próximo plan',()=>{assert.match(summary,/streakWeeks/);assert.match(summary,/nextPlan/);assert.match(summary,/weekPlans/)}],
  ['Calendario tiene modo solo esta semana',()=>{assert.match(calendar,/Solo esta semana/);assert.match(calendar,/weekOnly/);assert.match(app,/view==='Calendario'/)}],
  ['Recordatorio abre el chat del plan',()=>{assert.match(notificationsBackend,/entity_type,entity_id/);assert.match(notifications,/onOpenPlanChat/);assert.match(notifications,/Abrir chat del plan/)}],
];

for(const [name,check] of checks){check();console.log(`✓ ${name}`)}
console.log(`Feature round tests: ${checks.length}/${checks.length} OK`);
