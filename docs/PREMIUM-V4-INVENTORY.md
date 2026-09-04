# CONECTA Premium V4 — Inventario de referencia

Rama: `conecta-premium-reference-v4`

## Navegación móvil oficial

`Inicio · Explora · + · Chat · Perfil`

## Módulos visuales V4

- `src/premium-reference-v4.css` — tokens y acabado global Premium V4.
- `src/views/home-reference-v4.css` — Inicio.
- `src/views/explore-reference-v4.css` — Explora, crear plan y detalle.
- `src/views/chat-profile-reference-v4.css` — Chat y Perfil.
- `src/views/settings-premium-reference-v4.css` — Ajustes y CONECTA+ / Premium.
- `src/components/AppChrome.tsx` — navegación inferior oficial.

## Imágenes locales activas

Directorio único: `public/media/cards/`

- `social-city.webp` — hero social, café, gastronomía, fiesta, música y nuevos en la ciudad.
- `active-coast.webp` — actividad/deporte y portada de perfil por defecto.
- `creative-community.webp` — cultura, juegos, idiomas, estudiantes y lectura.
- `safe-planning.webp` — viajes, networking y familias.

Las cuatro imágenes están referenciadas desde `src/catalog.ts`; no se elimina ninguna en esta fase.

## Caché PWA

Premium V4 usa la generación V7:

- `conecta-v7-shell`
- `conecta-v7-assets`
- `conecta-v7-images`

Al activar el nuevo Service Worker se eliminan automáticamente cachés `conecta-*` que no pertenezcan a la generación actual. No se borra caché en cada arranque.

## Orden de validación antes de integrar en main

1. Lint.
2. TypeScript (`tsc --noEmit`).
3. Unit tests.
4. Build Vite.
5. Smoke test.
6. Performance contracts.
7. Security contracts.
8. E2E Chromium.
9. E2E iPhone/WebKit.
10. Accesibilidad.
11. Comparación visual de Inicio, Explora, Crear, Detalle, Chat, Perfil, Ajustes y Premium.
12. Solo después, integración en `main`.

## Regla de limpieza

No se borra un recurso por nombre o antigüedad. Primero se demuestra que no tiene referencias activas. Si una capa V4 sustituye por completo una regla o recurso antiguo, se elimina en un commit independiente para que el cambio sea reversible y auditable.
