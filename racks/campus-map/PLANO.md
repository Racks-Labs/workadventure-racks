# Plano del campus Racks University

Diseñado a partir del **catálogo real de aulas** (consultado el 2026-10-10) y de lo que Racks ya tiene:

- **Aprendizaje:** directos, mentorías, retos con evaluación en vivo, casos de éxito, ranking.
- **Comunidad:** tienda de RacksCoins y foro.
- **Recursos:** galería de prompts, plantillas n8n y skills.

**Idea central:** el campus no sustituye a learn. Es el sitio **donde se hace en compañía** lo que en learn se hace solo.

- **Las clases se ven en learn.** En el campus se practica, se pregunta, se presenta y se hace networking.
- **Cada sala tiene un motivo para ir a una hora concreta:** un directo, unas office hours o un reto en vivo. Si no, se queda vacía.

```
                         ┌──────────────── AUDITORIO ────────────────┐
                         │  escenario (megáfono) · gradas · backstage │
                         └─────────────────────┬──────────────────────┘
 ┌──── DISTRITO IA ─────┐          ┌──── PLAZA CENTRAL ────┐          ┌─── DISTRITO FINANZAS ──┐
 │ Lab de Agentes       │          │ Recepción / bienvenida│          │ Sala de Mercados       │
 │ Fábrica de Bots      │◄────────►│ Muro de casos de éxito│◄────────►│ Despacho Patrimonio    │
 │ Estudio Audiovisual  │          │ Ranking · Tienda      │          │ Clínica de Deudas      │
 │ Garaje Developers    │          │ Cafetería networking  │          │ Mesa Fiscal y Legal    │
 │ Taller Webs & SaaS   │          └───────────┬───────────┘          │ Búnker Cripto          │
 │ Sala de Datos        │                      │                      └────────────────────────┘
 └──────────────────────┘          ┌───── DISTRITO NEGOCIO ─────┐
                                   │ War room Reto 90 días      │
   BIBLIOTECA (silencio)           │ Box de Pitch · Call center │
   COWORKING (deep work)           │ Agencia Triple A · Freelance│
   PASILLO DE MENTORÍAS (1:1)      └────────────────────────────┘
```

## 1. Plaza central (para todos)

| Sala | Para qué | Mecánica de WorkAdventure | Enlace con Racks |
|---|---|---|---|
| **Recepción** | Primer día: dónde está cada cosa | Entrada por defecto, tutorial y mensaje de bienvenida del script | Abre el módulo "Primeros Pasos / Onboarding" en learn |
| **Muro de casos de éxito** | Inspiración: alumnos que lo han conseguido | Carteles con "abrir web" | `/success-cases` |
| **Ranking** | Ver la clasificación de la edición | Pantalla con "abrir web" | `/community/ranking` |
| **Tienda** | Canjear RacksCoins | Mostrador con "abrir web" | `/store` |
| **Cafetería** | Networking libre | Burbujas espontáneas, **sin** área de reunión | El foro para seguir la conversación |
| **Tablón** | Próximos directos y retos | Cartel; el script puede mostrar el siguiente directo (fase 3) | `/live` |

## 2. Auditorio (el corazón)

| Zona | Para qué | Mecánica |
|---|---|---|
| **Escenario** | Directos (DIRECTO/TEMATICO), masterclasses y demo days | **Megáfono** solo para el tag `mentor`; el resto escucha y pide turno con la mano levantada |
| **Gradas** | Público | Área de escucha: sin cámara obligatoria, chat de sala |
| **Backstage** | El ponente prepara y prueba la cámara | Área restringida a `mentor` |
| **Grabación** | Para subir luego el directo a learn (`recordingUrl`) | Derechos de grabación: `mentor` (cuando se active Egress + S3) |

**Uso:** el `meetingUrl` de un directo apunta a `…/~/campus.wam#auditorio`, y el alumno aparece directamente en las gradas.

## 3. Distrito IA (Racks Academy)

| Sala | Aulas que la alimentan | Qué se hace dentro |
|---|---|---|
| **Lab de Agentes** | LLMs (Agentes desde cero, Skills), Automatizaciones (Ingeniería de agentes, MCP a fondo), Developers (Hermes) | Office hours de agentes; **pizarra tldraw** para dibujar arquitecturas; pantalla compartida para depurar |
| **Fábrica de Bots** | Aula Bots (WhatsApp, Builderbot, Botpress, VAPI, Eleven Agents, Chatwoot) | Mesas de 4 para montar el bot entre compañeros. "Demo del viernes": cada uno enseña su bot |
| **Estudio Audiovisual** | Audiovisual (Midjourney, Freepik, HeyGen, Suno, IAs de vídeo, influencers IA) | **Galería** de trabajos de alumnos (cuadros con "abrir web"), sala de crítica en grupo y plató con grabación |
| **Taller de Automatizaciones** | n8n (1–3, Agentes, RAG, VPS), Make, Zapier | Mesas por herramienta; acceso a las **Plantillas n8n** |
| **Garaje Developers** | Developers, Formación Principal (MVP full-stack), Refuerzo (Git, React, TypeScript, ciberseguridad) | Pair programming 1:1; pizarra para diagramas |
| **Taller Webs & SaaS** | Webs (Framer, v0, SEO), SaaS, Google AI Studio | Revisión de webs de alumnos en pantalla grande |
| **Sala de Datos** | Análisis de Datos (Sheets, Appscript, Power BI, NocoDB) | Mesas de trabajo con pantalla compartida |
| **Biblioteca de prompts** | LLMs, Galería de prompts | Zona silenciosa y quiosco de la **Galería de prompts** |

## 4. Distrito Negocio

| Sala | Aulas | Qué se hace dentro |
|---|---|---|
| **War room · Reto 90 días** | Reto de 90 días | Sala **de la cohorte** (restringida a `edicion-…`): stand-up semanal, tablero de avance y accountability |
| **Box de Pitch** | Pitch Expert, Triple A (Oferta, tickets altos) | Escenario pequeño con megáfono, por turnos. El público vota con "decir" o reacciones |
| **Call center** | Cold Calling, Semana 8 | Cabinas de 2 personas para **role-play de llamadas** (aforo 2) |
| **Agencia Triple A** | Aula Triple A | Mesas de "clientes" y "agencia" para simular la venta |
| **Rincón Freelance** | Aula Freelance, Presencia en LinkedIn | Revisión de perfiles y portfolio entre pares |

## 5. Distrito Finanzas (Racks Finance)

| Sala | Aulas | Qué se hace dentro |
|---|---|---|
| **Sala de Mercados** | Inversión básica y avanzada | Pantalla grande y tertulia de mercado semanal: "qué ha pasado y por qué no hay que tocar la cartera" |
| **Despacho Patrimonio** | Patrimonio, Ahorro | Sesiones de presupuesto en grupo pequeño. Enlace al **Perfil financiero** |
| **Clínica de Deudas** | Deudas, Legal | Salas **bloqueables** de 2–3 personas: es un tema delicado y tiene que haber privacidad |
| **Mesa Fiscal y Legal** | Fiscalidad, Legal | Office hours de temporada (campaña de la renta) |
| **Búnker Cripto** | Cripto | Sala de debate. Un cartel fijo de seguridad: "nunca compartas tu seed" |
| **Finanzas para emprendedores** | FPE (estados financieros, pricing) | Revisión de números del negocio de cada uno, en mesas de 4 |

## 6. Salas transversales

| Sala | Para qué | Mecánica |
|---|---|---|
| **Pasillo de mentorías** | Mentorías 1:1 (`MENTORIA`) y evaluación de retos en vivo (`COMMUNITY_LIVE`) | Despachos con **aforo 2–3, bloqueables**. **Alternativa a Google Meet**: el `meetingUrl` de la reserva puede ser `…#mentoria-3` |
| **Sala de evaluación de retos** | Evaluación entre pares en vivo | Mesas de 3: autor y dos evaluadores, más pizarra |
| **Coworking** | Deep work acompañado | Área silenciosa; el script puede lanzar pomodoros de 25/5 (fase 3) |
| **Biblioteca** | Estudio | Silenciosa, sin vídeo |
| **Zona staff** | Equipo | Restringida a `admin` |

## Quién entra a qué (tags)

| Zona | Restricción propuesta |
|---|---|
| Plaza, auditorio (gradas), cafetería, biblioteca y coworking | Cualquiera con `campus-virtual` |
| Distrito IA | `plan-racks-academy` (y los planes que lo incluyan) |
| Distrito Finanzas | El plan de Racks Finance (el slug real se ve en `/api/room/tags`) |
| War room del reto | `edicion-<cohorte>` |
| Backstage y escenario | `mentor` |
| Zona staff | `admin` |

**Restringir sin esconder:** dejar las puertas de los distritos **visibles pero cerradas** a quien no tiene el plan. Ver el campus entero es el mejor escaparate para una subida de plan. Con un cartel en la puerta: "Esto es el Distrito Finanzas · Incluido en Racks Finance".

## Limitación técnica: abrir learn desde el campus

Hoy **learn.racks.university no se deja embeber**: envía `X-Frame-Options: DENY`. Así que los carteles que llevan a learn (clases, tienda, ranking, casos de éxito) tienen que abrirse **en una pestaña nueva**, no dentro del campus. Si en el futuro se quiere verlos como panel lateral sin salir, hay que permitir `frame-ancestors https://campus.racks.university` en learn. Es un cambio en `academy-routes`, que queda para cuando se retome.

## Ideas de gamificación (fase 3, requieren código)

- **Puertas que se abren con el progreso:** al completar un módulo se abre su sala avanzada (webhook `MODULE_COMPLETED` → Room API).
- **Pasaporte del campus:** XP o RacksCoins por asistir a un directo o a unas office hours. Antes, pasar por la skill `racks-economia` para no inflar la economía.
- **Insignias en el avatar:** accesorios de Wokas exclusivos al terminar un aula o un reto.
- **Demo day mensual** en el auditorio, con el ranking en pantalla.

## Por dónde empezar (MVP)

No hace falta construirlo todo a la vez. Orden recomendado:

1. **Recepción + auditorio + cafetería + pasillo de mentorías.** Ya da valor el primer día: directos y mentorías sin Google Meet.
2. **Distrito IA**, con Lab de Agentes y Fábrica de Bots. Son los temas con más comunidad.
3. **Distrito Finanzas** y **Distrito Negocio**.
4. Gamificación.
