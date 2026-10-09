# Campus virtual Racks University sobre WorkAdventure: plan de incorporación

> Fecha de la auditoría: 2026-10-09.
> Versiones revisadas: `workadventure-racks` @ `f068c86` (upstream sin cambios, ~v1.34) y `academy-routes` @ `develop` (`cfe702d`, v0.1.65).
> **Este documento no modifica `academy-routes`.** Todo lo que propone para ese repo es trabajo futuro, en una rama propia y nunca sobre `main`.

---

## 0. Resumen en 10 líneas

1. **Este fork es WorkAdventure upstream sin una sola personalización de Racks.** No hay código de Racks: todo está por hacer.
2. **Sí tiene SSO**, por OpenID Connect estándar (Authorization Code + PKCE). **Logto, que ya usáis en `auth.racks.academy`, sirve como proveedor** sin tocar el código de WorkAdventure.
3. **Ojo con la licencia: AGPLv3 + Commons Clause.** Esa cláusula prohíbe *vender* un servicio que consista "entera o sustancialmente" en WorkAdventure. Si el campus va dentro de un plan de pago, **hablad antes con WorkAdventure** (hello@workadventu.re) para pedir la licencia *Enterprise*. Es el único coste que no se puede autoalojar.
4. **Para instalarlo necesitas 1 servidor para WorkAdventure, más LiveKit y Coturn** (idealmente en otra máquina con buen ancho de banda), con HTTPS y DNS.
5. **Lo que podéis autoalojar:** WorkAdventure, LiveKit, Coturn, Redis, Logto (ya lo tenéis), S3 (RustFS/MinIO) y Matrix.
6. **Lo que se paga fuera:** los servidores y el tráfico, el dominio, la licencia comercial si aplica y, si queréis, LiveKit Cloud en vez de operar el vídeo vosotros.
7. **Fase 1 (MVP) no necesita ni una línea de código en `academy-routes`.** Se crea una app en Logto, se despliega con `DISABLE_ANONYMOUS=true` y el enlace va en el `meetingUrl` de un directo, que ya filtra por plan.
8. **Para que los planes y matrículas de Racks decidan quién entra en qué sala** hay que implementar la **Admin API** de WorkAdventure: un puente con 4 o 5 endpoints. Ya hay una plantilla casi exacta en `academy-routes` (`/api/internal/v1/users/{sub}/chat-permissions`).
9. **Para conectar progreso y campus** (abrir una puerta al completar un módulo, por ejemplo) se usan los **webhooks de salida** que ya tiene Racks, más la **Room API gRPC** de WorkAdventure.
10. **Recomendación:** autoalojar WorkAdventure, Coturn y LiveKit en Hetzner u OVH, reutilizar Logto y no montar Matrix, Jitsi ni BBB al principio.

---

## 1. Qué es cada repo (y qué tiene Racks hoy)

### 1.1 `workadventure-racks` (este repo)

- Es un fork de `workadventure/workadventure`. El historial es superficial (50 commits) y todos los commits son de autores upstream (TheCodingMachine).
- **No hay ninguna referencia a Racks** en el código.
- Es un monorepo npm con estos paquetes:
  - `play`: front Svelte/Phaser + *pusher* + Room API
  - `back`: gRPC
  - `map-storage`: mapas `.wam` y editor
  - `uploader`: ficheros del chat
  - `messages`: protobuf
  - `libs/*`
  - `contrib/docker`: instalación de producción con Docker Compose
  - `contrib/helm`: chart de Kubernetes

### 1.2 `academy-routes` (Racks Academy / Racks University, `learn.racks.university`)

Inventario de lo que ya está construido (sirve para saber qué se puede enganchar al campus):

| Dominio | Qué hay |
|---|---|
| Catálogo | Aulas → módulos → clases (vídeo Vimeo/Bunny/propio, lectura con bloques `:::`, quiz, ejercicio, proyecto), recursos, tags, herramientas, glosario con IA |
| Rutas | Rutas de aprendizaje por fases, prerequisitos, certificados verificables, generador de rutas con IA (n8n) |
| Cursos | `Programa → Edicion → Matricula`, catálogo público `/courses`, invitaciones por email |
| Retos | 9 tipos, entregas con ficheros, evaluación por IA (n8n), mentor, comunidad y comunidad en vivo |
| Evaluaciones | Tests de clase y exámenes de módulo, generación con Anthropic |
| Evaluaciones en vivo y mentorías | Reservas, disponibilidad, Google Calendar + Meet automático, grabación con Recall.ai, feeds iCal cifrados |
| Directos | `LiveSession` (DIRECTO / MENTORIA / TEMATICO), asistencia, ICS, grabación, transcripción y resumen. **El `meetingUrl` se oculta a quien no tiene acceso** |
| Economía | XP, RacksCoins, gemas, rachas, conversión, ranking por edición |
| Tienda | Productos canjeables con RacksCoins (no hay pagos reales), promos del banner |
| Comunidad | Chat (servicio aparte `chat-racks-university`), comentarios, valoraciones, foro Discourse embebido |
| Blog, casos de éxito, instructores, perfiles públicos | — |
| IA | Chat en clase (OpenAI), tutor RAG (servicio propio), tutor de voz (ElevenLabs), generación con Anthropic |
| Integración | Webhooks de salida (outbox + reintentos), servidor MCP (9 superficies), API interna M2M, partners embebidos |
| Accesos | Grafo de *entitlements*: planes, grants por contenido, secciones/capacidades, excepciones, `OrgRole`, RLS multi-tenant en Postgres |
| Admin | `/panel-control/*` (unas 35 secciones) |

**Ninguna referencia a WorkAdventure, metaverso ni campus virtual.** "Racks University" hoy es una marca de catálogo, no un tenant separado: `getCurrentOrgId` siempre resuelve a Racks Academy (Fase 1).

---

## 2. Qué necesitas para instalar WorkAdventure

### 2.1 Infraestructura

| Pieza | ¿Obligatoria? | Para qué | Notas |
|---|---|---|---|
| **Servidor WorkAdventure** (Docker) | Sí | play, back, map-storage, uploader, icon, redis, traefik | Los propios docs dicen que **2 CPU / 4 GB aguantan unos 300 usuarios concurrentes** (`contrib/docker/README.md`) |
| **LiveKit** | Muy recomendable | Vídeo cuando hay más de 4 personas en una burbuja (por debajo de eso es P2P) y en salas de reunión | Necesita IP pública, puertos UDP/TCP abiertos y mucho ancho de banda. Mejor en una máquina aparte. Alternativa de pago: LiveKit Cloud |
| **Coturn** (TURN/STUN) | Muy recomendable | Sin él, **en torno al 15 % de usuarios no consigue audio ni vídeo** (redes corporativas o universitarias) | Autoalojado. Usar `TURN_STATIC_AUTH_SECRET` |
| **Proveedor OIDC** | Para SSO | Login | **Logto existente** (`auth.racks.academy`) |
| **Synapse (Matrix)** | Opcional | Chat persistente y offline dentro del campus | Racks ya tiene su chat. **No montarlo en la fase 1** |
| **Jitsi / BigBlueButton** | Opcional | Salas grandes y webinars | LiveKit lo sustituye. **No montarlo**. Ojo: el `BBB_URL` por defecto es un **servidor de pruebas público**; si no lo usáis, vaciadlo |
| **S3** | Opcional | Grabaciones (LiveKit Egress), mapas y ficheros del chat | RustFS o MinIO autoalojado, Hetzner Object Storage o Cloudflare R2 |
| **DNS + HTTPS** | Sí | WebRTC exige HTTPS válido; no funciona con una IP a pelo | Let's Encrypt automático con Traefik |

**Dominios propuestos, todos bajo `racks.university`:**

| Dominio | Para qué |
|---|---|
| `campus.racks.university` | WorkAdventure, instalación *single-domain* |
| `livekit.racks.university` | LiveKit |
| `turn.racks.university` | Coturn |

> **Por qué bajo `racks.university`:** `learn.racks.university` solo puede embeber en iframe partners del mismo sitio, por las cookies `SameSite=Lax` de Logto. Ver `academy-routes/src/lib/embed-urls.ts`.

### 2.2 Pasos de instalación (Docker Compose, método oficial)

Basado en `contrib/docker/README.md`:

```bash
# En el servidor (Docker + docker compose instalados, puertos 80/443 abiertos)
mkdir workadventure && cd workadventure
cp <repo>/contrib/docker/docker-compose.prod.yaml docker-compose.yaml
cp <repo>/contrib/docker/.env.prod.template .env
# editar .env: VERSION (tag de release, NUNCA master), DOMAIN, ACME_EMAIL, SECRET_KEY,
#   MAP_STORAGE_AUTHENTICATION_USER/PASSWORD, LIVEKIT_*, TURN_*, OPENID_* …
docker compose up -d
# subir el primer mapa con el map-starter-kit y comprobar https://DOMAIN/map-storage/
```

En [`racks/env.racks.example`](./env.racks.example) tenéis las variables concretas para Racks.

### 2.3 Trampas encontradas al auditar (los docs no coinciden con el código)

1. **`OPENID_TAGS_CLAIM` no se pasa al contenedor `play`** en `docker-compose.prod.yaml`. Si queréis tags desde Logto, añadidla a mano en la sección `environment` de `play`.
2. **`OPENID_USERNAME_CLAIM` vale `username` por defecto en el código** (`play/src/pusher/enums/EnvironmentVariable.ts:87`), aunque la doc dice otra cosa. Logto emite `username` y `name`; fijadla explícitamente.
3. **Los nombres de las variables TURN del README de Docker están mal.** Las reales son `TURN_USER`, `TURN_PASSWORD` y `TURN_STATIC_AUTH_SECRET`.
4. **`OPENID_CLIENT_REDIRECT_URL` y `OPENID_LOGOUT_REDIRECT_URL` no se leen.** La redirección sale siempre de `PUSHER_URL` y es `https://campus.racks.university/openid-callback`.
5. **El logout no cierra la sesión de Logto**, solo revoca el token. Por eso la instalación de producción fija `OPENID_PROMPT=login`.
6. **La telemetría está activada por defecto** (`ENABLE_TELEMETRY`, envío diario a `stats.workadventu.re`). Si la instalación es privada, ponedla a `false`.
7. **`MAP_EDITOR_ALLOW_ALL_USERS=true` en la plantilla.** Así **cualquier usuario puede editar el mapa**. Ponedla a `false`.
8. **Sin Admin API, los tags se congelan dentro del JWT de WorkAdventure durante 30 días.** Un cambio de rol en Logto no se ve hasta que el usuario vuelve a hacer login.

---

## 3. SSO: cómo encaja con Logto

### 3.1 Cómo funciona en WorkAdventure

- El código está en `play/src/pusher/services/OpenIDClient.ts` y `controllers/AuthenticateController.ts`.
- **Flujo:**
  1. Se llama a `/login-screen`.
  2. El usuario se autentica en Logto.
  3. Logto vuelve a `/openid-callback`.
  4. WorkAdventure llama a **userinfo**.
  5. Emite su propio JWT (HS256 con `SECRET_KEY`, 30 días).
- En cada carga de página se revalida el access token contra userinfo.
- **El identificador del usuario es el `email`** (con `sub` como respaldo). El scope tiene que incluir `openid` y `email`.
- Los **tags** salen del claim `OPENID_TAGS_CLAIM` de userinfo (un array de strings). El tag `admin` da todo esto:
  - silenciar y expulsar a otros
  - mensajes globales
  - moderar Jitsi/BBB
  - grabar siempre
  - moderar el turno de palabra
- El tag `editor` da acceso al editor de mapas.
- Los mapas pueden restringir áreas, megáfono o grabación por tag.

### 3.2 Qué configurar en Logto (fase 1)

1. **Applications → Create → Traditional web**, con el nombre "WorkAdventure Campus".
2. Redirect URI: `https://campus.racks.university/openid-callback`.
3. Post sign-out redirect URI: `https://campus.racks.university/`.
4. Copiar App ID y App secret en `OPENID_CLIENT_ID` y `OPENID_CLIENT_SECRET`.
5. Issuer: `https://auth.racks.academy/oidc`, que va en `OPENID_CLIENT_ISSUER`.
6. Scopes: `openid email profile roles`, más `organizations` y `organization_roles` si se quieren usar después.

> **Aviso de `academy-routes`.** Si algún día se añade un *resource indicator* nuevo para el campus en `src/lib/logto.ts`, **hay que registrarlo antes en Logto**. Si no, Logto responde `invalid_target` y **se rompe el login de todos los alumnos**. En la fase 1 no hace falta tocar `academy-routes`.

### 3.3 La pega de los tags con Logto

- WorkAdventure busca los tags `admin` y `editor` **en minúsculas**. Los roles globales de Racks se llaman `Admin` y `Profesor`, y la comparación distingue mayúsculas, así que **no funcionan tal cual**.
- Hay dos opciones:
  - **Fase 1:** usar `MAP_EDITOR_ALLOWED_USERS=email1,email2` para los editores y no depender de tags. Los permisos de moderación (`admin`) quedan sin asignar.
  - **Fase 2 (recomendada):** la Admin API devuelve los tags ya calculados (`admin`, `mentor`, `plan-genia`, `edicion-2026-10`, …) a partir de la base de datos de Racks. Además, se refrescan en cada conexión, no cada 30 días.
- **Pendiente de comprobar en vuestro tenant:** si el endpoint userinfo de Logto devuelve `roles` con el scope `roles`. Si lo hace, `OPENID_TAGS_CLAIM=roles` funcionaría con roles creados en minúsculas.

### 3.4 Embeber el campus dentro de `learn.racks.university`

- WorkAdventure **no envía `X-Frame-Options` ni CSP**, así que se puede meter en un iframe con `allow="camera; microphone; display-capture; fullscreen; autoplay"`.
- **Logto no se deja embeber** (`frame-ancestors 'self' https://sso.racks.academy`). El primer login tiene que ser una navegación a pantalla completa. Racks ya resuelve esto con `GatedPartnerEmbed.tsx`: se reutiliza el patrón.
- **A la inversa no funciona por ahora:** `academy-routes` envía `X-Frame-Options: DENY`, así que una clase de Racks no se puede abrir como *co-website* dentro de WorkAdventure sin cambiar esas cabeceras.

### 3.5 Riesgo de seguridad heredado

`academy-routes/SECURITY-AUDIT.md` señala que `getOrCreateUser` enlaza cuentas por email **sin comprobar `email_verified`**. WorkAdventure también identifica por email. Antes de que el puente de la fase 2 resuelva permisos por email, mejor hacerlo por `sub` (= `users.logto_id`) y exigir email verificado en Logto.

---

## 4. Integración con Racks University: arquitectura por fases

```
          ┌──────────────── Logto (auth.racks.academy) ────────────────┐
          │  OIDC app "Academy"            OIDC app "WorkAdventure"    │
          └──────────┬─────────────────────────────┬───────────────────┘
                     │                             │
        learn.racks.university              campus.racks.university
         (Next.js / Vercel)                   (WorkAdventure, Docker)
                     │  ◄── Admin API (fase 2): /api/map, /api/room/access ──┤
                     │  ── webhooks LESSON/MODULE_COMPLETED (fase 3) ──► puente ──► Room API gRPC
                     │                                                        │
                Neon Postgres                                         LiveKit + Coturn
```

### Fase 0: Licencia (antes de invertir más)

- Escribir a hello@workadventu.re explicando el caso: un campus para alumnos dentro de planes de pago de Racks University.
- Pedir precio de la licencia *Enterprise*, o confirmación por escrito de que el uso educativo interno no es "vender el software".
- **Es una decisión legal, no técnica. Que la revise vuestro asesor.**
- Mientras tanto, se puede hacer un piloto interno sin cobrar por el acceso al campus.

### Fase 1: MVP con SSO, sin código en `academy-routes` (1–2 semanas)

1. Contratar un VPS para WorkAdventure y otro para LiveKit + Coturn (ver §5).
2. Configurar el DNS de `campus`, `livekit` y `turn` en `racks.university`.
3. Instalar con Docker Compose usando `racks/env.racks.example`. Valores clave: `DISABLE_ANONYMOUS=true`, `MAP_EDITOR_ALLOW_ALL_USERS=false`, `ENABLE_TELEMETRY=false` y `BBB_URL` vacío.
4. Crear la app en Logto (§3.2).
5. Diseñar el mapa del campus: aulas, auditorio, zona de mentorías, cafetería. Se hace con el editor integrado (`/~/campus.wam`) o con Tiled y el map-starter-kit.
6. **Engancharlo a Racks sin código.** Crear un directo (`LiveSession`) con `meetingUrl = https://campus.racks.university/~/campus.wam#auditorio`. El directo ya oculta la URL a quien no tiene el plan.

**Limitación:** cualquier usuario con cuenta en Logto puede entrar en cualquier sala si conoce la URL. Logto sirve a más de 10 apps, así que eso incluye gente que no es alumna. Para el piloto es aceptable; para producción, fase 2.

### Fase 2: Admin API, para que los planes de Racks controlen el campus (3–5 semanas)

Hay que construir un "puente" que implemente la Admin API de WorkAdventure. La especificación OpenAPI está en `https://campus…/openapi/admin` con `ENABLE_OPENAPI_ENDPOINT=true`, y el código de referencia en `play/src/pusher/services/AdminApi.ts`.

**Endpoints mínimos:**

| Endpoint (los llama WorkAdventure) | Qué devuelve el puente |
|---|---|
| `GET /api/capabilities` | `{"api/domain/verify":"v1"}`, más lo que se implemente |
| `GET /api/map?playUri&userId&accessToken` | `wamUrl` del mapa, `authenticationMandatory:true`, `canEdit`, branding, `opidLogoutRedirectUrl`, `showPoweredBy`… |
| `GET /api/room/access?userIdentifier&playUri&…` | **El control de entrada.** `{status:"ok", email, userUuid, tags:[…], canEdit, canRecord, world}`, o `ErrorApiData` para denegar |
| `GET /api/woka/list` (opcional) | Avatares propios de Racks, o local si no está |
| `GET /api/domain/verify` (opcional) | 204 |

**Dónde vive el puente.** Recomendado: **dentro de `academy-routes`**, en `src/app/api/internal/v1/workadventure/*` y en una rama de feature, nunca `main`. Así reutiliza:

- Lo más parecido que ya existe: `src/app/api/internal/v1/users/[userId]/chat-permissions/route.ts` + `resolveChatPermissions`. Ya tiene rate limit, presupuesto p95 ≤150 ms y "usuario desconocido → lista vacía".
- El resolvedor de accesos: `src/lib/access/resolve.ts`, `load-context.ts`, `filter-by-level.ts` y `enforcement.ts`.
- Una nueva `Section` de capacidad `campus-virtual`, sembrada en `prisma/seed-entitlements.ts` y en `CAPABILITY_KEYS`, que responde "puede entrar al campus".
- **Un `ContentItem` por sala.** Puede ser un tipo nuevo `CAMPUS_ROOM` o vincular la sala a un `LIVE_SESSION` o `CLASSROOM` existente. La regla es INTERACTIVO = entra, VISIBLE = ve la puerta cerrada, OCULTO = no la ve. Así se gestionan desde `/panel-control/plans` como cualquier otro contenido.
- Tags calculados así:

| Origen en Racks | Tag en WorkAdventure |
|---|---|
| `OrgRole` ADMIN, o rol Logto `Admin` | `admin` |
| Instructor vinculado (`Instructor.userId`) | `mentor` |
| Planes activos | `plan-<slug>` |
| `users.edition_tags` | Tags de cohorte |

- La seguridad de multi-tenant: RLS mediante `withOrgScope`.

**Tres detalles técnicos que hay que respetar:**

1. **WorkAdventure manda `Authorization: <ADMIN_API_TOKEN>` sin el prefijo `Bearer`**, y es un token estático, no un JWT de Logto. El `verifyInternalRequest` actual (JWKS de Logto) no sirve tal cual: hace falta comparar en tiempo constante con un secreto propio (`WORKADVENTURE_ADMIN_TOKEN`).
2. **`/api/room/access` se llama en cada conexión WebSocket.** Tiene que ser rápido (2–3 queries) y nunca hacer 500 por un usuario desconocido: tiene que devolver un error tipado.
3. **Al arrancar, el *pusher* se bloquea reintentando `GET /api/capabilities`.** Si Vercel tiene una caída, el campus no arranca. Ese endpoint debe ser estático y, si se puede, cacheado.

**Alternativa:** un microservicio aparte que lea la base de datos con el rol `academy_app`. Desaconsejado, porque duplica la lógica de accesos, y el `AGENTS.md` de Racks pide no duplicar.

### Fase 3: Gamificación y conexión con el progreso (opcional)

- **Racks → campus.** Un webhook de salida `MODULE_COMPLETED` o `LESSON_COMPLETED` (ya existe, ver `src/lib/webhooks/AGENTS.md`) llega a un pequeño receptor. Ese receptor llama a la **Room API gRPC** de WorkAdventure (`saveVariable` / `broadcastEvent`, con el paquete npm `@workadventure/room-api-client`) para abrir la puerta del aula siguiente o mostrar un aviso.
- **Campus → Racks.** Un script del mapa (`WA.event` / `WA.state`) más `listenToEvent` desde el receptor permiten dar XP o RacksCoins por asistir. Esto necesita un endpoint de entrada nuevo en Racks y **pasar por la skill `racks-economia`** antes de fijar precios, para no inflar la economía.
- **Directos dentro del campus.** El `meetingUrl` de los directos de tipo TEMATICO apunta a un área LiveKit del auditorio. La grabación se hace con LiveKit Egress a S3 y su URL va a `recordingUrl`.
- **Mentorías.** Hoy se hacen con Google Meet + Recall.ai. Pasarlas al campus solo compensa si se resuelve la grabación con Egress, porque Recall.ai no entra en WorkAdventure.

---

## 5. Costes: qué autoalojar y qué pagar

> **Las cifras son aproximadas y de referencia. Verificad los precios actuales antes de decidir.** Lo que más pesa en el vídeo es el **ancho de banda**, no la CPU.

| Pieza | Autoalojable | Recomendación | Coste orientativo |
|---|---|---|---|
| WorkAdventure (play/back/map-storage/uploader/redis/traefik) | ✅ | **Autoalojar** | VPS 4 vCPU / 8 GB (Hetzner/OVH): ~10–20 €/mes |
| LiveKit (vídeo SFU) | ✅ (Apache 2.0) | **Autoalojar** en un VPS o dedicado con tráfico incluido. Hetzner incluye 20 TB/mes | VPS 4–8 vCPU: ~15–40 €/mes; dedicado si hay cientos en vídeo |
| LiveKit Cloud | — | Solo si no queréis operar el vídeo | Pago por minuto y participante; puede subir mucho con clases grandes |
| Coturn | ✅ | **Autoalojar**, en la misma máquina que LiveKit para empezar | 0 € extra |
| Logto | ✅ (OSS) | **Reutilizar el que ya tenéis** | 0 € extra (si es Logto Cloud, mirad el límite de apps y MAU del plan) |
| Postgres | — | WorkAdventure **no necesita** Postgres; usa Redis + ficheros/S3 | 0 € |
| S3 (grabaciones/mapas) | ✅ (RustFS/MinIO) | Hetzner Object Storage o R2 si se graba | ~5 €/mes por TB |
| Matrix/Synapse | ✅ | **No montarlo** al principio; Racks tiene su chat | — |
| Jitsi / BBB | ✅ | **No montarlos**; LiveKit los sustituye | — |
| Sentry / PostHog | ✅ / SaaS con plan gratuito | Opcional | 0 € con los planes gratuitos |
| Dominio + DNS | — | Cloudflare (gratis) sobre `racks.university` | 0 € |
| Certificados TLS | — | Let's Encrypt automático | 0 € |
| **Licencia Enterprise de WorkAdventure** | ❌ | **Pedir presupuesto** si el campus se vende dentro de un plan (Commons Clause) | Bajo presupuesto |
| WorkAdventure SaaS (alternativa a todo lo anterior) | — | Considerarlo si no tenéis a alguien para mantener servidores: hay releases **cada mes** | Por usuario/mes; mirad workadventu.re/pricing |

**Coste total estimado autoalojado para un piloto de hasta unos 200 alumnos concurrentes:** **~30–60 €/mes de infraestructura**, más la licencia si aplica, más **tiempo de mantenimiento** (actualizaciones mensuales; ver `UPGRADE.md`).

**Mi recomendación para mantener costes bajos y control:**

- **Autoalojar** WorkAdventure, LiveKit y Coturn, y reutilizar Logto.
- **Pagar** solo los servidores y, si es necesaria, la licencia.
- **No pagar** LiveKit Cloud ni el SaaS de WorkAdventure, salvo que no haya nadie para operar la infraestructura.

---

## 6. Checklist de arranque

**Infraestructura y despliegue**

- [ ] Fase 0: correo a WorkAdventure sobre la licencia y revisión legal.
- [ ] Decidir dominios (`campus.`, `livekit.`, `turn.` en `racks.university`).
- [ ] Contratar 2 VPS: WorkAdventure, y LiveKit + Coturn.
- [ ] Instalar LiveKit + Coturn (docs oficiales de LiveKit) y abrir los puertos UDP.
- [ ] Desplegar WorkAdventure con Docker Compose y `racks/env.racks.example`, fijando `VERSION` a un tag.
- [ ] Añadir `OPENID_TAGS_CLAIM` a la sección `environment` de `play` en el compose.

**SSO y contenido**

- [ ] Crear la app "WorkAdventure Campus" en Logto con las redirect URIs.
- [ ] Probar el login con un alumno y con un admin.
- [ ] Diseñar el mapa del campus y subirlo a map-storage.
- [ ] Crear un directo de prueba en `/panel-control/live` con el enlace al campus.

**Hacia producción**

- [ ] Fase 2: abrir una rama de feature en `academy-routes` (desde `develop`, **nunca `main`**) para el puente de la Admin API.

---

## 7. Referencias dentro de los repos

**WorkAdventure**

- Docs:
  - `docs/others/self-hosting/install.md`
  - `openid.md`
  - `adminAPI.md`
  - `recording.md`
  - `matrix.md`
  - `env-variables.md`
- Despliegue: `contrib/docker/README.md`, `docker-compose.prod.yaml` y `.env.prod.template`.
- Código:
  - OIDC: `play/src/pusher/services/OpenIDClient.ts`
  - Admin API: `play/src/pusher/services/AdminApi.ts`
  - Modo sin Admin API: `LocalAdmin.ts`
  - Room API: `messages/protos/room-api.proto`
- Licencia: `play/LICENSE.txt` (AGPLv3 + Commons Clause, línea 679).

**Racks (`academy-routes`, solo lectura)**

- Auth:
  - `src/lib/logto.ts`
  - `src/lib/auth.ts`
  - `src/app/callback/route.ts`
  - `src/lib/access/sso-sync.ts`
- Accesos: `src/lib/access/{resolve,load-context,enforcement,filter-by-level}.ts`.
- Plantilla para el puente: `src/app/api/internal/v1/users/[userId]/chat-permissions/route.ts`.
- Embebidos: `src/lib/embed-urls.ts`, `src/components/shared/GatedPartnerEmbed.tsx` y `next.config.ts`.
- Directos: `src/lib/queries/live-public.ts`.
- Webhooks: `src/lib/webhooks/AGENTS.md`.
