# Android release

## 1. Crear keystore real

Crear el keystore fuera del repo:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.eventify\android" | Out-Null
keytool -genkeypair `
  -v `
  -storetype PKCS12 `
  -keystore "$env:USERPROFILE\.eventify\android\eventify-release.jks" `
  -alias eventify `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

No guardar el `.jks` ni passwords en Git. Hacer backup seguro del keystore: si se pierde, no se pueden actualizar releases firmadas con esa key.

## 2. Configurar variables locales

Copiar `.env.example` a `.env` y completar:

```properties
GOOGLE_MAPS_API_KEY=
EVENTIFY_RELEASE_STORE_FILE=C:/Users/JuanCruz/.eventify/android/eventify-release.jks
EVENTIFY_RELEASE_STORE_PASSWORD=
EVENTIFY_RELEASE_KEY_ALIAS=eventify
EVENTIFY_RELEASE_KEY_PASSWORD=
```

`EVENTIFY_RELEASE_STORE_FILE` puede ser absoluto o relativo a `android/app`.

## 3. Obtener SHA release

Con las variables anteriores cargadas:

```powershell
npm run android:signing-report
```

Registrar en Google Cloud el cliente Android:

- Package name: `com.eventify.mobile`
- SHA-1: el valor de `Variant: release`
- SHA-256: el valor de `Variant: release`

Para Google Sign-In, mantener `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` con el OAuth Client ID tipo Web. Para Maps, restringir `GOOGLE_MAPS_API_KEY` a Android apps con `com.eventify.mobile` y el SHA release, habilitando solo Maps SDK for Android.

## 4. Build release

APK para instalar en dispositivo:

```powershell
npm run android:release:apk
```

Salida esperada:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Bundle para Play Console:

```powershell
npm run android:release:aab
```

Salida esperada:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## 5. Smoke test en dispositivo fisico

- Instalar `app-release.apk` en un Android real.
- Confirmar que Google Sign-In no devuelve `DEVELOPER_ERROR`.
- Abrir Explorar y confirmar que el mapa carga con la key restringida.
- Aceptar y rechazar permiso de ubicacion; la app debe seguir usable en ambos casos.
- Probar deep link custom scheme: `eventify://`.
- Verificar que el backend usado por `EXPO_PUBLIC_API_BASE_URL` sea accesible desde el dispositivo.

## Permisos y deep links

- Permisos Android esperados: `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`.
- Permisos bloqueados para release: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`.
- Deep link actual: custom scheme `eventify://`.
- App Links HTTPS quedan pendientes hasta definir dominio final y servir `/.well-known/assetlinks.json`.

## Estado actual

- Release signing ya no cae al debug keystore.
- El build release falla temprano si faltan `EVENTIFY_RELEASE_STORE_FILE`, `EVENTIFY_RELEASE_STORE_PASSWORD`, `EVENTIFY_RELEASE_KEY_ALIAS` o `EVENTIFY_RELEASE_KEY_PASSWORD`.
- `android/app/debug.keystore` existe solo para debug.
- `*.jks`, `.env` y `.env.*` estan ignorados por Git.
