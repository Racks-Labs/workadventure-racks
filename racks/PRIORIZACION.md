# Priorización: qué es más fácil y qué es más útil

Escala de 1 a 5. **Facilidad** 5 = sin código, solo mapa y configuración. **Utilidad** 5 = cambia la experiencia del alumno.

| # | Idea | Facilidad | Utilidad | Qué hace falta |
|---|---|:-:|:-:|---|
| 1 | **Directos en el auditorio** con megáfono, encuestas y preguntas nativas | 5 | 5 | Mapa y el `meetingUrl` del directo. Cero código |
| 2 | **Mapa MVP** con puertas y timbres (scripting-api-extra) y un **NPC guía** en recepción (npc-dialog-box) | 5 | 3 | Mapa y script. Sin backend |
| 3 | **Mentorías y evaluación de retos en despachos** (sustituye a Google Meet) | 4 | 4 | Mapa y el `meetingUrl` de la reserva |
| 4 | **Feria de proyectos / stands** con la web o el bot de cada alumno embebido | 4 | 4 | Mapa y webs embebidas; demo day con encuestas |
| 5 | **Puertas abiertas** (captación) con visita guiada por un NPC | 4 | 4* | Mapa público y NPC. *Útil para el negocio más que para el alumno |
| 6 | **Tutor IA con cuerpo** (Hermes o el tutor RAG) | 3 | 5 | NPC, chat embebido y **un proxy en servidor** (ver abajo) |
| 7 | **Quiz show** en el auditorio con preguntas de los tests | 3 | 4 | Script, panel en pantalla y lectura de preguntas de la academia |
| 8 | **Terminales** con los ejemplos HTML que ya tiene learn | 3 | 3 | Publicarlos en un dominio que se pueda embeber |
| 9 | **Pasaporte e insignias** (solo en el campus, sin XP) | 3 | 3 | Variables de jugador persistentes |
| 10 | **MCP del campus** (anuncios, puertas y quiz desde Claude) | 3 | 2 | Envolver la Room API. Es una herramienta del equipo, no del alumno |
| 11 | **Reto "tu bot en el campus"** con n8n | 2,5 | 5 | Room API, un webhook por alumno y el reto en learn |
| 12 | **Rutas como edificios** (la puerta se abre al completar la fase) | 2 | 4 | Webhook de la academia → receptor → Room API |
| 13 | **Cabina de cold calling** con voz IA | 2 | 4 | Terminal con micrófono, ElevenLabs y evaluación |
| 14 | **Escape room por aula** | 2 | 4 | Mucho diseño de puzzles y mapa |
| 15 | **XP o RacksCoins por jugar** | 2 | 3 | Endpoint en la academia, token de sala y precio fijado con `racks-economia` |
| 16 | **Mercado simulado** multijugador | 1,5 | 3 | Lógica de juego compleja |

## Orden recomendado

1. **Ya (semana 1–2, sin código):**
   - **(1) Directos**: se hacen en el auditorio.
   - **(2) Mapa MVP con NPC guía**: da vida al campus el primer día.
   - **(3) Mentorías**: se hacen en los despachos.
2. **Primer diferencial (semanas 3–4):** **(6) Tutor IA con cuerpo** y **(4) Feria de proyectos.**
3. **Engagement:** **(7) Quiz show**, **(9) Pasaporte** y **(11) Reto del bot.**
4. **Integración profunda:** **(12) Rutas como edificios**, **(15) XP**, **(13) Cold calling** y **(14) Escape rooms.**

---

## El agente del campus con Hermes

[Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server) (Nous Research, open source; se enseña en el Aula Developers, módulo "Hermes: un arnés por dentro"):

- **Expone una API compatible con OpenAI:** `hermes gateway` → `POST /v1/chat/completions`, puerto 8642.
- **Streaming:** devuelve SSE, más un evento propio de progreso de herramientas (`hermes.tool.progress`).
- **Clave:** con `API_SERVER_KEY`, que es obligatoria si escucha fuera de localhost.

### Arquitectura

```
 alumno se acerca al NPC "Profe Byte" (npc-dialog-box + área)
        │  pulsa espacio
        ▼
 co-website: https://tutor.racks.university/chat?distrito=ia      ← chat propio (HTML), allowApi: true
        │  lee WA.player.userRoomToken / name / tags
        ▼
 proxy en servidor (Next o pequeño servicio)
   · verifica el userRoomToken (es nuestro HMAC: sabe quién es el alumno)
   · límite de mensajes por alumno y día
   · añade el system prompt del distrito y el contexto del alumno
   · guarda la API_SERVER_KEY de Hermes (NUNCA en el navegador)
        │
        ▼
 Hermes (en el VPS de media o en uno propio) → modelo (Claude, etc.) + herramientas
```

### Reglas, la mayoría sacadas del propio módulo de Hermes

1. **La clave de Hermes nunca va al navegador.** Siempre pasa por el proxy, que además pone los límites. Si no, cualquiera gasta tu cuota.
2. **Para el público, un Hermes de "solo hablar".** Sin shell, sin escribir ficheros y sin herramientas con efectos. Lo explica el módulo ("Antes de darle las llaves"): un agente que habla con desconocidos sufre **inyección de prompt**, y eso no se arregla con un filtro, sino quitándole las llaves.
3. **La memoria es el punto delicado.** Hermes tiene memoria persistente y está pensado como agente **de una persona**. Con cientos de alumnos hablando al mismo agente hay que evitar que se mezclen los recuerdos: lo que cuenta un alumno no debe salir en la conversación de otro.
   - **Opción A:** sin memoria en el NPC público.
   - **Opción B:** una sesión o perfil por alumno, si Hermes lo soporta en vuestra versión. **Hay que comprobarlo.**
4. **Un NPC por distrito** (finanzas, agentes, bots…), cada uno con su system prompt. Puede ser el mismo Hermes con perfiles distintos.
5. **Que sepa del contenido de Racks.** Hermes puede conectarse a herramientas. La opción natural es darle acceso de **solo lectura** al catálogo (por ejemplo, la superficie `catalog` del MCP de Racks, o el tutor RAG `api-rag-educativa`), para que recomiende la clase concreta: "esto lo tienes en n8n Parte 2, clase 4". **Hay que comprobar** cómo conecta Hermes con MCP en la versión que instaléis.
6. **Coste:** cada mensaje cuesta tokens del modelo. Pon topes por alumno y día en el proxy y mide el uso las primeras semanas.

### Hermes o el tutor RAG que ya tiene la academia

| | Tutor RAG de la academia | Hermes |
|---|---|---|
| Sabe del contenido de las clases | ✅ Sí (está hecho para eso) | Solo si se le conecta al catálogo |
| Herramientas, subagentes, tareas programadas | ❌ | ✅ |
| Ya integrado con la identidad del alumno | ✅ (JWT por alumno) | Hay que hacerlo en el proxy |
| Valor pedagógico extra | — | **El alumno usa en el campus el mismo arnés que aprende a montar en el Aula Developers** |

**Recomendación:**

- **Para responder dudas del temario:** el tutor RAG.
- **Para "el agente del Lab de Agentes":** Hermes, que hace cosas, enseña cómo trabaja y sirve de demo viva de lo que se aprende.

Se pueden tener los dos en NPC distintos.
