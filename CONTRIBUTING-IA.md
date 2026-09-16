# Regla obligatoria antes de subir cambios a `main`

Este repo tiene una comprobación completa (`npm run check`) que incluye estructura, estilo, tipos y varios tests. El despliegue a la app publicada (GitHub Pages) SOLO debe darse por válido si esa comprobación pasa entera, además del build y los tests de navegador (`npm run test:e2e`).

## Regla

Antes de hacer commit y subir (`git push`) cualquier cambio a la rama `main`, hay que ejecutar y confirmar, en este orden:

```bash
npm ci
npm run check
npm run build
npm run test:e2e
```

Si `npm run check` falla porque un test de `scripts/test-frontend.mjs` (u otro script de `scripts/`) ya no coincide con el código nuevo, el test se corrige en el mismo cambio que el código que lo rompió. No se debe subir primero el cambio a `main` para descubrir después el fallo mediante GitHub Actions.

## Tests frágiles

No modificar código funcional únicamente para satisfacer una expresión regular o una coincidencia textual obsoleta. Cuando una comprobación basada en `assert.match(...)` deje de representar la implementación canónica actual, revisar primero el comportamiento protegido y actualizar la comprobación sin eliminar la protección contra regresiones.

A medida que se trabaje en esas áreas, sustituir las comprobaciones de texto exacto por pruebas de comportamiento o de contrato cuando sea viable.

## Historial

No reescribir el historial de `main` mediante rebase, squash o force-push para ocultar fallos anteriores. Las correcciones nuevas deben ser commits normales y trazables.

## Criterio de cierre

No afirmar que una modificación está terminada, desplegada o aprobada al 100 % hasta que el HEAD correspondiente haya superado instalación, `npm run check`, `npm run build` y `npm run test:e2e` sin errores.
