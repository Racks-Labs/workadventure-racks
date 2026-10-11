---
name: racks-campus
description: Diseña, monta y amplía el CAMPUS VIRTUAL de Racks University sobre WorkAdventure (campus.racks.university) — salas y distritos, áreas y permisos por tag, scripts de mapa (WA.*), NPCs y agentes (Hermes / tutor RAG), terminales y minijuegos en iframe, avatares (Wokas), despliegue y la integración SSO con la academia. Úsala SIEMPRE que el usuario hable de "campus", "WorkAdventure", "World Adventure", "mapa", "sala", "distrito", "auditorio", "NPC", "avatar", "woka", "minijuego", "terminal", "escape room", "Room API", "Admin API" o del repo workadventure-racks — aunque no diga "campus".
---

# Campus virtual Racks University (WorkAdventure)

Todo el diseño ya está pensado y escrito en `racks/` del repo **workadventure-racks**, rama `docs/plan-incorporacion-racks-university`. **Léelo antes de proponer nada:** la mayoría de preguntas ya tienen respuesta y casi todas las trampas están documentadas.

## Dónde está cada cosa

| Necesito… | Documento |
|---|---|
| Visión, índice y hoja de ruta | `racks/README.md` |
| Plan general, licencia (AGPL + Commons Clause), SSO | `racks/PLAN-INCORPORACION.md` |
| Desplegar (2 servidores, Docker Compose, sin Dokploy) | `racks/deploy/DESPLIEGUE.md` |
| Probar en local (Mac) | `racks/PRUEBA-LOCAL.md` |
| Qué se puede personalizar y dónde | `racks/CUSTOMIZACION.md` |
| Plano de salas y distritos | `racks/campus-map/PLANO.md` |
| Minijuegos, iframes, multijugador | `racks/campus-map/EXPERIENCIAS.md` |
| Ecosistema, librerías, casos reales | `racks/INSPIRACION.md` |
| Qué hacer primero | `racks/PRIORIZACION.md` |
| Avatares por alumno | `racks/AVATARES.md` y `racks/tools/` |
| Contratos de lo que falta programar | `racks/CONTRATOS.md` |
| Piezas gráficas para diseño | `racks/branding/BRIEF-DISENO.md` |
| El puente de la academia (Admin API) | `academy-routes`, `src/lib/campus/AGENTS.md` (rama `feat/campus-workadventure-sso`) |

## Reglas que no se negocian

1. **Nunca se toca `main` de `academy-routes`.** El trabajo de la academia va en ramas creadas desde `develop`, y solo cuando el usuario lo pida.
2. **El campus es para la comunidad, no un producto que se venda.** Ningún plan ni producto de la tienda puede ser "el acceso al campus" (Commons Clause). Si se ofrece a terceros, ellos compran la licencia a WorkAdventure.
3. **Cualquier premio** (XP, RacksCoins, gemas) **se valora con la skill `racks-economia`** antes de fijarlo, y se calcula **en el servidor**, nunca en el navegador.
4. **Las claves nunca van al navegador:** Hermes, Room API, `ADMIN_API_TOKEN`. Todo pasa por un proxy de servidor que verifica el `userRoomToken`.
5. **Imágenes de avatar en el dominio del campus** (CORS en WebGL) y **validadas** con `racks/tools/avatar-check.mjs`.
6. **Licencia de cada tile o sprite** apuntada en `LICENCIAS.md` desde el primer uso.
7. **Learn no se puede embeber** (`X-Frame-Options: DENY`). Lo que se abra dentro del campus vive en un subdominio de `racks.university` con `frame-ancestors https://campus.racks.university`.

## Convenciones

- **Tags** (los calcula el puente en cada conexión):
  - `admin`: moderar todo;
  - `editor`: editor de mapas;
  - `mentor`: profes, mentores e instructores;
  - `plan-<slug-del-plan>`;
  - `edicion-<cohorte>`.
- **Nombres de área**, en minúsculas y con guiones, iguales en el mapa y en el script:
  - `recepcion`, `auditorio`, `mentoria-1…n`, `cafeteria`, `biblioteca`;
  - `npc-<nombre>`, `terminal-<juego>`.
- **Distritos:** IA, Negocio y Finanzas, más la plaza central (ver `PLANO.md`). Las puertas de distrito se ven **cerradas** a quien no tiene el plan (escaparate), no se ocultan.
- **Sala MVP antes que sala bonita:** recepción, auditorio, cafetería y mentorías primero.

## Cómo hacer las tareas típicas

**Crear o modificar una sala**

1. Ubícala en `PLANO.md`.
2. Dibújala en Tiled con el map-starter-kit.
3. Crea sus áreas con el nombre convenido y configura los permisos por tag en el editor de mapas (restringida, megáfono, grabación, aforo).
4. Si tiene comportamiento, añádelo en `campus-map/src/main.ts`.

**Añadir un NPC**

1. Crea un área `npc-<nombre>`.
2. Muestra el saludo con `@workadventure/npc-dialog-box`.
3. Si es un agente, abre el panel de chat con `WA.nav.openCoWebSite(url, true)` y sigue el contrato **C2** de `CONTRATOS.md`.

**Añadir un terminal o minijuego**

1. Crea un área `terminal-<juego>` y ábrelo con `WA.ui.modal.openModal({ src, allowApi: true })` o como co-website al pulsar espacio.
2. Para el diseño visual, usa la skill `racks-html-ejemplos`.
3. Para el resultado, sigue el contrato **C3**. Para los premios, la skill `racks-economia`.

**Avatares**

- **Formato:** 96×128, 3×4 fotogramas de 32×32, con las filas abajo, izquierda, derecha y arriba.
- **Variantes:** salen de una plantilla con `racks/tools/avatar-recolor.mjs`.
- **Validación:** `avatar-check.mjs`.

**Multijugador**

| Pieza | Para qué |
|---|---|
| `WA.state` | Estado compartido de sala. Hay que declarar la variable en el mapa |
| `WA.player.state` | Datos de cada jugador (públicos o privados) |
| `WA.event` | Mensajes en vivo |
| Room API | Mensajes desde el servidor |

Solo sirve para juegos por turnos o de ritmo humano.

## Referencia de la API de WorkAdventure

En el propio repo: `docs/developer/map-scripting/references/*.md` (ui, room, player, players, state, event, nav, controls, camera, sound, spaces) y los ejemplos de `maps/tests/`. La web `docs.workadventu.re` puede no responder desde algunos entornos: usa la copia del repo.
