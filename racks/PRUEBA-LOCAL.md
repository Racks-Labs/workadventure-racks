# Prueba local completa en Mac (Apple Silicon)

Esta guía sirve para levantar WorkAdventure en un Mac con chip M, comprobar que funciona y probar las integraciones con Racks.

Ya comprobado:

- **Todas las imágenes del entorno de desarrollo tienen versión `arm64`**, así que en Apple Silicon corren nativas, sin emulación. Esto incluye:
  - Traefik
  - la imagen Node de TheCodingMachine
  - LiveKit y Egress
  - Synapse
  - RustFS
  - iconserver
  - oidc-server-mock
  - Logto
  - Postgres
  - RedisInsight

---

## 0. Requisitos

**Docker Desktop**

- Ve a **Settings → Resources** y asigna **al menos 8 GB de RAM** (mejor 12–16 GB) y 4 o más CPUs.
  - El front (Vite) y los `npm install` iniciales son lo que más consume.
- En **Settings → General** activa **VirtioFS** como sistema de ficheros, que es el valor por defecto en las versiones recientes.

**Navegador**

- Usa **Chrome** para las pruebas: resuelve `*.localhost` solo y deja usar cámara y micrófono sin HTTPS en `*.localhost`.
- Para simular un segundo alumno, abre otra ventana en modo incógnito o un segundo perfil de Chrome.

**`/etc/hosts`**

Para Safari, curl y otras herramientas, añade esta línea (es la del README más los dominios de Logto y LiveKit):

```
127.0.0.1 oidc.workadventure.localhost redis.workadventure.localhost play.workadventure.localhost traefik.workadventure.localhost matrix.workadventure.localhost extra.workadventure.localhost icon.workadventure.localhost map-storage.workadventure.localhost uploader.workadventure.localhost maps.workadventure.localhost api.workadventure.localhost front.workadventure.localhost room-api.workadventure.localhost livekit.workadventure.localhost logto.workadventure.localhost logto-admin.workadventure.localhost
```

**El puerto 80 tiene que estar libre**, porque Traefik escucha ahí.

> ⚠️ **No ejecutes `npm install` en el Mac dentro del repo.**
> - Los contenedores montan el repo y hacen ellos el `npm install` (para Linux arm64).
> - Si lo haces en macOS, se mezclan binarios de macOS en `node_modules` y los contenedores fallan.
> - Si ya lo hiciste, borra todos los `node_modules` antes de arrancar.

---

## 1. Arranque básico: login de pruebas, sin vídeo de grupo

```bash
git clone https://github.com/Racks-Labs/workadventure-racks.git
cd workadventure-racks
git checkout docs/plan-incorporacion-racks-university
cp .env.template .env
docker compose up
```

- **El primer arranque tarda bastante** (10–20 min, según la conexión), porque instala dependencias y compila protobuf.
  - Sabrás que está listo cuando en los logs de `play` aparezca el servidor de Vite escuchando y los de `back` dejen de reiniciar.
- **Entra en** http://play.workadventure.localhost con el usuario **User1** y la contraseña **pwd**. Es el proveedor OIDC de pruebas, y User1 tiene el tag `admin`.
- **Dashboard de Traefik:** http://traefik.workadventure.localhost. Ahí ves todas las rutas.

## 2. Añadir LiveKit (vídeo de más de 4 personas y grabación)

> **Trampa del `.env.template`:** `LIVEKIT_HOST`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET` aparecen **dos veces**: hacia la línea 13 con valores y hacia la línea 240 **vacíos**. Gana la última, así que **LiveKit queda desactivado sin avisar**. Borra o comenta las líneas vacías.

Así deben quedar las tres variables:

```
LIVEKIT_HOST=http://livekit.workadventure.localhost
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=12345678901234567890123456789012
```

Después arranca con el compose de LiveKit:

```bash
docker compose -f docker-compose.yaml -f docker-compose.livekit.yaml up
```

- Este compose también trae **Egress**, que graba, y **RustFS**, un S3 local.
- Egress corre en modo `privileged`. Si da problemas en Docker Desktop, la grabación es lo único que se pierde.
- Para forzar LiveKit con pocas personas, pon `MAX_USERS_FOR_WEBRTC=1` en `.env`.

## 3. Checklist "funciona todo"

Abre 2 o 3 ventanas de Chrome: normal, incógnito y otro perfil. Entra con User1 y con **User2 / pwd**, que tiene el tag `member`.

| # | Prueba | Cómo | Esperado |
|---|---|---|---|
| 1 | Login SSO | Entrar con User1 | Vuelves al mapa con tu nombre |
| 2 | Avatar | Elegir y personalizar un Woka | Se guarda y lo ven los demás |
| 3 | Movimiento y presencia | Mover los dos avatares | Cada uno ve al otro en tiempo real |
| 4 | Burbuja P2P | Acercar 2 avatares | Se abre audio y vídeo entre los dos |
| 5 | LiveKit | 3 o más ventanas juntas (o `MAX_USERS_FOR_WEBRTC=1`) | El vídeo sigue y en los logs de `livekit` aparece la room |
| 6 | Compartir pantalla | Botón de pantalla en una burbuja | El otro la ve |
| 7 | Chat | Chat de burbuja y chat de Matrix (paso 1) | Los mensajes llegan |
| 8 | Editor de mapas | User1 abre el editor en un mapa `/~/…wam` | Puede colocar objetos y áreas. User2 no (tag `member`) |
| 9 | Áreas | Crear un área de reunión, otra restringida (tag `admin`) y otra con "abrir web" | Se comportan como se configuraron |
| 10 | Megáfono | Configurar el megáfono en "Configurar sala" | User1 habla a toda la sala |
| 11 | Grabación (con Egress) | Grabar desde una reunión | Aparece el `.mp4` en RustFS |
| 12 | Moderación | User1 silencia o expulsa a User2 | Funciona; User2 no puede hacérselo a User1 |
| 13 | Idioma | Ajustes → idioma Español | La interfaz sale en español |
| 14 | Map storage | http://map-storage.workadventure.localhost (usuario `john.doe`, contraseña `password`) | Lista los mapas subidos |

---

## 4. Integraciones para cacharrear

Ordenadas de menos a más esfuerzo.

### 4.1 SSO con Logto local (el mismo producto que `auth.racks.academy`)

1. **Arranca** con el override de Racks (sin Synapse, porque Synapse está configurado contra el OIDC de pruebas):

   ```bash
   docker compose -f docker-compose.yaml -f docker-compose.livekit.yaml \
     -f docker-compose.no-synapse.yaml -f racks/docker-compose.racks-logto.yaml up
   ```

   El primer arranque fallará al hacer login: aún no existe la app en Logto. Es normal.

2. **Abre la consola** en http://logto-admin.workadventure.localhost y crea la cuenta de administrador.

3. **Crea la aplicación.** Ve a **Applications → Create → Traditional web** y ponle de nombre "WorkAdventure Campus":
   - Redirect URI: `http://play.workadventure.localhost/openid-callback`
   - Post sign-out redirect URI: `http://play.workadventure.localhost/`

4. **Copia las credenciales** (App ID y App secret) en `.env`:

   ```
   RACKS_LOGTO_CLIENT_ID=...
   RACKS_LOGTO_CLIENT_SECRET=...
   ```

5. **Crea los roles y los usuarios:**
   - En **Roles**, crea dos roles de usuario **en minúsculas**: `admin` y `editor`. Así comprobamos si los tags llegan desde Logto.
   - Crea un usuario de prueba y asígnale `admin`.

6. **Reinicia `play`** con `docker compose ... up -d play` y entra en http://play.workadventure.localhost.

7. **Qué estamos validando:**
   - El flujo de login con Logto completo.
   - **Si el claim `roles` llega por userinfo.** Si llega, ese usuario podrá abrir el editor de mapas y moderar. Esto es lo único que no se pudo comprobar en el análisis.
   - Si no llega, los permisos se resolverán con la Admin API (paso 4.5).

> Este override **no se ha probado en vivo** (el análisis se hizo sin Docker). Si algo falla, lo primero que hay que mirar es si el issuer coincide: `docker compose logs play | grep -i openid`.

### 4.2 Crear el mapa del campus

- **Editor integrado:** entra en un mapa de map-storage (`/~/…`) y usa el editor para crear salas, áreas y mobiliario.
- **Tiled:** para un diseño a medida, usa el [map-starter-kit](https://github.com/workadventure/map-starter-kit). Se sube a map-storage con el token `123` de desarrollo (`AUTHENTICATION_TOKEN` en el compose).
- **Mapas de ejemplo:** en `maps/starter/` y `maps/tests/` hay muchos (variables, scripts, zonas…). Se sirven en `http://maps.workadventure.localhost/...`.

### 4.3 Avatares propios

1. Crea un PNG de **96×128** (3 fotogramas × 4 direcciones de 32×32). Puedes partir de uno de `play/public/resources/characters/pipoya/`.
2. Ponlo en `play/public/resources/characters/racks/` y añádelo a `play/src/pusher/data/woka.json`. Al Woka completo, en la colección `woka`; por capas, en `body`, `hair`, `clothes`…
3. Reinicia `play`. Aparecerá en la pantalla de elegir avatar.

### 4.4 Scripts de mapa (Scripting API)

- **Ejemplos:** `maps/tests/` está lleno de ejemplos de `WA.*` (`WA.ui.openPopup`, `WA.state`, `WA.room.onEnterLayer`…).
- **Primer experimento:** un cartel con un enlace a `learn.racks.university` al pisar una zona, o una puerta que solo se abre si `WA.player.tags` incluye `admin`.
- **Documentación:** `docs/developer/map-scripting/`.

### 4.5 Room API: Racks manda órdenes al campus

1. **Activa la Room API:** en `.env` pon `ROOM_API_SECRET_KEY=racks-dev-key` y reinicia `play`.

2. **Prueba desde un script de Node** en una carpeta **fuera del repo**:

   ```bash
   mkdir ~/wa-room-api-test && cd ~/wa-room-api-test
   npm init -y && npm i @workadventure/room-api-client
   ```

   ```js
   // test.mjs
   import { createRoomApiClient } from "@workadventure/room-api-client";
   const client = createRoomApiClient("racks-dev-key", "room-api.workadventure.localhost", 80);
   const room = "http://play.workadventure.localhost/_/room-api/maps.workadventure.localhost/tests/Variables/shared_variables.json";
   await client.saveVariable({ name: "textField", room, value: "Hola desde Racks" });
   console.log("ok");
   ```

3. **Comprueba el resultado:** abre esa sala en el navegador y verás cómo cambia el valor.
   - Es exactamente el mecanismo de la fase 3: un webhook `MODULE_COMPLETED` de Racks llega a un receptor, que llama a `saveVariable` y abre la puerta.
   - El test de referencia está en `tests/tests/room-api.spec.ts`.

### 4.6 Admin API: el control de acceso por plan (fase 2)

- **Montar un servidor de prueba.** Con un servidor mínimo (Express o Next) que implemente `GET /api/capabilities`, `/api/map` y `/api/room/access` ya puedes decidir quién entra y con qué tags.
  - Pon `ADMIN_API_URL=http://host.docker.internal:4000` y `ADMIN_API_TOKEN=...` en `.env`.
  - La especificación ya está publicada en desarrollo: http://play.workadventure.localhost/swagger-ui/ (`ENABLE_OPENAPI_ENDPOINT` viene activado en el compose).
- **Ojo con la autenticación:** WorkAdventure manda `Authorization: <token>` sin `Bearer`.
- **Ojo con las URLs:** con la Admin API activa, cambian las URL de sala válidas (ver `PLAN-INCORPORACION.md` §3).
- **Siguiente paso real:** esto vive en una rama de `academy-routes` creada desde `develop`, nunca en `main`.

### 4.7 Embeber el campus en una página (como haría learn.racks.university)

Crea un HTML local con este iframe:

```html
<iframe src="http://play.workadventure.localhost/" allow="camera; microphone; display-capture; fullscreen; autoplay" style="width:100%;height:90vh;border:0"></iframe>
```

- Sirve para comprobar el comportamiento dentro de un iframe.
- **Con login, el primer acceso tiene que ser a pantalla completa**, porque Logto no se deja embeber en un iframe.

---

## 5. Problemas típicos

| Síntoma | Causa probable |
|---|---|
| `play` reinicia en bucle tras el primer `up` | `npm install` sigue en curso o falló. Mira `docker compose logs -f play` y, si mezclaste node_modules del Mac, bórralos |
| Pantalla en negro o "connection error" | `back` no está listo. Espera o mira `docker compose logs back` |
| Sin vídeo con 3 o más personas | LiveKit vacío en `.env` (la trampa de las variables duplicadas del paso 2) |
| Login en bucle con Logto | El issuer no coincide o falta la redirect URI exacta en Logto |
| `logto.workadventure.localhost` no abre | Falta en `/etc/hosts` (si no usas Chrome) o Traefik no ve el contenedor |
| Puerto 80 ocupado | Otro servidor local (AirPlay Receiver no usa el 80, pero Apache u otro Docker sí) |

**Parar y limpiar:**

- `docker compose down` para el entorno.
- `docker compose down -v` además **borra los volúmenes**: mapas, Logto y Redis.
