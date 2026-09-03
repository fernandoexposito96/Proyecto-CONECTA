# CONECTA — Engineering Audit

Fecha: 2026-09-03
Rama canónica: `main`

## Estado actual

CONECTA tiene una base funcional moderna con Vite, React, TypeScript y Supabase. La versión activa usa una única entrada CSS (`src/ui.css`), carga diferida para vistas pesadas, validación automática, smoke tests y despliegue GitHub Pages.

## Fortalezas ya consolidadas

- TypeScript con `tsc --noEmit` en validación.
- Build de producción con Vite.
- Smoke tests antes del despliegue.
- Vistas secundarias pesadas cargadas con `lazy()` y `Suspense`.
- Supabase con columnas explícitas en la carga inicial, evitando `select('*')` en el arranque principal.
- Consultas iniciales paralelas para datos independientes.
- Relaciones `plan_members` y `community_members` limitadas a los planes y comunidades realmente cargados.
- Conexiones iniciales filtradas al usuario actual.
- Realtime para mensajes y notificaciones con limpieza de canales al desmontar.
- PWA con navegación network-first y assets versionados cache-first.
- Imágenes con estrategia stale-while-revalidate en el service worker.
- Responsive universal para móvil, tablet, portátil, escritorio y PWA instalada.
- `content-visibility` para reducir renderizado fuera de pantalla.
- Arranque consistente con splash negro y marca CONECTA.
- Migraciones Supabase específicas para endurecimiento de políticas y concurrencia.

## Riesgos / deuda técnica restante

### 1. `src/App.tsx` sigue siendo demasiado grande

Actualmente concentra demasiadas vistas, formularios y lógica de interacción. Aunque funciona y varias vistas ya están lazy-loaded, debe seguir dividiéndose gradualmente en módulos como:

- `views/HomeView.tsx`
- `views/ExploreView.tsx`
- `views/PlansView.tsx`
- `views/GroupsView.tsx`
- `views/MapView.tsx`
- `views/CalendarView.tsx`
- `components/PlanCard.tsx`
- `components/PersonCard.tsx`

No hacer una división masiva de una sola vez: separar por bloques con validación después de cada extracción.

### 2. Consolidación CSS aún no está terminada

`src/ui.css` es la entrada única correcta, pero todavía importa varias capas históricas. Deben eliminarse gradualmente reglas duplicadas y hotfixes cuando se confirme visualmente que la capa canónica cubre esos casos.

Regla: nunca añadir un CSS directo nuevo desde `main.tsx`. Todo debe entrar por `ui.css`.

### 3. Datos relacionados y escalabilidad

La carga inicial ya limita relaciones a los objetos visibles. El siguiente nivel de escala será paginación/cursor para planes, perfiles y comunidades, en lugar de aumentar límites fijos.

No aumentar los límites indefinidamente.

### 4. Imágenes

Los planes y comunidades ya tienen fallback por categoría cuando no existe `image_url`. Debe mantenerse la regla de que toda tarjeta visual tenga una fuente de imagen o fallback. Como mejora futura, añadir fallback ante error HTTP de una imagen remota, no solo cuando la URL esté vacía.

### 5. Lint

Existe script `npm run lint`, pero no se ha convertido todavía en bloqueo obligatorio del despliegue. Antes de incluirlo en `validate`, ejecutar una limpieza de avisos existente para evitar bloquear producción por deuda histórica no funcional.

### 6. Testing funcional

Los smoke tests protegen contratos estructurales. Para una cobertura de producto más alta se necesitan tests de interacción para:

- registro / login / verificación;
- crear y unirse a plan;
- guardar plan;
- grupos;
- chat;
- calendario;
- seguridad y bloqueo;
- responsive visual en breakpoints principales.

## Reglas de arquitectura

1. `main` es la única rama de producción.
2. `src/main.tsx` debe mantener una sola importación CSS: `./ui.css`.
3. `src/universal-responsive.css` debe ser la última capa CSS importada.
4. No introducir anchos rígidos que puedan superar el viewport.
5. Las listas grandes deben paginarse o limitarse; nunca crecer sin control.
6. Consultas Supabase deben seleccionar solo columnas necesarias.
7. Datos privados deben depender de RLS y además filtrarse en cliente cuando sea razonable.
8. Toda suscripción realtime debe limpiarse al desmontar.
9. Toda vista pesada nueva debe evaluarse para lazy loading.
10. Ningún cambio visual debe romper `npm run validate`.

## Prioridad recomendada para el cierre 1.0

1. Mantener CI verde y revisar el despliegue después de cada cambio.
2. Terminar extracción progresiva de `App.tsx`.
3. Consolidar CSS histórico sin alterar el diseño Premium.
4. Añadir pruebas funcionales de los flujos críticos.
5. Revisar RLS/policies directamente contra el proyecto Supabase desplegado antes del cierre definitivo.

## Criterio de “listo”

No considerar CONECTA 1.0 cerrada solo porque el diseño se vea correcto. El cierre requiere simultáneamente:

- TypeScript verde;
- build verde;
- smoke tests verdes;
- despliegue verde;
- flujos críticos probados;
- políticas Supabase revisadas;
- responsive verificado en móvil, tablet y escritorio;
- sin regresiones visuales en la versión Premium.
