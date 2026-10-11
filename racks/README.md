# Campus virtual Racks University

El campus es una instancia **autoalojada de WorkAdventure** en `campus.racks.university`, conectada por SSO a la academia (`learn.racks.university`).

- **Para qué:** comunicación de la comunidad, directos, mentorías, práctica en compañía y gamificación.
- **Qué no es:** un producto que se venda (licencia AGPL + Commons Clause, ver `PLAN-INCORPORACION.md` §Fase 0).

> **Estado (2026-10-11):** está todo diseñado, documentado y con las herramientas listas; **falta montarlo**.
>
> - **Ya hecho:** el puente SSO / Admin API, en `academy-routes`, rama `feat/campus-workadventure-sso`, **sin fusionar** y sin probar contra un WorkAdventure real.
> - **Pendiente:** no hay servidores, ni mapa, ni piezas gráficas todavía.

## Índice

| Documento | Para quién | Qué contiene |
|---|---|---|
| [PLAN-INCORPORACION.md](PLAN-INCORPORACION.md) | Todos | Visión, fases, SSO con Logto, licencia, costes |
| [PRIORIZACION.md](PRIORIZACION.md) | Dirección | Qué es más fácil y más útil. Diseño del agente con Hermes |
| [campus-map/PLANO.md](campus-map/PLANO.md) | Contenido y diseño | Distritos y salas según las aulas reales de Racks |
| [campus-map/EXPERIENCIAS.md](campus-map/EXPERIENCIAS.md) | Contenido y desarrollo | Minijuegos, iframes, multijugador, rutas |
| [INSPIRACION.md](INSPIRACION.md) | Todos | Librerías, comunidad, casos reales (rC3, Rennes, L'Aquila) |
| [AVATARES.md](AVATARES.md) | Diseño y desarrollo | Avatares por alumno: formato, caminos, desbloqueos |
| [branding/BRIEF-DISENO.md](branding/BRIEF-DISENO.md) | **Diseño** | Todas las piezas gráficas, por prioridad, con su especificación |
| [CUSTOMIZACION.md](CUSTOMIZACION.md) | Desarrollo | Catálogo de ajustes: `.env`, Admin API, mapa, código |
| [CONTRATOS.md](CONTRATOS.md) | **Desarrollo** | Diseño cerrado de lo que falta programar (C1–C6) |
| [deploy/DESPLIEGUE.md](deploy/DESPLIEGUE.md) | **Sistemas** | Despliegue en 2 servidores (IONOS), paso a paso |
| [COMPARATIVA-HOSTING.md](COMPARATIVA-HOSTING.md) | Dirección y sistemas | IONOS, Hetzner, DigitalOcean, AWS |
| [PRUEBA-LOCAL.md](PRUEBA-LOCAL.md) | Desarrollo | Levantarlo todo en un Mac y la checklist de pruebas |
| [campus-map/README.md](campus-map/README.md) | Contenido | Cómo construir y subir el mapa. Script en `campus-map/src/main.ts` |
| [tools/README.md](tools/README.md) | Diseño y desarrollo | `avatar-check` y `avatar-recolor` (probados con los avatares reales) |
| [skills/racks-campus/SKILL.md](skills/racks-campus/SKILL.md) | Claude | Skill para trabajar en el campus con todo este contexto |

Ficheros de configuración: [env.racks.example](env.racks.example), [deploy/campus/docker-compose.racks.yaml](deploy/campus/docker-compose.racks.yaml), [deploy/media/](deploy/media/) y [docker-compose.racks-logto.yaml](docker-compose.racks-logto.yaml) (Logto en local).

## Hoja de ruta

### Fase 0: decisiones (antes de gastar)

- [ ] Confirmar el uso interno sin venta del campus (opcional: correo informativo a hello@workadventu.re).
- [ ] Elegir los tilesets: LimeZu (de pago, confirmando la licencia), LPC (gratis, con atribución) o propios. Ver `BRIEF-DISENO.md`.
- [ ] Decidir quién mantiene los servidores. Salen versiones cada mes; actualizar lleva 1–2 horas.

### Fase 1: probar en local (1 semana)

- [ ] Levantar WorkAdventure en el Mac (`PRUEBA-LOCAL.md` §1–3) y pasar la checklist.
- [ ] Probar el SSO con un Logto local (§4.1).
- [ ] Probar el puente de la academia en local: `ADMIN_API_URL` → `localhost` (`src/lib/campus/AGENTS.md`, "Probar en local").

### Fase 2: producción mínima (2–3 semanas)

- [ ] Contratar 2 VPS (IONOS VPS XL) y configurar el DNS (`deploy/DESPLIEGUE.md` §1–2).
- [ ] Servidor B (LiveKit + Coturn) y servidor A (campus) (§4–5).
- [ ] App de Logto y `OPENID_*` (§7). Exigir email verificado en Logto.
- [ ] Academia, que hay que **pedir explícitamente**:
  - revisar y fusionar el puente;
  - migrar `campus-virtual` en test y en producción;
  - conceder `campus-virtual` a los planes en el panel;
  - configurar las variables `WORKADVENTURE_*` en Vercel.
- [ ] Diseño: bloque 1 del `BRIEF-DISENO.md` (logos y tilesets del MVP).
- [ ] Mapa MVP: recepción, auditorio, cafetería y pasillo de mentorías, con scripting-api-extra y un NPC guía.
- [ ] Primer directo en el auditorio y primera mentoría en un despacho.

### Fase 3: lo que os diferencia (1–2 meses)

- [ ] **Profe Byte**, el agente del campus (contrato C1 + C2).
- [ ] **Feria de proyectos** y demo day mensual.
- [ ] **Avatares Racks** por capas y recoloreado (bloque 2 del briefing, contrato C4).
- [ ] Distrito IA completo (`PLANO.md` §3).

### Fase 4: gamificación y profundidad

- [ ] Quiz show en el auditorio (C3 + C6).
- [ ] Terminales con los ejemplos interactivos de learn (C3).
- [ ] Puertas de ruta (C5) y pasaporte con insignias.
- [ ] Reto "tu bot en el campus" con n8n.
- [ ] Distritos de Negocio y Finanzas, y escape rooms por aula.
- [ ] MCP del campus (C6).

## Riesgos abiertos (para no olvidarlos)

| Riesgo | Dónde se trata |
|---|---|
| El puente no se ha probado contra un WorkAdventure real | Fase 1, `PRUEBA-LOCAL.md` |
| El email sin verificar en Logto permitiría suplantar a un alumno en el campus | `PLAN-INCORPORACION.md` §3.5. Exigir verificación en Logto |
| Los vCores compartidos de IONOS en clases grandes | `COMPARATIVA-HOSTING.md`. Mover solo el servidor B a uno dedicado |
| Licencias de tiles y sprites | `BRIEF-DISENO.md`. `LICENCIAS.md` desde el día 1 |
| El coste del agente IA | `CONTRATOS.md` C2. Topes por alumno y día |
