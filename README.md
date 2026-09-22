# Eventify Mobile

App mobile inicial para Eventify con Expo, React Native y TypeScript.

## Ejecutar

```powershell
npm install
npm start
```

## Release Android

El flujo de release esta documentado en `ANDROID_RELEASE.md`.

Comandos utiles:

```powershell
npm run android:signing-report
npm run android:release:apk
npm run android:release:aab
```

Para apuntar al backend local:

```powershell
Copy-Item .env.example .env
```

Luego ajustar `EXPO_PUBLIC_API_BASE_URL` segun donde corra la app:

- Web en la misma PC: `http://localhost:8080/api/v1`
- Android Emulator: `http://10.0.2.2:8080/api/v1`
- Expo Go en celular fisico: `http://192.168.100.8:8080/api/v1` reemplazando por la IP Wi-Fi de tu PC

## Base incluida

- Flujo inicial de auth: bienvenida, registro, login y setup de perfil.
- Persistencia local de sesion con AsyncStorage.
- Navegacion mobile primaria: Inicio, Explorar, Crear, Social, Perfil.
- UI inicial alineada con planes/eventos, grupos, chat, asistencia y reputacion.
- Cliente API base en `src/api/client.ts`.
- Configuracion de API por `EXPO_PUBLIC_API_BASE_URL`.

## Estructura

- `src/screens`: pantallas editables paso a paso.
- `src/components`: componentes reutilizables de UI.
- `src/navigation`: navegacion principal por tabs.
- `src/data`: datos mock para probar la app sin backend conectado.
- `src/api`: cliente HTTP para integrar con `eventify-api`.
- `src/theme`: colores y constantes visuales.
- `src/types`: tipos compartidos.

## Backend usado ahora

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `PATCH /api/v1/me/profile`
- `GET /api/v1/experiences`

La sesion se guarda localmente para poder recargar Expo sin volver al login. Es temporal de MVP y usa Basic Auth hasta cambiar backend a token/session real.
