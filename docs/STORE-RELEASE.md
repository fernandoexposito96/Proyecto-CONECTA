# CONECTA — preparación para tiendas

Esta fase mantiene intactos `src/`, el demo y la navegación. La publicación final requiere cuentas externas y firma de paquetes.

## Android — TWA

Ruta recomendada: Trusted Web Activity con Bubblewrap/PWABuilder usando la PWA desplegada.

Requisitos externos pendientes de publicación:
- Cuenta Google Play Console.
- Nombre definitivo del paquete Android.
- Certificado de firma y huella SHA-256.
- `assetlinks.json` rellenado con paquete + SHA-256 y publicado en `/.well-known/assetlinks.json` del dominio definitivo.

Plantilla incluida en `store/android/assetlinks.template.json`.

## iOS — Capacitor

Ruta recomendada: Capacitor sobre el build de Vite. No requiere reescribir las vistas React.

Requisitos externos pendientes de publicación:
- Mac con Xcode.
- Cuenta Apple Developer activa.
- Bundle ID definitivo.
- Certificados/provisioning de Apple.
- Alta de la app en App Store Connect y revisión de Apple.

## Antes de enviar

- CI y E2E en verde.
- Manifest instalable con iconos PNG y maskable.
- Screenshots móvil y escritorio actualizados.
- Política de privacidad y condiciones públicas.
- Eliminación de cuenta accesible si aplica.
- Pruebas reales en Android/iPhone.

## Estado técnico

Los iconos PNG y las capturas instalables se generan automáticamente desde la app real y quedan versionados en `public/` antes del despliegue final.
