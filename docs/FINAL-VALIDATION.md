# CONECTA — Validación final

Este documento registra únicamente las comprobaciones que requieren validación real o configuración externa y evita marcar como resuelto aquello que CI no puede certificar.

## Bloques pendientes de certificación

- [ ] Auth: activar y verificar Leaked Password Protection en Supabase Auth.
- [ ] Multidispositivo: validar iPhone, iPad/tablet, Android y escritorio.
- [ ] E2E multiusuario: validar dos cuentas reales en chat, bloqueo, privacidad, invitaciones y asistencia/lista de espera.
- [ ] Rendimiento: medir con tráfico/datos representativos antes de eliminar índices por falta de uso.
- [ ] Producción: recorrido manual completo contra el despliegue publicado.
- [ ] Moderación: validar denuncia -> persistencia -> revisión -> resolución.
- [ ] Pantallas: recorrido final por Inicio, Explora, Perfil, Planes, Eventos, Viajes, Comunidades, Chat, Calendario, Mapa, Notificaciones y Ajustes.

## Criterio de cierre

Un bloque solo pasa a completado cuando exista evidencia de la comprobación correspondiente. Los checks automáticos de GitHub (validate, build, browser-smoke, análisis y deploy) complementan esta lista, pero no sustituyen pruebas reales de dispositivo, usuario o configuración externa.
