# Contribuir a CONECTA

## Validación antes de integrar cambios

Antes de integrar cambios en `main`, hay que comprobar que instalación, validaciones, build y pruebas de navegador terminan correctamente:

```bash
npm ci
npm run check
npm run build
npm run test:e2e
```

`npm run check` cubre estructura, estilo, mantenibilidad, seguridad en runtime, pruebas de React y lógica, Edge, PWA, sincronización, chat y TypeScript.

## Criterios de mantenimiento

- Mantener cada cambio acotado y con una responsabilidad clara.
- Evitar duplicar lógica que ya tenga una implementación compartida.
- Priorizar nombres que describan el dominio y el comportamiento.
- No modificar código funcional solo para satisfacer una comprobación textual obsoleta.
- Cuando una prueba deje de representar el comportamiento actual, actualizarla junto con el cambio sin perder la protección contra regresiones.
- Preferir pruebas de comportamiento o contrato frente a comprobaciones frágiles de texto exacto.
- No mezclar una refactorización amplia con cambios funcionales sin relación.

## Rama principal

`main` debe mantenerse desplegable. Las correcciones se incorporan como cambios trazables; no se reescribe el historial para ocultar errores anteriores.

## Criterio de cierre

Un cambio se considera terminado cuando el commit correspondiente supera instalación, `npm run check`, `npm run build` y `npm run test:e2e`, además de cualquier validación manual necesaria para la funcionalidad modificada.
