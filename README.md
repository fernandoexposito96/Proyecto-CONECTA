# CONECTA

CONECTA es una aplicación social para descubrir personas compatibles, organizar planes reales y crear comunidades con herramientas de confianza y seguridad.

## Funcionalidades

- Autenticación, verificación de correo y passkeys nativas de Supabase Auth.
- Descubrimiento de personas, planes y comunidades.
- Inscripción, guardado y gestión de planes.
- Chat en tiempo real, notificaciones y confirmaciones de lectura.
- Controles de privacidad, bloqueo, denuncia y exportación de datos.
- Experiencia PWA responsive con soporte offline y actualización automática.
- Modo de demostración para explorar el producto sin datos reales.

## Stack

- React 19 + TypeScript
- Vite
- Supabase (Auth, PostgreSQL, RLS y Realtime)
- Vitest, Playwright y axe-core
- GitHub Actions y GitHub Pages
- Sentry opcional mediante variable de entorno

## Desarrollo local

Requisitos: Node.js 22 y pnpm 11 (fijado en `packageManager`).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

## Variables de entorno

Consulta [`.env.example`](./.env.example):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN` (opcional)

Nunca almacenes claves privadas o `service_role` en variables `VITE_*`: Vite las expone al navegador.

## Calidad

```bash
pnpm lint
pnpm check
pnpm test:unit
pnpm build
pnpm test:smoke
pnpm test:performance
pnpm test:security
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

La puerta completa se ejecuta con `pnpm validate`.

## Arquitectura

- `src/main.tsx`: arranque, resiliencia, PWA y telemetría.
- `src/App.tsx`: orquestación principal del producto.
- `src/views/`: vistas complejas con carga diferida.
- `src/components/`: componentes compartidos.
- `src/data/`: consultas y refrescos parciales de Supabase.
- `supabase/migrations/`: políticas, funciones e índices versionados.
- `scripts/`: contratos automáticos de seguridad, rendimiento y estructura.
- `tests/`: pruebas unitarias y end-to-end.

Consulta [Engineering Audit](./docs/ENGINEERING-AUDIT.md) y [Project Structure](./docs/CONECTA-STRUCTURE.md) para conocer las decisiones y la deuda técnica activa.

## Despliegue

La rama canónica es `main`. Cada cambio ejecuta lint, TypeScript, pruebas, build y validaciones de seguridad/rendimiento antes de publicarse en GitHub Pages.

## Seguridad

La clave publicable de Supabase está diseñada para ejecutarse en cliente. La autorización efectiva depende de las políticas RLS versionadas en `supabase/migrations`. No publiques datos personales, tokens ni credenciales en issues.

## Licencia

No se ha declarado una licencia de código abierto. Todos los derechos permanecen reservados al autor.
