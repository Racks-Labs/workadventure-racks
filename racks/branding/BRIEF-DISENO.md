# Briefing para diseño: todo lo gráfico que necesita el campus

Un solo documento para pasar a diseño. Va **por orden de prioridad**: lo de arriba bloquea el lanzamiento y lo de abajo es para después.

## Bloque 1: imprescindible para abrir (MVP)

| # | Pieza | Formato | Uso |
|---|---|---|---|
| 1 | Logo Racks University horizontal | SVG + PNG transparente de ~1086×153 | Pantallas de carga, login y error |
| 2 | Isotipo cuadrado | PNG de 128×128 y 512×512 | Notificaciones, icono de la app instalable |
| 3 | Favicons | 16, 32, 192 y 512 px | Pestaña del navegador |
| 4 | Tarjeta para compartir | 1200×630 | Al pegar el enlace del campus en WhatsApp o LinkedIn |
| 5 | **Tilesets del mapa** | PNG de tiles de **32×32**, con su **licencia** | Recepción, auditorio, cafetería y despachos de mentoría (`campus-map/PLANO.md` §1, §2 y §6) |
| 6 | Carteles de las salas | PNG de 32×32 o 64×32 | Nombres de sala, flechas y "Incluido en Racks Finance" |

**Sobre los tilesets (#5),** elegid una de tres opciones:

- **(a) Comprar LimeZu** ("Modern Interiors" + "Modern Office"). Son unos pocos dólares y el estilo moderno queda muy bien. Antes, confirmad por escrito que su licencia cubre el uso en WorkAdventure.
- **(b) Usar LPC gratuitos** (CC-BY-SA). Obligan a atribuir y tienen un estilo más clásico.
- **(c) Diseñar uno propio con la estética Racks.** Es lo más caro y lo más diferencial.

**Mi recomendación es (a) para el MVP** y añadir piezas propias encima (logos en las paredes, mobiliario con colores Racks).

**Registro de licencias.** Hay que llevar desde el primer día un `LICENCIAS.md` con la fuente, la licencia y la atribución de cada tileset o sprite. Es lo que hizo que Wikimedia abandonara WorkAdventure (ver `../INSPIRACION.md`).

## Bloque 2: avatares Racks (camino A de `../AVATARES.md`)

Todas las piezas siguen la **especificación técnica** de abajo y se validan con `racks/tools/avatar-check.mjs`.

| Capa | Pieza | Variantes |
|---|---|---|
| `clothes` | **Sudadera Racks** con el logo en el pecho | **Una sola plantilla** en un rojo puro (por ejemplo `#c0392b`). Las variantes por plan y por marca las genera `avatar-recolor.mjs` |
| `clothes` | Camiseta de cohorte ("Reto 90 días") | Plantilla recoloreable |
| `clothes` | Traje o americana | Para el Distrito Finanzas o como premio |
| `hat` | Gorra Racks | Plantilla recoloreable |
| `hat` | Auriculares de podcaster | Accesorio del Aula Audiovisual |
| `hat` | Casco de builder | Developers |
| `hat` | Birrete o toga de graduación | **Premio**: certificado de una ruta |
| `accessory` | Portátil bajo el brazo | Genérico |
| `accessory` | Micrófono | Audiovisual |
| `accessory` | Robot mascota flotando | **Premio**: terminar el Aula Bots |
| `accessory` | Moneda RacksCoin | **Premio de tienda** |
| `accessory` | Gráfico de bolsa / taza de café | Finanzas / genérico |

**Truco de producción:** cada plantilla recoloreable se pinta en **un único tono saturado** con sus sombras y luces (tonos más oscuros y más claros del mismo color). Los detalles fijos, como el logo o los contornos, van en **gris, blanco o negro**, porque el recoloreado no toca los grises. Así una plantilla da infinitas variantes sin repintar nada.

## Bloque 3: después del MVP

- **NPCs:** Profe Byte (Lab de Agentes), la guía de recepción y un personaje por distrito. Cada uno con su avatar de 96×128 y un **retrato de 128×128** para el cuadro de diálogo (`npc-dialog-box`).
- **Insignias del pasaporte:** iconos de 32×32 por logro.
- **Gráficos de temporada:** Navidad, demo day, campaña de la renta.
- **Plantilla de stand** para la feria de proyectos, que cada alumno personaliza.

---

## Especificación técnica de un avatar o una capa

```
 96 px
 ┌────────┬────────┬────────┐
 │ abajo  │ abajo  │ abajo  │  fila 1   ← el central es "quieto"
 │ paso 1 │ QUIETO │ paso 2 │
 ├────────┼────────┼────────┤
 │ izq.   │ izq.   │ izq.   │  fila 2
 ├────────┼────────┼────────┤  128 px
 │ der.   │ der.   │ der.   │  fila 3
 ├────────┼────────┼────────┤
 │ arriba │ arriba │ arriba │  fila 4   (de espaldas)
 └────────┴────────┴────────┘
   cada celda 32×32
```

- **Formato:** PNG RGBA, **fondo transparente** y pixel art **sin suavizado**. Si se reescala, con "vecino más próximo".
- **Animación:** el orden es 1 → 2 → 3 → 2. La columna central es la pose quieta.
- **Capas:** cada una contiene **solo su pieza**, en la **misma posición** que en el cuerpo base y en los 12 fotogramas. Para arrancar, usad de plantilla de posición un cuerpo de `play/public/resources/customisation/character_color/` y una ropa de `character_clothes/`.
- **Peso:** por debajo de 20 KB.
- **Validación:** `node racks/tools/avatar-check.mjs --layer=<capa> fichero.png` tiene que salir con ✓.
- **Alojamiento:** las imágenes finales se sirven **desde el dominio del campus** para evitar problemas de CORS (ver `../AVATARES.md` §1).
