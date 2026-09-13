# CONECTA — preparación para tiendas

Esta carpeta contiene la configuración de empaquetado sin modificar `src/`, el demo ni la navegación web.

## Android / TWA

- Package ID: `com.conecta.app`
- Host: `fernandoexposito96.github.io`
- Scope: `https://fernandoexposito96.github.io/Proyecto-CONECTA/`
- Configuración Bubblewrap: `store/android/twa-manifest.json`
- Digital Asset Links: `store/android/assetlinks.template.json`

Antes de publicar Android hay que firmar el AAB/APK y sustituir `REPLACE_WITH_REAL_SHA256_SIGNING_FINGERPRINT` por la huella SHA-256 real. El archivo final debe publicarse en la raíz del host como `/.well-known/assetlinks.json`; no debe subirse un valor ficticio.

## iOS / Capacitor

La plantilla está en `store/ios/capacitor.config.template.ts` con `appId: com.conecta.app`, `webDir: dist` y nombre `CONECTA`.

Para generar el proyecto nativo hacen falta las dependencias de Capacitor y un Mac con Xcode. La firma y publicación requieren una cuenta Apple Developer y certificados válidos.

## Reglas de seguridad

Nunca guardar keystores, contraseñas de firma, certificados privados, claves VAPID privadas ni credenciales de App Store/Google Play en GitHub. Usar secretos del proveedor de CI o del panel correspondiente.
