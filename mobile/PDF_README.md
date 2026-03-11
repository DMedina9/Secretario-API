Instalación y configuración de PDF nativo (react-native-pdf)

Resumen

Este proyecto usa Expo (SDK ~55). `react-native-pdf` incluye código nativo, por lo que en un flujo Managed Expo necesitas usar `expo prebuild` y compilar con `eas build` o eject/Prebuild.

Dependencias añadidas

- react-native-pdf
- react-native-blob-util

Pasos recomendados

1. Desde la carpeta `mobile` instala dependencias:

```bash
# usando npm
npm install react-native-pdf react-native-blob-util
# o con yarn
# yarn add react-native-pdf react-native-blob-util
```

2. Si estás en flujo Managed Expo (Expo Go), necesitas generar la carpeta nativa con `expo prebuild` y luego usar `eas build` o `expo run:android`/`expo run:ios`:

```bash
# Generar proyecto nativo (prebuild)
expo prebuild

# Para probar en Android localmente (requiere Android SDK):
expo run:android

# Para iOS: (requiere macOS + Xcode)
expo run:ios

# O construir con EAS (recomendado para CI / realease):
eas build --platform android
```

3. iOS: después de `prebuild`, abre `ios/` y corre `pod install` si es necesario.

4. Android: `react-native-blob-util` y `react-native-pdf` pueden requerir permisos de lectura/almacenamiento. Asegúrate de declarar permisos en `AndroidManifest.xml` si es necesario.

Notas

- Si no quieres usar `prebuild`/EAS, puedes seguir usando la vista WebView que ya está implementada como fallback en `PDFViewerScreen.js`.
- Si usas `eas build`, asegúrate de tener `eas-cli` configurado y las credenciales necesarias.

Comandos rápidos para probar (desde `mobile`):

```bash
# instalar
npm install

# iniciar metro
expo start

# Si usas prebuild y quieres correr en emulador
expo prebuild
expo run:android
```
