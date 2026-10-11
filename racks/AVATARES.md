# Avatares personalizados por alumno

Cómo hacer que cada alumno tenga **su** personaje en el campus, adaptado a lo suyo: su marca, su plan, sus logros o su aspecto.

## 1. Cómo funciona un avatar en WorkAdventure (verificado en el código)

**El formato** (`play/src/front/Phaser/Entity/PlayerTexturesLoadingManager.ts` y `Player/Animation.ts`):

- Es un **PNG de 96×128 px**: una rejilla de **3 columnas × 4 filas** de fotogramas de **32×32**.
- **Filas, en este orden:** 1 = andar **hacia abajo**, 2 = **izquierda**, 3 = **derecha**, 4 = **arriba**.
- **Columnas:** 3 fotogramas del paso. La animación es 0-1-2-1, y el del **centro** es el de estar quieto.
- **Fondo transparente.**

**Dos tipos de textura:**

- **Woka completo:** el personaje entero en un solo PNG.
- **Por capas:** `body`, `eyes`, `hair`, `clothes`, `hat` y `accessory` se **superponen** en ese orden. Cada capa es otro PNG de 96×128, transparente salvo su pieza, alineada en la misma rejilla.

**Quién decide qué avatares hay** (con la Admin API activa, que es nuestro caso):

- **`GET /api/woka/list`:** el puente de la academia devuelve el catálogo. **WorkAdventure le pasa quién es el alumno** (`uuid`), así que **el catálogo puede ser distinto para cada persona**.
- **`GET /api/room/access`:** el puente valida la elección y devuelve las URLs de las texturas que se van a pintar. Es decir, **la academia tiene la última palabra** sobre con qué avatar entra cada alumno.

> Hoy el puente (`academy-routes`, rama `feat/campus-workadventure-sso`) sirve **el mismo catálogo a todos** e ignora el `uuid`. Personalizarlo por alumno es el cambio que queda pendiente en la academia (§4).

**Dónde alojar las imágenes:** **en el propio dominio del campus** (por ejemplo, subidas a map-storage y servidas desde `https://campus.racks.university/map-storage/avatares/...`).

- **Por qué:** el juego dibuja con WebGL, y una imagen de **otro dominio** sin las cabeceras CORS correctas no se puede usar como textura. Ese es el típico "mi avatar sale invisible".
- **La alternativa:** servirlas desde otro dominio (el Blob de la academia, por ejemplo). En ese caso hay que comprobar que responde con `Access-Control-Allow-Origin`.

## 2. Tres caminos para "adaptarlos a sus cosas"

### Camino A: capas de Racks y recoloreado (el más fácil y fiable) ⭐

Diseño crea **una vez** un set de capas con identidad Racks:

| Capa | Ejemplos |
|---|---|
| `clothes` | Sudadera Racks en el color de cada plan, camiseta de la cohorte "Reto 90 días", traje para el Distrito Finanzas |
| `hat` | Gorra con el logo, casco de "builder" para Developers, auriculares de podcaster para Audiovisual |
| `accessory` | Portátil, micrófono, gráfico de bolsa, moneda RacksCoin, robot mascota para Bots |

Y **se recolorean automáticamente** (cambio de paleta) con los colores de la marca de cada alumno:

- **Cómo:** el alumno elige sus 2 colores en su perfil de learn y un script genera sus PNG.
- **Herramienta:** con `sharp`, que la academia ya usa.

**Ventajas:** el resultado se ve siempre bien, la animación al andar es la de la base (no hay que dibujarla) y se genera al instante. **Inconveniente:** no se parece a la cara del alumno.

### Camino B: el alumno diseña su avatar (como reto)

- **El reto:** un **reto del Aula Audiovisual**, "Diseña tu avatar del campus". El alumno dibuja su PNG de 96×128 con herramientas gratuitas como [Piskel](https://www.piskelapp.com) o Aseprite, o parte de una plantilla Racks, y lo sube como entrega.
- **La comprobación automática:** que sea PNG, que mida 96×128 exactos, que tenga fondo transparente y que pese poco.
- **La aprobación:** un mentor, o la evaluación por pares que ya existe, lo aprueba. Al aprobarse aparece **solo en su catálogo**.
- **Variante:** usar la IA de imagen que ya se enseña (ChatGPT Image, Nano Banana, Freepik) para hacer el boceto y luego ajustarlo a píxel. Es aprendizaje aplicado de esas aulas.

**Ventajas:** es suyo de verdad, da comunidad (galería de avatares) y es contenido de aprendizaje. **Inconveniente:** requiere moderación, porque es contenido de usuario.

### Camino C: avatar generado desde su foto con IA (el más vistoso, el menos fiable)

1. El alumno sube una foto o se describe.
2. Un modelo de imagen genera la cabeza y el pelo en pixel art, vistos de frente, de lado y de espaldas.
3. Se **pegan sobre el cuerpo base animado** del camino A. No se pide a la IA la animación completa, porque los modelos actuales **no mantienen bien la coherencia** entre los 12 fotogramas.

**Ventaja:** el efecto "¡soy yo!". **Inconvenientes:**

- **Coste y calidad irregulares:** cada generación cuesta y el resultado varía mucho.
- **Fotos de personas = datos personales:** hace falta consentimiento y no guardar la foto.
- **Moderación.**

**Recomendación:** empezar por **A**, sumar **B** como reto y dejar **C** como experimento.

## 3. Avatares que se ganan (unen el campus con la academia)

Como el puente decide el catálogo de cada alumno, los avatares pueden **desbloquearse**:

| Cómo se gana | Ejemplo |
|---|---|
| Por **plan** | La sudadera dorada solo para planes premium |
| Por **cohorte** | Camiseta "Reto 90 días · Octubre 2026" |
| Por **logro** | Al terminar el Aula Bots, el accesorio robot. Con el certificado de una ruta, la toga |
| En la **tienda**, con RacksCoins | Sombreros y mascotas como productos canjeables. Ya existe la tienda: sería un nuevo tipo de producto. El precio se fija antes con la skill `racks-economia` |
| Por **eventos** | Gorro de Navidad durante diciembre, insignia del demo day |

Esto convierte el avatar en el **escaparate del progreso** del alumno, visible para todos los que se cruza en el campus.

## 4. Qué haría falta en la academia (pendiente: no se ha tocado)

1. **Una tabla de texturas por alumno:** usuario, id, capa, URL, estado (pendiente / aprobado) y origen (reto, tienda, logro, generado).
2. **`/api/woka/list`:** catálogo global, más lo desbloqueado o propio de **ese** alumno (usando el `uuid` que manda WorkAdventure).
3. **`/api/room/access`:** validar también contra las texturas de ese alumno.
4. **Un generador (camino A):** sus colores + capas base → PNG por alumno, subidos al dominio del campus.
5. **Un comprobador de PNG (camino B),** dentro del flujo de entrega del reto.

## 5. Para diseño: especificación de una capa

> Especificación completa, lista de piezas y herramientas: [`branding/BRIEF-DISENO.md`](branding/BRIEF-DISENO.md) y [`tools/README.md`](tools/README.md) (`avatar-check` y `avatar-recolor`, ya probados).


- **Formato:** PNG RGBA de **96×128**, fondo transparente.
- **Contenido:** solo la pieza (por ejemplo, la gorra), en la **misma posición** que la cabeza del cuerpo base, en los 12 fotogramas.
- **Base de trabajo:** los PNG de `play/public/resources/customisation/` o `characters/pipoya/` de este repo, que ya traen la animación correcta.
- **Licencias:** si se parte de los PNG de Pipoya o LPC, hay que respetar su licencia y atribución. Guardad un registro de licencias (ver `INSPIRACION.md`).
