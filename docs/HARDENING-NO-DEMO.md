# CONECTA — Hardening sin tocar demo ni estructura

Objetivo: mejorar estabilidad, rendimiento y escalabilidad sin rediseñar pantallas, cambiar navegación ni alterar los datos demo.

## Zonas congeladas

En ramas técnicas (`perf/*`, `fix/*`, `db/*`, `pwa/*`, `robot/*`, `chore/hardening-*`) se consideran congeladas salvo corrección explícita y revisada:

- `src/App.tsx`
- `src/views/**`
- `src/components/**`
- `src/styles/**`
- `src/data/**`
- `index.html`
- `public/**`

## Cambios permitidos

- Workflows y controles CI.
- Scripts de verificación, rendimiento y seguridad.
- Configuración de build que no altere el aspecto de la aplicación.
- Código de infraestructura y utilidades internas fuera de las zonas congeladas.
- Optimizaciones de Supabase/consultas/Realtime que mantengan el mismo contrato visible.
- Paginación, caché y límites siempre que no cambien el contenido demo ni la navegación.

## Flujo obligatorio

1. Partir de `main` limpio.
2. Trabajar en rama técnica.
3. Ejecutar `npm ci`, `npm run check` y `npm run build`.
4. Pasar el guard de demo/estructura.
5. Pasar presupuesto de bundle.
6. Abrir PR contra `main`.
7. No auto-mergear reparaciones del robot.
8. Mantener `stable/conecta-premium` como referencia de recuperación.

## Principio de seguridad

Si una optimización requiere cambiar una zona congelada, debe quedar fuera del hardening automático y tratarse como una tarea separada con revisión visual específica.
