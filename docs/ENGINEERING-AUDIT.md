# CONECTA — Engineering Audit

Fecha: 2026-09-04
Rama auditada: `audit/premium-2026-09-04`

## Estado verificado

- Una aplicación React/TypeScript y una entrada global de estilos (`src/ui.css`).
- Sin mutadores DOM heredados ni pantallas paralelas inyectadas fuera de React.
- Dependencias reproducibles con pnpm y lockfile obligatorio.
- CI canónica en `validate.yml` y despliegue único en `deploy-pages.yml`.
- Lint sin errores ni advertencias, TypeScript estricto y build de producción verde.
- Unitarios de autenticación, datos demo y utilidades de dominio.
- E2E, móvil y accesibilidad en Chromium y WebKit/iPhone.
- PWA con actualización no disruptiva, cachés acotadas y navegación offline.
- Supabase inspeccionado contra el proyecto activo: RLS habilitado en todas las tablas públicas.
- Roles de navegador endurecidos: `anon` sin acceso a tablas públicas y `authenticated` sin `TRUNCATE`, `REFERENCES` ni `TRIGGER`.

## Decisiones de arquitectura

- Las passkeys usan la API nativa de Supabase Auth; no se mantiene una segunda implementación WebAuthn.
- `src/navigation.ts` y `src/toast.ts` aíslan estado/constantes no visuales y preservan Fast Refresh.
- Las vistas complejas continúan con carga diferida y chunks independientes.
- Los errores de sesión, datos, PWA y Supabase no se descartan silenciosamente.
- La migración `20260904163000_enforce_least_privilege_api_roles.sql` fija mínimos privilegios presentes y futuros.

## Deuda técnica conocida

- `src/App.tsx` sigue siendo un composition root grande. Debe extraerse por vistas con cobertura autenticada antes de mover lógica sensible.
- La hoja global todavía conserva capas CSS históricas con solapamientos. Su consolidación requiere regresión visual autenticada en cada breakpoint.
- El repositorio solo contiene migraciones incrementales recientes; falta una línea base completa del esquema para recrear desde cero las 421 tablas existentes.
- Supabase Auth mantiene desactivada la protección de contraseñas filtradas; debe activarse desde la configuración del proyecto si el plan contratado lo permite.
- Los cinco RPC públicos `SECURITY DEFINER` son wrappers deliberados de operaciones autenticadas. Sus funciones core privadas validan usuario y permisos; el asesor seguirá mostrándolos como revisión manual.
- Las pruebas E2E públicas cubren arranque, móvil, accesibilidad y navegación. Los flujos autenticados destructivos necesitan usuarios de prueba aislados y secretos CI dedicados.

## Puerta de entrega

```bash
pnpm validate
```

No se publica desde una rama de auditoría. El despliegue de Pages solo se ejecuta desde `main` después de revisar el diff y repetir esta puerta completa.
