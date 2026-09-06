# Inventario Supabase de producción

Fecha de captura: 2026-09-06  
Proyecto: `qdjuypoqiafqncwgmicf` (`Conecta`, PostgreSQL 17.6)  
Método: consultas de solo lectura al catálogo PostgreSQL, listado de migraciones y advisors de Supabase.  
Base de código auditada: `main@dfbf3250a684bf11cba0e1b6f7cf3f6cb30e0e3c`.

## Estado confirmado

- 64 tablas en `public`; las 64 tienen RLS activado.
- 172 políticas RLS en `public` y 17 en `storage`.
- 19 funciones públicas; 7 usan `SECURITY DEFINER`.
- 9 buckets. Los buckets sensibles (`chat-media`, `identity-video`, `plan-capsules`, `conecta-media*`) no son públicos.
- Cero privilegios de tabla directos para `anon` en `public`.
- 92 entradas en el historial remoto de migraciones.
- 11 archivos de migración en el repositorio.
- Solo 2 archivos coinciden exactamente por versión y nombre con el historial remoto. Los otros 9 coinciden por nombre pero no por versión; faltan 90 versiones exactas para poder reproducir fielmente el historial.

### Tablas públicas

analytics_events, blocks, capsule_media, chat_summaries, client_error_events, comments, communities, community_members, community_posts, connections, conversation_members, conversations, emergency_contacts, event_members, events, fitness_preferences, identity_verifications, message_reactions, message_reads, messages, notification_preferences, notifications, organizer_accounts, organizer_applications, organizer_certifications, passkey_challenges, passkey_credentials, plan_cancellations, plan_capsules, plan_checkin_codes, plan_expenses, plan_invites, plan_members, plan_poll_options, plan_poll_votes, plan_polls, plan_ratings, plan_reminder_receipts, plans, post_likes, posts, privacy_consents, profile_trust, profiles, referrals, repeat_preferences, reports, reviews, risk_signals, robot_admins, robot_scan_jobs, robot_settings, safety_sessions, saved_items, social_actions, support_requests, transport_offers, transport_requests, trip_members, trips, user_achievements, user_challenges, user_safety_preferences, workout_sessions.

### Funciones públicas

- Endpoints autenticados intencionados: `checkin_with_code`, `get_connect_candidates`, `get_local_leaderboard`, `get_or_create_direct_conversation`, `issue_plan_checkin_code`, `mutual_repeat_match`, `my_conecta_staff_role`, `refresh_my_gamification`, `refresh_my_plan_reminders`, `register_profile_swipe`, `repeat_my_plan`, `touch_my_presence`, `undo_last_profile_pass`, `update_transport_request_status`.
- Funciones internas/trigger sin ejecución para clientes: `enforce_connection_update`, `enforce_report_moderation_update`, `handle_new_conecta_user`, `handle_new_user`, `set_updated_at`.
- Los cinco avisos del advisor sobre RPC `SECURITY DEFINER` son riesgos a revisar, no fallos confirmados: sus wrappers fijan `search_path` y pasan `auth.uid()` a funciones privadas. Deben conservarse en vigilancia hasta disponer de pruebas contractuales por rol.

### Almacenamiento

| Bucket | Público | Límite | Tipos principales |
| --- | --- | ---: | --- |
| avatars | sí | 5 MiB | JPEG, PNG, WebP |
| covers | sí | 8 MiB | JPEG, PNG, WebP |
| content-media | sí | 12 MiB | JPEG, PNG, WebP |
| chat-media | no | 12 MiB | imágenes y audio |
| conecta-media | no | 12 MiB | imágenes |
| conecta-media-private | no | 15 MiB | imágenes |
| conecta-media-public | no | 15 MiB | imágenes |
| identity-video | no | 15 MB | WebM, MP4, JPEG |
| plan-capsules | no | 12 MB | imágenes y vídeo |

## Hallazgos y clasificación

### Fallo confirmado

1. **Repositorio no reconstruible desde migraciones.** El historial de producción tiene 92 versiones y el repositorio 11 archivos; solo 2 coinciden exactamente. No se debe ejecutar `db reset`, renombrar migraciones ni fabricar historia. La reparación correcta requiere obtener un volcado de esquema limpio, revisarlo y establecer una línea base reproducible en una rama/base de datos aislada.

### Riesgos que vigilar

1. Supabase avisa de cinco RPC públicas autenticadas con `SECURITY DEFINER`. Parecen diseñadas como fachadas controladas y no se desactivan sin pruebas de autorización por rol.
2. La política `users update own media` de `storage.objects` tiene `USING` pero no `WITH CHECK`. Requiere una prueba aislada antes de endurecerla para no romper reemplazos existentes.
3. Los privilegios de `authenticated` siguen siendo amplios en muchas tablas, aunque RLS esté activado. Deben contrastarse con las operaciones reales antes de aplicar mínimo privilegio.
4. Índices señalados como no usados no se eliminan: la base es reciente y las estadísticas todavía no demuestran obsolescencia.

### No verificado

1. Configuración completa de Auth (duración JWT, MFA, SMTP, redirects y políticas de sesión) no está disponible mediante el inventario SQL.
2. La protección contra contraseñas filtradas aparece desactivada en el advisor. Debe habilitarse desde Auth de forma controlada; no se marca corregida hasta verificar la configuración.
3. No se ha probado todavía cada RPC con identidades `anon`, usuario propietario, usuario ajeno y staff.
4. No se ha probado una reconstrucción en una base aislada porque falta la historia completa.

### Comprobaciones correctas

- RLS está activa en todas las tablas expuestas de `public`.
- `anon` no conserva privilegios directos de tabla en `public`.
- Las RPC privilegiadas observadas fijan explícitamente el `search_path`.
- Los buckets de identidad, chat y cápsulas no son públicos.
- No se realizó ninguna escritura ni operación destructiva en producción durante esta auditoría.

## Plan seguro de reconciliación

1. Capturar un volcado de **solo esquema**, sin datos ni secretos.
2. Restaurarlo en una base aislada.
3. Comparar objetos, políticas, grants, funciones, triggers, índices y buckets.
4. Convertir la captura en una línea base versionada y mantener las 11 migraciones posteriores que correspondan.
5. Ejecutar pruebas contractuales de RLS/RPC por rol.
6. Solo después proponer cualquier migración de endurecimiento para producción.

El archivo `supabase/audit/production_inventory.sql` contiene las consultas reproducibles usadas para actualizar este inventario.
