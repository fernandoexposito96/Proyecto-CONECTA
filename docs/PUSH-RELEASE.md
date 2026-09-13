# CONECTA — cierre de Push Web

La infraestructura de cliente queda preparada con listener `push`, apertura mediante `notificationclick`, `Background Sync` y tabla `push_subscriptions` protegida por RLS en Supabase.

Para enviar notificaciones push reales desde servidor falta únicamente configurar las credenciales VAPID como secretos privados del backend/Edge Function. Nunca deben guardarse en GitHub, `src/`, el manifest ni variables públicas de Vite.

Pendiente externo para activación final:
- Generar par VAPID.
- Guardar la clave privada como secreto de Supabase Edge Functions.
- Exponer solo la clave pública al cliente.
- Desplegar la función de envío y hacer una prueba desde un dispositivo real autorizado.

Esto es una dependencia de credenciales externas, no una carencia del PWA/service worker.
