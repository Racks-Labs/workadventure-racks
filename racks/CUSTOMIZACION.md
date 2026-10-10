# Qué se puede personalizar del campus, y dónde

Este es el **catálogo completo**. Cada fila dice qué cambia, **dónde** se cambia y si ya está preparado.

## Dónde vive cada ajuste

| Dónde | Qué controla | Quién lo toca |
|---|---|---|
| **`.env` del campus** | Infraestructura, límites técnicos, herramientas, idioma | Quien opera el servidor |
| **Admin API** (puente en la academia, `/api/map` y `/api/room/access`) | **Quién entra**, tags, marca, opciones de experiencia **por mundo** | Código de `academy-routes` |
| **El mapa** (Tiled + editor integrado) | Salas, áreas, permisos por tag, mobiliario, script | Diseño de contenido |
| **Código de WorkAdventure** (fork) | Todo lo demás (UI) | Último recurso: hay que mantenerlo en cada actualización |

**Regla importante:** en cuanto se activa la Admin API (`ADMIN_API_URL`), los ajustes de experiencia **por mundo** dejan de leerse del `.env` y salen de `/api/map` de la academia. En este grupo están el chat, la burbuja "decir", la página de cámara, los logos, los colores y los metatags. Por eso en `env.racks.example` van marcados como **[sin Admin API]**.

---

## 1. Identidad y acceso

| Ajuste | Dónde | Estado |
|---|---|---|
| Login con la cuenta de Racks (Logto) | `.env`: `OPENID_*` | ✅ Preparado (`env.racks.example`) |
| Entrar con un clic si ya hay sesión en learn | Override: `OPENID_PROMPT=` | ✅ Hecho |
| Sin anónimos | `DISABLE_ANONYMOUS=true` + `authenticationMandatory` en `/api/map` | ✅ |
| Quién entra (por plan) | Admin API, capacidad `campus-virtual` | ✅ Puente hecho (rama `feat/campus-workadventure-sso`) |
| Roles dentro (`admin`/`editor`/`mentor`/`plan-…`/`edicion-…`) | Admin API, tags | ✅ |
| Nombre visible | `OPENID_WOKA_NAME_POLICY=allow_override_opid` (sale el nombre de Racks y se puede cambiar) | ✅. `force_opid` lo bloquea |
| Botón "Perfil" → perfil de Racks | `OPENID_PROFILE_SCREEN_PROVIDER` | ✅ Preparado |

## 2. Marca

Ver [`branding/README.md`](branding/README.md).

| Ajuste | Dónde | Estado |
|---|---|---|
| Logos de carga, login y error | Admin API (`loadingLogo`, `loginSceneLogo`, `errorSceneLogo`) | ⏳ Faltan los ficheros de diseño y rellenarlos en la academia |
| Colores de las pantallas de configuración | Admin API (`primaryColor`, `backgroundColor`) | ⏳ |
| Quitar "Powered by WorkAdventure" | Admin API (`showPoweredBy: false`) | ✅ Ya se manda |
| Título de pestaña y descripción | Admin API (`metatags`) | ✅ "Campus Racks University" |
| Favicon e icono de la app instalable | Admin API (`metatags.favIcons`, `manifestIcons`) | ⏳ Faltan los iconos |
| Enlaces legales | Admin API (`legals`) | ⏳ |
| Colores de **toda** la interfaz | Código (Tailwind en `libs/tailwind`) | ❌ Requiere fork. No recomendado |

## 3. Avatares y mascotas

| Ajuste | Dónde | Estado |
|---|---|---|
| Catálogo de avatares (cuerpo, pelo, ropa, sombrero, accesorios) | Admin API (`/api/woka/list`), en `academy-routes/src/lib/campus/woka-catalog.json` | ✅ Por defecto el de WorkAdventure |
| Avatares propios de Racks (uniforme, sudadera, mascota de marca) | PNG de 96×128 (3×4 fotogramas de 32×32) más una entrada en el catálogo | ⏳ Hace falta diseño |
| Avatares exclusivos por plan o canjeables con RacksCoins | Admin API (catálogo por persona) | 💡 Posible: hay que programarlo en la academia |
| Mascotas | `companion-catalog.json` | ✅ |
| Nombre o avatar por defecto, o aleatorio | `.env` `PROVIDE_DEFAULT_WOKA_NAME`/`_TEXTURE` [sin Admin API] | Opcional |
| Velocidad al andar | `WOKA_SPEED` | ✅ 9 |

## 4. Salas y mapa

Ver [`campus-map/README.md`](campus-map/README.md).

| Ajuste | Dónde | Estado |
|---|---|---|
| Plano (recepción, auditorio, aulas, mentorías, cafetería, biblioteca, staff) | Mapa | ✅ Propuesta escrita · ⏳ Falta diseñarlo |
| Script del campus (botón a la academia, aviso a mentores, mensajes por zona) | `campus-map/src/main.ts` | ✅ Escrito (sin compilar aquí) |
| Salas por plan o cohorte | Área restringida con el tag `plan-…`/`edicion-…` | ✅ Los tags ya llegan |
| Megáfono y grabación solo para profes | "Configurar sala" → derechos con el tag `mentor` | ✅ El tag ya llega |
| Aforo, salas bloqueables, zonas de silencio, despachos personales | Tipos de área del editor | Disponible |
| Webs dentro del mapa (pizarra, YouTube, learn) | Áreas "abrir web" y herramientas: `EXCALIDRAW_ENABLED`, `TLDRAW_ENABLED`, `YOUTUBE_ENABLED`, `EMBEDDED_DOMAINS_WHITELIST` | ✅ Preparado en el `.env` |
| Google Docs/Drive/Slides, Klaxoon | `GOOGLE_*_ENABLED` (Drive Picker necesita un proyecto de Google Cloud) | Opcional, apagado |
| Mobiliario propio | Entity collections (`ENTITY_COLLECTION_URLS` en map-storage) | 💡 Opcional |

## 5. Comunicación

| Ajuste | Dónde | Estado / valor |
|---|---|---|
| Tamaño máximo de una burbuja | `MAX_PER_GROUP` | ✅ 8 |
| Cuándo pasa de P2P a LiveKit | `MAX_USERS_FOR_WEBRTC` | ✅ 4 |
| Calidad de vídeo vs tráfico | `LIVEKIT_PIXEL_DENSITY`, `MAX_DISPLAYED_VIDEOS` | ✅ 0,66 / 12 |
| Distancia para abrir burbuja | `MINIMUM_DISTANCE`, `GROUP_RADIUS` | Por defecto (64 / 48) |
| Chat del campus (en sala y con conectados) | Admin API `enableChat*` | ✅ Activado. Sin Matrix, no queda historial |
| Chat persistente y mensajes a desconectados | Matrix/Synapse | ❌ No se monta (Racks tiene su chat) |
| Bocadillos "decir/pensar" | Admin API `enableSay` | ✅ Activado |
| Mensajes globales y moderación | Tag `admin` | ✅ |
| Grabación de clases | LiveKit Egress + S3 + `WORKADVENTURE_RECORDING_ENABLED` en la academia | ⏳ Apagado hasta montar el S3 |
| Idioma | `FALLBACK_LOCALE=es-ES` (y el del navegador) | ✅ |
| Tutorial de primer acceso | `ENABLE_TUTORIAL` | ✅ Activado |
| "Informar de un problema" | `ENABLE_REPORT_ISSUES_MENU` + `REPORT_ISSUES_URL` | ✅ Al foro |

## 6. Integraciones con Racks

| Integración | Mecanismo | Estado |
|---|---|---|
| Entrar desde learn con un botón | Enlace a `https://campus.racks.university/` en la barra lateral, filtrado por la capacidad | ⏳ En la academia (pospuesto) |
| Abrir un directo en el auditorio | `meetingUrl` del directo = `https://campus.racks.university/~/campus.wam#auditorio` | ✅ Sin código |
| Abrir una puerta al completar un módulo | Webhook de la academia → receptor → Room API (`saveVariable`) | 💡 Fase 3. Hay que activar `ROOM_API_SECRET_KEY` |
| Dar XP por asistir | Script del mapa → evento → endpoint de la academia | 💡 Fase 3 (pasar antes por la skill `racks-economia`) |
| Embeber el campus dentro de learn | Iframe con `allow="camera; microphone; display-capture; fullscreen"` (el campus no bloquea iframes) | 💡 Opcional |

## 7. Privacidad y operación

| Ajuste | Valor |
|---|---|
| Telemetría a WorkAdventure | `ENABLE_TELEMETRY=false` (llega gracias al override) |
| Errores a Sentry | `SENTRY_DSN_*` (opcional; plan gratuito) |
| Analítica PostHog | `POSTHOG_*` (opcional; autoalojable) |
| Métricas Prometheus | `PROMETHEUS_AUTHORIZATION_TOKEN` (opcional) |
| Servicios de Google en el navegador | Los modelos del fondo virtual se descargan de `storage.googleapis.com`. Es lo único que va a Google si no se activan las herramientas de Google |
