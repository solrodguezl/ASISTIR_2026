# DATAFRO · App (ASISTIR_2026)

App en **Expo / React Native** (SDK 57, expo-router) para registrar asistencia a
actividades y diligenciar la caracterización NARP. Funciona en Android, iOS y
web, y se conecta al backend
[BACKEND_DATAFRO](https://github.com/solrodguezl/BACKEND_DATAFRO).

## Ejecutar en local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env` (puedes copiar `.env.example`) con la URL del backend.
   Para probar desde el teléfono, usa la IP de tu PC en la red, no `localhost`:

   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.150:3000/api
   ```

3. Levanta el backend (`npm run dev` en BACKEND_DATAFRO) y luego la app:

   ```bash
   npx expo start          # Expo Go en el teléfono (mismo Wi-Fi)
   npx expo start --web    # en el navegador, http://localhost:8081
   ```

## Modo offline

La app se puede usar **sin internet**. Lo que se guarda sin conexión queda en el
teléfono y se envía solo al backend cuando vuelve la red.

### Qué funciona sin conexión

| Acción | Sin conexión |
|---|---|
| Ver actividades, catálogos y el formulario de caracterización | ✅ Con la última copia descargada |
| Registrar asistencia | ✅ Queda en cola |
| Crear actividad (COORDINADOR o superior) | ✅ Queda en cola, y se le pueden registrar asistentes de una vez |
| Guardar capítulos de caracterización y retomarlos después | ✅ Queda en cola |
| Autocompletar por documento | ⚠️ Solo personas que este teléfono ya consultó o registró |
| "Ya hay alguien de mi hogar registrado" | ⚠️ No se verifica; el hogar se vincula al sincronizar |

> Para que una pantalla funcione sin conexión, hay que abrirla **al menos una vez
> con internet** (así se descargan sus datos).

### Cómo funciona

1. **Al guardar:** si hay conexión y no hay nada pendiente, se envía directo al
   backend, como siempre. Si no hay conexión, o el envío falla por red, la
   operación se guarda en una **cola local** y la pantalla dice *"guardado en el
   teléfono, se enviará cuando haya conexión"*.
2. **Al volver la conexión:** un monitor envía la cola **en el mismo orden** en
   que se guardó (por ejemplo, la actividad antes que sus asistencias). Se
   dispara:
   - cuando el teléfono recupera la red;
   - cuando la app vuelve a primer plano;
   - cada minuto, si queda algo pendiente;
   - en segundo plano (Android/iOS), cuando el sistema lo permita (mínimo cada
     15 minutos).
3. **Sin duplicados:** cada operación tiene un id único que viaja como header
   `Idempotency-Key`. Si se reenvía, el backend no la repite.
4. **Aviso en pantalla:** arriba aparece una barra cuando no hay conexión, hay
   registros pendientes o alguno fue rechazado. Incluye **Enviar ahora** y, para
   los rechazados, **Reintentar** o **Descartar** (este último pide confirmación).

### Casos especiales

- **Sesión vencida:** la cola no se borra. La barra pide volver a iniciar sesión
  y, al entrar, se envía.
- **Varios usuarios en el mismo teléfono:** cada registro lo envía solo el
  usuario que lo creó, con su propia organización.
- **Rechazo del servidor** (por ejemplo, falta de permiso o datos inválidos): ese
  registro queda marcado con error y los demás siguen enviándose.

### Dónde está el código

| Archivo | Para qué sirve |
|---|---|
| [`src/offline/outbox.ts`](src/offline/outbox.ts) | Cola de operaciones pendientes |
| [`src/offline/sync.ts`](src/offline/sync.ts) | Envía la cola al backend y lleva el estado (pendientes, errores) |
| [`src/offline/monitor.ts`](src/offline/monitor.ts) | Vigila la conexión y dispara la sincronización |
| [`src/offline/backgroundSync.ts`](src/offline/backgroundSync.ts) | Tarea en segundo plano (Android/iOS) |
| [`src/offline/escritura.ts`](src/offline/escritura.ts) | Decide si enviar directo o guardar en cola |
| [`src/offline/cache.ts`](src/offline/cache.ts) | Copia local de lo descargado, para leer sin conexión |
| [`src/components/ui/EstadoSync.tsx`](src/components/ui/EstadoSync.tsx) | Barra de estado de la sincronización |

Los datos locales se guardan con **AsyncStorage**, que funciona igual en
Android, iOS y web. No se usó SQLite porque en web todavía está en fase alpha y
exige configurar cabeceras especiales en el hosting. Los tokens siguen en
`expo-secure-store`.

### Cómo probarlo

- **Web:** abre DevTools → *Network* → cambia a **Offline**, registra algo y
  vuelve a *No throttling*. La cola se ve en *Application → Local Storage →
  `datafro:outbox`*.
- **Teléfono:** activa el modo avión, registra y desactívalo. Con Expo Go no
  recargues la app mientras estés sin red.
- **Servidor caído:** detén el backend, registra y vuelve a levantarlo. La cola
  se envía en menos de un minuto o al pulsar *Enviar ahora*.
- **Tarea en segundo plano:** requiere un development build
  (`npx expo run:android`), porque Expo Go no la ejecuta.

> Requiere que el backend tenga la migración `sync_offline.sql` y esté
> desplegado con la versión que acepta `Idempotency-Key`.
