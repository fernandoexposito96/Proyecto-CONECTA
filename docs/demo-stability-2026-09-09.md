# Auditoría de la demo actual — 9 de septiembre de 2026

Referencia: `main` en `5c864d89650b2df25daac699312dcf05890f1314`.
Rama: `audit/demo-stability-2026-09-09`. Sin merge, despliegue ni escrituras en Supabase.
Las pruebas de navegador usan cuentas ficticias y respuestas interceptadas en memoria.
No demuestran el funcionamiento del backend real ni que la aplicación publicada esté aislada.

## Bloque 1 — Validación reproducible

- Archivos: `src/views/HomeView.tsx`, `scripts/verify-structure.mjs`, `.gitignore`.
- Corregido: tipo de categoría incompatible con `CategoryIcon`, confirmado también en el CI de main.
- Corregido: comprobación de imports CSS no portable en Windows.
- Validación: comprobación estructural, 56 smoke de código, 10 comprobaciones de funcionalidades,
  2 renderizados React, 17 aserciones de lógica, TypeScript y build.
- Apariencia: JavaScript de Home idéntico tras transpilar el cambio de tipo;
  hashes CSS y JS del build idénticos a la referencia. CI del primer bloque correcto.

## Bloque 2 — Pruebas de navegador y accesibilidad

- Archivos: `package.json`, `package-lock.json`, `eslint.config.js`, `playwright.config.ts`,
  `tests/e2e/fixtures.ts`, `tests/e2e/demo.spec.ts`, `tests/e2e/README.md`,
  `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`,
  `src/components/PlanComponents.tsx`, `src/views/HomeView.tsx`,
  `src/views/ExploreView.tsx`, `src/lib/storage.ts` y este informe.
- Añadido ESLint sin silenciar avisos. Expresiones de alternancia reescritas como condiciones equivalentes.
- Corregidos controles interactivos anidados en tarjetas de planes y acceso por teclado
  al carrusel de personas de Inicio. Los fallos de guardado ya no se silencian.
- Añadidos E2E aislados y su ejecución obligatoria antes de publicar Pages.
- Validación local: lint, estructura, 85 comprobaciones existentes, TypeScript, build,
  9 E2E en Chromium escritorio, Chromium móvil y WebKit/iPhone. Audit de producción: 0 vulnerabilidades.
- Comparación visual automatizada contra un build separado del main de referencia:
  Inicio, Explora, Chat y Perfil en escritorio e iPhone; 8 capturas, **0 píxeles diferentes**.
  Capturas locales fuera del repositorio en `outputs/qa-demo/baseline`; informe de navegador
  en `playwright-report`. No se modificaron CSS, imágenes, textos visibles ni estilos.
- CI ampliado: correcto en el PR, ejecución `34327758424` (incluye los 9 E2E).

## Bloque 3 — Bloqueos y filtros de personas

- Archivos: `src/views/HomeView.tsx`, `src/views/ExploreView.tsx`,
  `tests/e2e/people.spec.ts`, `tests/e2e/demo.spec.ts`, `tests/e2e/README.md` y este informe.
- Corregido: Inicio volvía a mostrar a personas bloqueadas mediante el catálogo de recomendaciones.
- Corregido: los filtros ordenaban la cuadrícula, pero no la persona visible en el modo individual;
  ahora ambos consumen la misma lista y los likes se aplican a la persona realmente mostrada.
- Dos pruebas reprodujeron los fallos antes de corregirlos. Se comprueban bloqueo entre vistas,
  edad, afinidad, proximidad y selección del destinatario del like.
- Comparación visual repetida: 8 capturas de las vistas iniciales contra main, 0 píxeles diferentes.
- Dos ejecuciones agotaron el límite total de 30 segundos al agrupar navegación y capturas
  de varias pantallas en una sola prueba WebKit. Se separaron las capturas por pantalla,
  conservando la prueba de navegación continua. Sin aumentar límites ni reducir aserciones.
- Resultado posterior: lint, estructura, 85 comprobaciones existentes, TypeScript, build
  y **27 E2E correctos** en los tres motores/perfiles. CI de este bloque pendiente de publicar.

## Estado real y límites

- Corregido: error TypeScript de main; verificador Windows; accesibilidad descrita; errores de guardado silenciados.
- Comprobación correcta: las pruebas y comparaciones locales indicadas arriba.
- Riesgo a vigilar: bundle principal superior a 500 kB; no se ha elevado el umbral.
- Historial corregido: bloqueo en Inicio y filtros del modo individual de personas.
- No verificado todavía: cobertura completa de flujos, todos los anchos responsive, PWA,
  permisos/esquema del backend real, autenticación real y todas las pantallas con axe.
- Nora: no existe un ejecutor/informe Nora en este main. No hay una nueva puntuación comprobable.
  No se reutilizan puntuaciones históricas ni se clasifica lo no comprobado como fallo.
- Esta auditoría sigue en curso. No equivale a una certificación completa de producción.
