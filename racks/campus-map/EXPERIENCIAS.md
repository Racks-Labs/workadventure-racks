# Experiencias, minijuegos y retos dentro del campus

Investigación de lo que WorkAdventure permite, más ideas concretas basadas en el contenido de Racks.

**Respuesta corta: sí.** Se pueden abrir webs propias dentro del campus como si el alumno se sentara en un ordenador. Esas webs pueden usar la API de WorkAdventure y hablar con la academia para dar XP.

Fuentes: `docs/developer/map-scripting/references/*` y `docs/map-building/*` de este repo.

---

## 1. Las piezas técnicas (qué existe)

### Formas de meter una web (iframe)

| Pieza | Cómo se ve | Para qué sirve | API |
|---|---|---|---|
| **Co-website** | Panel lateral que se abre al pisar una zona o al pulsar espacio | El "ordenador": te sientas, pulsas espacio y se abre el minijuego | Propiedad `openWebsite` del área + `openWebsiteTrigger: onaction` / `WA.nav.openCoWebSite` |
| **Modal** | Ventana centrada, izquierda o derecha, con pantalla completa | Minijuego a pantalla completa | `WA.ui.modal.openModal({ src, allowApi, allow })` |
| **UI website** | Iframe fijo sobre la pantalla (HUD) | Marcador, temporizador, pista o brújula de la ruta | `WA.ui.website.open({ url, position, size, allowApi })` |
| **Web embebida en el mapa** | Una "pantalla" en la pared, dentro del mundo | Ranking en directo, gráfico de mercado, presentación | `WA.room.website.create(...)` / Tiled |

- **Con `allowApi: true`** (`openWebsiteAllowApi` en el mapa), el minijuego puede usar **la misma API `WA.*`**: saber quién juega, leer y escribir el estado compartido, mandar eventos o mover al jugador.
- **Con `allow`/`openWebsitePolicy`** se le dan permisos: micrófono, cámara o pantalla completa.

### Multijugador

| Pieza | Qué permite | API |
|---|---|---|
| **Variables de sala** | Estado **compartido y persistente** para todos los de la sala (puertas abiertas, marcador, turno). Se puede limitar quién lee y quién escribe **por tag** | `WA.state` (objetos de clase `variable` en el mapa) |
| **Variables de jugador** | Públicas (las ven los cercanos) o privadas, persistentes o temporales y con caducidad. Sirven para inventario, sellos del pasaporte o equipo | `WA.player.state` |
| **Eventos** | Mensajes en directo a todos o a un jugador concreto (preguntas de un quiz, "has ganado") | `WA.event.broadcast` / `RemotePlayer.sendEvent` |
| **Seguir a los jugadores** | Lista de jugadores cercanos, sus movimientos y variables | `WA.players` |
| **Equipos visibles** | Color del contorno del avatar | `WA.player.setOutlineColor` |
| **Guiar a un grupo** | Un mentor "lidera" y el resto le sigue | Follow/lead (`api-player.md`) |
| **Spaces** | Audio y vídeo de grupo **aunque estén en mapas distintos** | `WA.spaces.joinSpace` |
| **Room API (desde el servidor)** | La academia escribe variables y manda eventos a una sala, por ejemplo "fulano ha completado el módulo" | gRPC `saveVariable` / `broadcastEvent` |

### El mundo reacciona

| Pieza | Para qué | API |
|---|---|---|
| Cambiar tiles y capas | Puertas que se abren, puentes que aparecen, zonas que se iluminan | `WA.room.setTiles`, `showLayer`/`hideLayer` |
| Mover y teletransportar | Carreras, "vuelve a la casilla de salida", cinemáticas | `WA.player.moveTo`, `teleport` |
| Bloquear controles o cámara | Escenas o cuentas atrás | `WA.controls.disablePlayerControls`, `WA.camera` |
| Sonido | Efectos y fanfarria al acertar | `WA.sound` |
| Popups, banners y botones | Narrativa, avisos, botón "Mi pasaporte" | `WA.ui.*` |

### Saber quién juega, de forma segura: `userRoomToken`

`WA.player.userRoomToken` es un token que **emite nuestro puente** en `/api/room/access` (un HMAC firmado por la academia). El minijuego se lo manda a la academia, la academia lo verifica y **sabe quién es el alumno sin que nadie lo pueda falsificar**. Esa es la pieza que permite dar XP o RacksCoins, guardar progreso y personalizar el reto.

---

## 2. Ideas: "ordenadores" con retos individuales

Cada distrito tiene **terminales**. El alumno se sienta, pulsa espacio y se abre un minijuego **personalizado según su progreso en learn**.

| Terminal | Distrito | Mecánica | Contenido de Racks del que sale |
|---|---|---|---|
| **Prompt Golf** | IA | Conseguir una salida concreta de la IA con el prompt más corto. Una IA puntúa | Aula LLMs ("Aprende a hablar con la IA") |
| **Arregla el bot** | IA | Un chat de WhatsApp simulado que falla: encontrar el nodo roto del flujo | Aula Bots (Builderbot, WhatsApp, Chatwoot) |
| **Puzzle n8n** | IA | Arrastrar y conectar nodos en el orden correcto para que el flujo funcione | Aula Automatizaciones (n8n 1–3) |
| **Agente o no agente** | IA | Cartas con casos: ¿esto es un workflow, un agente o un RAG? | Agentes desde cero, n8n RAG |
| **Cabina de cold calling** | Negocio | Llamada contra un **prospecto de voz con IA**. ElevenLabs ya está integrado en la academia (tutor de voz). Al colgar, evaluación de la llamada | Cold Calling, Semana 8 |
| **Jurado de pitch** | Negocio | 60 segundos de pitch por micrófono; un jurado de IA da feedback con la rúbrica de Pitch Expert | Pitch Expert, Triple A |
| **Aguanta la caída** | Finanzas | Simulador de cartera: llega un crack y el alumno decide si vender, aguantar o aportar. Se ve el resultado a 10 años | Inversión avanzada (Caídas, Reglas de conducta) |
| **Caza la fuga** | Finanzas | Un extracto bancario ficticio: arrastrar los gastos hormiga a la papelera antes de que acabe el tiempo | Ahorro (Análisis de fugas) |
| **Escape de la deuda** | Finanzas | Elegir el orden de pago (bola de nieve frente a avalancha) y ver cuándo sales | Deudas |
| **Protege tu seed** | Finanzas | Mini escape room: detectar phishing y custodiar las claves | Cripto (Seguridad, Custodia) |
| **Auditor de seguridad** | IA/Dev | Una web vulnerable de juguete: encontrar los 3 fallos | Ciberseguridad (Refuerzo) |
| **Declaración exprés** | Finanzas | Clasificar ingresos y gastos en sus casillas | Fiscalidad |

**Reutilizar lo que ya existe:**

- **Ejemplos interactivos de las clases.** Learn ya tiene ejemplos HTML interactivos por clase (`exampleContent`: calculadoras, simuladores, checklists). Pueden ser terminales sin escribir nada nuevo.
- **Tests de módulo.** Las preguntas de los tests (`EvaluationQuestion`) sirven para un quiz en un terminal.

## 3. Ideas multijugador

| Experiencia | Cómo funciona | Piezas |
|---|---|---|
| **Quiz show en el auditorio** (tipo Kahoot) | El mentor lanza preguntas de un test del módulo y cada alumno responde en su HUD. Ranking en la pantalla del escenario. Premio al ganador | Eventos + UI website + variables de sala; preguntas desde la academia |
| **Escape room cooperativo** | 3–4 alumnos en una sala cerrada. **Cada uno ve una pista distinta** (variable de jugador privada), así que tienen que hablar por vídeo. La puerta se abre cuando el equipo resuelve | Variables de sala + `setTiles` + vídeo de la sala |
| **Hackathon por equipos** | Equipos con color de contorno, sala por equipo con Excalidraw compartido y demo final en el auditorio | `setOutlineColor`, áreas restringidas, pizarras |
| **Mercado simulado** | Cada alumno recibe 10.000 € ficticios y compra y vende "activos" entre todos en la Sala de Mercados. Los precios se mueven con la oferta y la demanda. Gana quien mejor diversifica, no quien más arriesga (es la lección) | Variables de sala como libro de órdenes + eventos |
| **Role-play de ventas por parejas** | Cabina de 2. A uno le toca carta de "cliente difícil" y al otro de "vendedor". 5 minutos y se intercambian. El cliente puntúa al vendedor | Variables de jugador privadas + temporizador en el HUD |
| **Evaluación en vivo de retos** | El autor presenta su proyecto a 2 evaluadores, que puntúan con la rúbrica del reto en un panel | Ya existe en la academia (`COMMUNITY_LIVE`); aquí cambia Google Meet por una sala del campus |
| **Visita guiada** | Un mentor "lidera" a los nuevos por el campus el primer día | Follow/lead |
| **Speed networking** | Se emparejan alumnos al azar cada 4 minutos y se les teletransporta a una mesa | Script + `teleport` |

## 4. Ideas de rutas en el campus

- **La ruta de aprendizaje, en el suelo.** Cada `Route` de learn (con sus fases) se dibuja como un **camino físico**: cada fase es una sala. **La puerta de la siguiente fase se abre cuando la completas en learn**: webhook `MODULE_COMPLETED` → Room API → la variable de la puerta pasa a `true`.
- **Pasaporte del campus.** Un sello (variable de jugador persistente) por cada sala visitada o terminal superado. Con el pasaporte completo, insignia o accesorio de avatar exclusivo.
- **Misión diaria.** Un tablón en la plaza con 3 misiones del día: "supera un terminal", "asiste al directo", "ayuda a alguien en la cafetería".
- **Ruta de onboarding.** El primer día, flechas y popups guían por recepción, auditorio, tu distrito y mentorías, y se cierra con el primer terminal.
- **Retos de cohorte.** El war room del Reto 90 días tiene un tablero compartido con el avance de cada miembro de la edición.

## 5. Cómo se construye un minijuego (arquitectura)

```
 alumno pulsa espacio en el "ordenador"
        │
        ▼
 modal/co-website  ──►  https://games.racks.university/<juego>   (web estática o Next)
        │                         │  WA.player.userRoomToken (+ WA.player.name, tags)
        │                         ▼
        │               academy: POST /api/campus/games/<juego>/result
        │                         │  verifica el token, valida el resultado EN SERVIDOR,
        │                         │  aplica topes diarios y da XP/RacksCoins
        ▼                         ▼
 WA.state / eventos         economía de Racks (racks-economia)
 (marcador de la sala)
```

**Reglas que conviene fijar desde el principio:**

1. **Dónde vive el juego.** En un subdominio de `racks.university` (por ejemplo `games.racks.university`) que permita ser embebido por `campus.racks.university`. **Learn hoy no se deja embeber** (`X-Frame-Options: DENY`), así que los juegos no pueden ser páginas de learn sin cambiar esa cabecera.
2. **El cliente no decide el premio.** Un juego en el navegador se puede trucar. La puntuación que da XP o RacksCoins se calcula o valida **en el servidor**, con topes por día. Cualquier premio se fija antes con la skill `racks-economia`, para no inflar la economía.
3. **El token de sala tiene que ser verificable.** Hoy el `userRoomToken` del puente lleva la persona y la caducidad. Para los juegos convendría **añadir la sala** que lo emitió, como hace WorkAdventure SaaS con su JWT, y que un token del campus no valga para otra cosa. Es un cambio pequeño en `academy-routes`, pendiente.
4. **Tiempo real con límites.** Las variables y los eventos de WorkAdventure sirven para juegos **por turnos o de ritmo humano**: quiz, mercado, escape room. **No** sirven para un juego de acción a 60 fps; para eso, el juego llevaría su propio servidor.
5. **Móvil.** El campus funciona en móvil, pero los terminales de arrastrar y soltar o de micrófono se diseñan pensando primero en escritorio.

## 6. Por dónde empezaría

| Orden | Experiencia | Por qué primero |
|---|---|---|
| 1 | **Quiz show en el auditorio** con preguntas de los tests | Reutiliza contenido que ya existe, es multijugador y da un motivo para ir al directo |
| 2 | **Terminales con los ejemplos interactivos** que ya hay en learn | Cero contenido nuevo; solo hay que publicarlos en un dominio embebible |
| 3 | **Puertas de ruta** (webhook → Room API) | Une el progreso en learn con el campus, que es la integración más visible |
| 4 | **Cabina de cold calling** con voz IA | La más espectacular; reutiliza ElevenLabs, que ya está integrado |
| 5 | **Escape room** y **mercado simulado** | Las más elaboradas; mejor cuando ya haya comunidad diaria |
