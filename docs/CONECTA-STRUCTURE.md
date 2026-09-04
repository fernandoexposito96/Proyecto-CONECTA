# CONECTA 1.0 — estructura canónica

Este documento define cómo está organizado **Proyecto-CONECTA** y qué reglas deben respetarse para evitar mezclar versiones, duplicar estilos o romper móvil/tablet/escritorio.

## 1. Fuente de verdad

- Rama de trabajo y despliegue: `main`.
- Aplicación principal: React + TypeScript + Vite.
- Punto de entrada JS/TS: `src/main.tsx`.
- Punto de entrada visual: **solo** `src/ui.css`.
- PWA: `public/manifest.json` + `public/sw.js`.
- Backend/autenticación/datos: Supabase desde `src/supabase.ts` y módulos relacionados.
- No reintroducir referencias a Index1996, raw.githack ni versiones antiguas.

## 2. Arranque de la aplicación

El arranque visible tiene dos niveles coordinados:

1. `index.html` muestra inmediatamente el splash nativo HTML para evitar flashes sin CSS.
2. `src/main.tsx` retira el splash en el siguiente frame, cuando React ya puede pintar.
3. Si Supabase todavía no ha terminado, `LoadingScreen` mantiene el mismo lenguaje visual: negro + CONECTA blanco, sin spinner.

No añadir círculos, loaders giratorios, barras ni elementos extra al arranque.

## 3. CSS: regla de entrada única

`src/main.tsx` solo puede importar directamente:

```ts
import "./ui.css";
```

No añadir otro `.css` directamente en `main.tsx`.

Todos los `@import` de `src/ui.css` deben estar al principio del archivo, antes de cualquier regla CSS. La última capa importada debe ser:

```css
@import "./universal-responsive.css";
```

Esta capa es la protección final contra recortes y anchos antiguos.

## 4. Orden visual actual

Dentro de `ui.css`, el orden lógico es:

1. Base Premium (`conecta-premium.css`).
2. Ajustes visuales y móvil.
3. Accesibilidad.
4. Compatibilidad de estilos históricos todavía necesarios.
5. Estructura y vistas principales.
6. Menús, diálogos y confirmaciones.
7. `universal-responsive.css` como última capa importada.
8. Reglas locales de fallback de arranque.

Los CSS históricos se mantienen mientras sigan siendo necesarios para conservar el diseño Premium. No añadir nuevos hotfixes salvo que no exista una capa canónica donde resolver el problema.

## 5. Responsive universal

`src/universal-responsive.css` debe garantizar:

- Sin scroll horizontal global accidental.
- Imágenes, iframes, vídeos y canvas contenidos dentro del viewport.
- Grids fluidos en tarjetas y secciones.
- Escritorio grande: sidebar completa.
- Portátil/escritorio estrecho: sidebar compacta.
- Hasta 900 px: navegación adaptada tipo móvil/tablet y paneles apilados.
- Hasta 600 px: una columna y controles compactos.
- Hasta 390 px: protección adicional para teléfonos estrechos.
- PWA standalone: respeto de `safe-area-inset-*` y `100dvh`.

Las vistas que deben comprobarse especialmente son Inicio, Explorar, Mapa, Chat, Calendario, Perfil, Seguridad, Conecta+, formularios y todos los diálogos/sheets.

## 6. Navegación y pantallas

- `src/components/AppChrome.tsx`: sidebar, topbar y navegación móvil.
- `src/App.tsx`: coordinación de sesión, datos, navegación y acciones principales.
- `src/views/`: pantallas y módulos principales.
- `src/components/`: piezas reutilizables.

Conecta+ usa divulgación progresiva: mostrar primero opciones compactas y abrir contenido detallado solo cuando el usuario pulse `Ver más`.

## 7. Seguridad y autenticación

- Supabase gestiona sesión y datos.
- Registro/login y flujo de verificación están en `src/views/AuthFlowViews.tsx` y módulos de auth.
- Seguridad, bloqueo, reportes y eliminación de cuenta deben permanecer conectados.
- No exponer secretos ni claves privadas en frontend.

## 8. Validación antes de publicar

El contrato de cierre es:

```bash
pnpm validate
```

Incluye lint, TypeScript, unitarios, build, smoke, rendimiento, seguridad y E2E en Chromium y WebKit/iPhone.

Los smoke tests protegen al menos:

- build generado;
- mount `#app`;
- PWA instalable;
- service worker canónico;
- un único CSS de entrada;
- orden válido de imports CSS y responsive final;
- splash negro CONECTA retirado al primer frame de React;
- vistas críticas;
- autenticación y seguridad;
- ausencia de referencias legacy.

GitHub Actions debe validar y desplegar `main`. Un commit no se considera cerrado hasta que las validaciones y el deploy de la versión actual estén completados correctamente.

## 9. Regla para cambios futuros

Antes de crear un archivo nuevo, comprobar si el cambio pertenece a una capa existente. Preferir editar la fuente canónica antes que crear otro hotfix.

No tocar una versión antigua para corregir la actual. No restaurar ramas o assets legacy para solucionar un problema de `main`.

Objetivo permanente: **una sola aplicación, una sola rama principal, una sola entrada CSS y comportamiento consistente en móvil, tablet, ordenador y PWA**.
