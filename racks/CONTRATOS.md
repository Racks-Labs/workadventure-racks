# Contratos técnicos de lo que falta por construir

Diseño cerrado de las piezas con código que **aún no existen**, para que cuando se empiecen solo haya que implementarlas.

Todo lo que toca `academy-routes` va en una **rama propia creada desde `develop`**, nunca en `main`, siguiendo sus reglas:

- `npm run fmt`, `lint` y `typecheck` en verde;
- lógica pura con tests;
- RLS;
- documentación en `src/lib/campus/AGENTS.md`.

Estado de partida:

- **El puente SSO / Admin API ya existe** (rama `feat/campus-workadventure-sso`): `/api/internal/workadventure/api/*`.
- **El `userRoomToken` actual** es un HMAC `<userId>.<exp>.<firma>`, firmado con `WORKADVENTURE_ADMIN_TOKEN`, válido 12 h (`campus-shared.ts`).

---

## C1 · Token de sala v2 (requisito de C2, C3 y C4)

**El problema:** el token v1 no dice **en qué sala** se emitió ni **para qué** sirve. Un minijuego no puede comprobar que el alumno está de verdad en el campus.

**El contrato:**

```
userRoomToken = base64url(payload) + "." + base64url(HMAC-SHA256(payload, CAMPUS_TOKEN_SECRET))
payload = { "v": 2, "sub": "<users.id>", "room": "<playUri sin hash>", "iat": <s>, "exp": <s, iat + 12h> }
```

**Las reglas:**

- **Secreto propio** (`CAMPUS_TOKEN_SECRET`), **distinto** de `WORKADVENTURE_ADMIN_TOKEN`. Si se filtra uno, no compromete el otro.
- **Doble verificación:** `verifyRoomToken` acepta v1 y v2 durante la transición. `limit/fileSize` sigue funcionando.
- **Sala obligatoria:** quien lo verifica comprueba que `room` empieza por `WORKADVENTURE_PLAY_URL`.
- **Cambio pequeño:** se emite en `room/access` (ya existe) y se lee en el minijuego con `WA.player.userRoomToken`.

## C2 · Agente del campus (Profe Byte con Hermes o el tutor RAG)

**Las piezas:**

1. **NPC en el mapa:** área `npc-byte` y `npc-dialog-box` para el saludo.
2. **Panel de chat:** web estática en `https://tutor.racks.university/chat?npc=byte`, que se abre con `WA.nav.openCoWebSite(url, true)` (`allowApi`). Lee `WA.player.userRoomToken`.
3. **Proxy:** endpoint en la academia (`src/app/api/campus/agent/[npc]/route.ts`).

**El endpoint:**

```
POST /api/campus/agent/{npc}
Authorization: Bearer <userRoomToken v2>
{ "messages": [{ "role": "user", "content": "..." }] }        ← solo los del alumno; el system lo pone el servidor
→ 200 text/event-stream (SSE, se reenvía el stream de Hermes / del tutor)
→ 401 token inválido · 429 tope diario · 503 agente no configurado
```

**Las reglas** (ver `PRIORIZACION.md` y el módulo "Hermes: un arnés por dentro"):

- **La clave de Hermes** (`HERMES_API_KEY`) y su URL (`HERMES_API_URL`, `/v1/chat/completions`) solo viven en el servidor.
- **El system prompt lo fija el servidor** según `npc` (registro en código: `byte`, `finanzas`, `bots`…). El cliente nunca lo manda.
- **Topes por alumno y día** (por ejemplo 30 mensajes), **por NPC** y **por tamaño de mensaje**. Se registra el uso para medir el coste.
- **Hermes público = sin herramientas con efectos** (ni shell, ni escritura) y **sin memoria compartida entre alumnos**. Una sesión por `sub` o ninguna.
- **El panel debe poder embeberse en el campus:** cabecera `frame-ancestors https://campus.racks.university`. Learn no sirve hoy para esto, porque manda `X-Frame-Options: DENY`; por eso es un subdominio aparte.

## C3 · Resultado de un minijuego (terminales)

```
POST /api/campus/games/{gameId}/result
Authorization: Bearer <userRoomToken v2>
{ "attemptId": "<uuid del cliente>", "answers": { ... } }      ← lo que hizo el alumno, NO la puntuación
→ 200 { "score": 80, "passed": true, "reward": { "xp": 10, "coins": 0 }, "capped": false }
```

**Las reglas:**

- **El servidor calcula la puntuación** a partir de `answers`. El cliente se puede trucar.
- **Idempotencia:** el mismo `attemptId` cuenta una sola vez.
- **Topes diarios por juego y por alumno.** Los importes salen de la skill `racks-economia`, nunca a ojo.
- **Las preguntas y casos salen de la academia** (`EvaluationQuestion`, ejemplos `exampleContent`) mediante `GET /api/campus/games/{gameId}/round`, que devuelve la ronda **sin las soluciones**.

## C4 · Avatares por alumno (ver `AVATARES.md`)

**Modelo:**

```prisma
model CampusTexture {
  id        String   @id @default(cuid())
  userId    String?  // null = global (catálogo para todos)
  layer     String   // woka|body|eyes|hair|clothes|hat|accessory
  name      String
  url       String   // en el dominio del campus (CORS, ver AVATARES §1)
  source    String   // BASE|RECOLOR|CHALLENGE|STORE|ACHIEVEMENT|EVENT
  status    String   // PENDING|APPROVED|REJECTED
  unlockKey String?  // plan-…, logro, producto de tienda
  createdAt DateTime @default(now())
}
```

**Endpoints:**

- **`GET /api/woka/list?uuid=<email>`** (ya existe): catálogo global, más las texturas `APPROVED` de ese alumno, más las desbloqueadas por sus planes, logros o compras.
- **`GET /api/room/access`** (ya existe): valida contra **ese** mismo conjunto. Es una sola función compartida; si fueran dos, acabarían divergiendo.

**Generación y validación:**

- **El recoloreado** reutiliza `racks/tools/avatar-lib.mjs` (`recolor`, `checkAvatar`).
- **Las entregas del reto "Diseña tu avatar"** pasan `checkAvatar` antes de quedar en `PENDING`.

## C5 · Puertas de ruta (progreso en learn → campus)

```
academia (webhook de salida MODULE_COMPLETED, ya existe)
   → receptor (n8n o endpoint propio)
   → Room API gRPC saveVariable({ room: "<sala de la ruta>", name: "puerta_<moduleSlug>_<userId>", value: true })
```

**El problema:** las variables de sala son **compartidas**, y abrir una puerta "para uno" no se resuelve con una variable común.

**Lo que se hace:**

1. **Variable de jugador.** El script de la sala, al entrar, consulta a la academia el progreso del alumno con su token: `GET /api/campus/progress?route=…` → fases completadas. Ese progreso se guarda en una **variable de jugador** (`WA.player.state`), y la puerta se abre o se cierra **solo para él** con `WA.room.setTiles` y una capa de colisión local.
2. **Room API para lo colectivo.** Se usa para anuncios de sala ("¡Ana ha terminado la Ruta de Agentes!") o para logros de toda la cohorte.

**Requisito:** `ROOM_API_SECRET_KEY` en el campus, y el puerto 50051 expuesto, o el subdominio `room-api.` si se pasa por un proxy.

## C6 · MCP del campus (herramienta del equipo)

**Herramientas:**

| Herramienta | Qué hace |
|---|---|
| `campus_announce` | Mensaje global o de sala (`POST /message` de `play`, con `ADMIN_API_TOKEN`) |
| `campus_rooms` | Quién está y dónde (`GET /rooms`) |
| `campus_set_variable` / `campus_broadcast` | Room API |
| `campus_quiz_start` | Lanza un quiz en el auditorio. Por debajo, `broadcast` con las preguntas de un test |

**Reglas, como en el resto del MCP de Racks:**

- **Confirmar antes de escribir.**
- **Scopes separados** `campus:read` / `campus:write`.
- **Nunca lee el contenido del chat.**
