# Inspiración: ecosistema, comunidad y lo que otros han construido con WorkAdventure

Investigación del 2026-10-10: documentación de este repo, GitHub, la web de WorkAdventure y búsquedas de casos reales.

> **Aviso sobre las fuentes:** `docs.workadventu.re` no respondió desde este entorno, así que la documentación se ha leído desde la copia del repo (`docs/`) y desde GitHub. Los casos de clientes vienen de la web de WorkAdventure, que es marketing: tómalos como inspiración, no como datos medidos.

---

## 1. Librerías y herramientas que existen

### Oficiales (WorkAdventure)

| Pieza | Qué da | Uso para Racks |
|---|---|---|
| [map-starter-kit](https://github.com/workadventure/map-starter-kit) | Plantilla de mapa con Tiled, Vite, script en TypeScript y subida a map-storage | La base del mapa del campus (`campus-map/README.md`) |
| [scripting-api-extra](https://github.com/workadventure/scripting-api-extra) | **Puertas** (que se abren solas, al pulsar o **con código numérico**, restringidas por tag), **timbres** para llamar a una sala, "action layers" genéricas | Puertas de distritos por plan, despachos de mentoría con timbre, cajas fuertes con código en los escape rooms |
| [npc-dialog-box](https://github.com/workadventure/npc-dialog-box) (MIT) | Diálogos de **NPC estilo videojuego**: avatar, nombre, texto que se escribe solo, pasos encadenados con efectos de cámara o sonido | Personajes guía en cada distrito, narrativa de misiones y onboarding |
| `@workadventure/iframe-api-typings` | Tipos de TypeScript de la API `WA.*` | Para programar scripts y minijuegos con autocompletado |
| `@workadventure/room-api-client` | Cliente de la Room API (gRPC) para servidores | Que la academia y n8n hablen con el campus |
| [openai-bot-demo](https://github.com/workadventure/openai-bot-demo) | Demo de un bot con ChatGPT que se mueve y habla en el mapa | Referencia para un tutor IA propio (ver §4) |

### Comunidad (lista [awesome-workadventure](https://github.com/workadventure/awesome-workadventure))

| Pieza | Qué da |
|---|---|
| [simple-workadventure](https://www.npmjs.com/package/simple-workadventure) | La API de `WA` reducida a comandos de una línea |
| [WA Visual Script Builder](https://github.com/klinshy/WA-visual-script-builder) | **Bloques de arrastrar y soltar** para crear scripts de mapa sin programar |
| [stepFX](https://github.com/KomponentAB/stepFX) | Sonido de pasos distinto según el suelo (madera, hierba, moqueta) |
| [Pixel bot](https://github.com/rllola/wa-bot) | Bot que conecta el mapa con otras apps (Slack…) |
| [Dynamic map server](https://github.com/jonnytest1/workadventure-mapserver) | Servidor que **genera mapas dinámicamente** |
| Mapas de ejemplo | Bosque y mercado navideños, ForumPHP, mapas de hackerspaces |

### Gráficos (tilesets)

| Fuente | Licencia | Nota |
|---|---|---|
| Tilesets LPC en [OpenGameArt](https://opengameart.org) (p. ej. "[LPC Revised] The Office") | CC-BY-SA 3.0 / OGA-BY | Gratis, pero **hay que atribuir** a los autores (se puede hacer en una página de créditos del campus) |
| [LimeZu](https://limezu.itch.io) (Modern Interiors, Modern Office) | De pago (unos pocos $) | Es el estilo "moderno" más bonito. El autor dijo en un comentario que se puede usar en WorkAdventure; **confirmadlo en la licencia** antes de usarlo |
| Los de este repo (`maps/`) | Ver `maps/tests/Attribution-tilesets.txt` | Sirven para prototipar |

**Lección aprendida por otros:** Wikimedia Alemania dejó de usar WorkAdventure por dudas sobre **la licencia de los tiles** y la privacidad. Hay que guardar el registro de licencias desde el primer tile.

### Comunidad y soporte

- **Discord oficial:** https://discord.gg/G6Xh9ZM9aR. El canal **server-sorcery** es el de instalaciones autoalojadas.
- **GitHub:** https://github.com/workadventure (issues, releases mensuales).
- **Blog:** release notes, avisos de seguridad (en 2026, una versión de seguridad en la 1.33.2) y tutoriales de bots.

## 2. ¿MCPs o skills de WorkAdventure? No existen: es una oportunidad

No he encontrado **ningún servidor MCP ni skill** para WorkAdventure. Racks ya tiene la infraestructura para hacerlos (su propio MCP con 9 superficies y skills de contenido), así que se puede ser pionero.

| Idea | Qué haría | Cómo |
|---|---|---|
| **MCP del campus** | Que Claude u otros agentes puedan anunciar en el campus, abrir y cerrar puertas, leer quién está conectado y lanzar un quiz | Envolviendo la **Room API** (`saveVariable`, `broadcastEvent`) y los endpoints de `play` (`/rooms`, `/message` con `ADMIN_API_TOKEN`). Puede ser un dominio más del MCP de Racks |
| **Skill `racks-campus`** | Que Claude diseñe salas, áreas, permisos por tag y scripts siguiendo el plano de Racks | Un `SKILL.md` con `PLANO.md`, `EXPERIENCIAS.md`, la API `WA.*` y las convenciones de nombres |
| **Skill de minijuegos** | Generar terminales HTML con el sistema de diseño de Racks, preparados para el campus (token, `allowApi`, resultado al servidor) | Ampliando la skill que ya existe, `racks-html-ejemplos` |

## 3. Lo que ya trae WorkAdventure de serie (y conviene aprovechar)

Sin programar nada:

| Función | Uso para Racks |
|---|---|
| **Encuestas y preguntas** (`docs/user/polls-and-questions.md`) | Votaciones en directo y turno de preguntas en el auditorio |
| **Levantar la mano**, **megáfono**, **mensajes globales** | Moderación de clases grandes |
| **Picture-in-picture** | Seguir el directo mientras se trabaja en otra pestaña |
| **Decir/pensar** (bocadillos), **estado de disponibilidad** | Vida social; "no molestar" en el coworking |
| **Pantalla compartida**, pizarras **Excalidraw/tldraw**, YouTube | Talleres prácticos |
| **Moverse con clic** (pathfinding), tiles animados, parallax, sonidos | Que el campus "se sienta vivo" |
| **Avisos en el móvil** (`docs/user/phone-chat.md`) | Que llegue un aviso aunque el alumno no esté en el campus |

**Lo que es solo de pago (SaaS) y no viene en la versión autoalojada:**

- los **bots de IA** nativos (OpenAI o un LLM propio), que se mueven, guían y saludan;
- el panel de administración;
- módulos *enterprise* (calendario, lista de tareas).

Para Racks no es grave: el tutor IA se puede construir con las piezas de §1 y la IA que la academia ya tiene (§4).

## 4. Lo que otros han construido (casos reales)

| Quién | Qué hicieron | Qué copiar |
|---|---|---|
| **rC3, Chaos Computer Club** (2020–2021) | Un mundo con **~20.000 personas**. Cada hackerspace (*assembly*) **construyó su propio espacio**. Añadieron **insignias** y "mundos paralelos" para repartir la carga | **Que los alumnos construyan su propio stand**, las insignias y el sentido de "nuestro mundo" |
| **Université Rennes 2** | Campus digital con **visita guiada y escape game** para presentar sus grados a estudiantes de secundaria | Escape rooms por aula y visita guiada para captar alumnos (puertas abiertas) |
| **Université de Rennes** (35.000 alumnos) | Escape games educativos en varias asignaturas; eligieron WorkAdventure frente a Gather | Escape room como evaluación divertida |
| **Univaq, Universidad de L'Aquila** (PolyGloT) | **Cada nodo de un itinerario de aprendizaje es una sala**, con una actividad por sala (individual o colaborativa) y **contenido generado con IA**. Se avanza completando salas | Es exactamente **las rutas de Racks llevadas al mapa** (`EXPERIENCIAS.md` §4) |
| Conferencias (ForumPHP) y comunidades | Stands, salas de charlas, mercadillos navideños | Eventos de temporada: demo day, feria de proyectos, Navidad |

## 5. Ideas "muy chulas" para los alumnos de Racks

Combinando lo anterior con lo que Racks enseña:

1. **Tutor IA con cuerpo en cada distrito.**
   - **Cómo es:** un NPC (`npc-dialog-box`) que, al hablar con él, abre un chat con **el tutor RAG que ya tiene la academia**. El alumno se identifica con su `userRoomToken`.
   - **Variantes:** en Finanzas sabe de finanzas y en el Lab de Agentes, de agentes. Se puede añadir **voz** con ElevenLabs, que ya está integrado.
2. **El campus como laboratorio de los propios alumnos.** Lo que se aprende en Bots y Automatizaciones **se conecta al campus**. Un reto de "construye un bot para el campus con n8n": el alumno recibe eventos de la Room API en un webhook de n8n y su agente contesta en la sala. **Sus agentes viven en el campus y los demás los usan.** Es aprendizaje real y no lo ofrece nadie.
3. **Feria de proyectos al estilo rC3.**
   - **Qué es:** cada alumno o equipo tiene un **stand** con su web, SaaS, bot o portfolio embebido en una pantalla, su vídeo y su timbre (scripting-api-extra).
   - **Cuándo:** demo day mensual en el auditorio. Los visitantes votan con las encuestas nativas.
4. **Rutas como edificios (modelo Univaq).** Cada ruta de learn es un edificio y cada fase, una planta. La puerta se abre al completar la fase en learn (webhook → Room API).
5. **Escape rooms por aula (modelo Rennes).** Por ejemplo, "La empresa endeudada" (Deudas + Fiscalidad), con caja fuerte de código, pistas repartidas entre jugadores y un NPC narrador. Sirve de **examen final divertido** del aula.
6. **Insignias y pasaporte (modelo rC3).** Un sello por directo asistido, terminal superado o escape room resuelto. Se ven en el avatar (accesorio exclusivo) y en el perfil de learn.
7. **Visual Script Builder para no programadores.** Los alumnos de Automatizaciones diseñan las interacciones de su stand con bloques. Es lógica de automatización aplicada.
8. **Ambiente:** pasos con sonido (stepFX), música suave en la cafetería, silencio en la biblioteca y eventos de temporada (Navidad, campaña de la renta en la Mesa Fiscal).
9. **Puertas abiertas para captar alumnos (modelo Rennes 2).** Un mapa público con visita guiada por un NPC y una **clase de muestra en directo** en el auditorio para quien aún no es alumno. El campus como herramienta comercial.

## 6. Siguiente paso recomendado

| Orden | Qué | Por qué |
|---|---|---|
| 1 | Montar el mapa MVP con **scripting-api-extra** (puertas y timbres) y **npc-dialog-box** (guía de recepción) | Da vida al campus el primer día, sin backend |
| 2 | **Tutor IA con cuerpo** conectado al tutor RAG | Es lo más diferencial y reutiliza IA que ya existe |
| 3 | **MCP del campus** | Permite operar el campus desde Claude (anuncios, quiz, puertas) y no existe en ningún sitio |
| 4 | **Feria de proyectos** y **reto "tu bot en el campus"** | Comunidad y aprendizaje aplicado |
