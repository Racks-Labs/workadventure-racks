# Mapa del campus Racks University

Kit para construir el mapa del campus. El mapa es lo que el alumno ve al entrar y **todavía no existe**: es el trabajo de contenido más grande del proyecto.

## Cómo se construye

1. **Clona el kit oficial** en tu Mac:

   ```bash
   git clone https://github.com/workadventure/map-starter-kit.git campus-map
   cd campus-map && npm install
   ```

2. **Sustituye su `src/main.ts`** por [`src/main.ts`](./src/main.ts) de esta carpeta. Es el script del campus:
   - botón "Ir a la academia"
   - aviso a mentores
   - mensaje al entrar en cada zona
3. **Diseña el mapa** con [Tiled](https://www.mapeditor.org/): `npm run dev` abre una vista previa en local. Los tiles son de 32×32 px; para la estética de Racks se pueden usar tilesets propios.
4. **Súbelo al campus:** ejecuta `npm run upload`. Te pide:
   - la URL de map-storage (`https://campus.racks.university/map-storage/`)
   - el token (`MAP_STORAGE_AUTHENTICATION_TOKEN`)

   Al subir un `.tmj` se genera su `.wam`.
5. **Apunta la sala de entrada** a la ruta del mapa:
   - `START_ROOM_URL=/~/<ruta>.wam` en el `.env` del campus,
   - o, con la Admin API activa, `WORKADVENTURE_START_ROOM` en la academia.

Después, el **editor integrado** (botón de construir, solo para quien tenga el tag `editor`) sirve para retocar sin volver a Tiled: mover objetos, crear áreas y cambiar sus permisos.

> El script no se ha compilado en esta sesión (no hay instalación del kit aquí). El kit trae los tipos de `WA` (`@workadventure/iframe-api-typings`): si `npm run build` se queja, ahí está el motivo.

## Plano propuesto

> Plano completo por distritos, basado en las aulas reales de Racks: [`PLANO.md`](./PLANO.md). La tabla de abajo es el núcleo mínimo (MVP).

| Área (nombre exacto) | Para qué | Configuración en el editor de mapas |
|---|---|---|
| `recepcion` | Punto de entrada, carteles y enlaces | Entrada por defecto (*start*). Área "abrir web" con `https://learn.racks.university` |
| `auditorio` | Directos y masterclasses | **Megáfono** con derechos para el tag `mentor`. **Grabación**: derechos para `mentor`. Área de reunión LiveKit |
| `aula-1`, `aula-2`… | Clases en grupo | Áreas de reunión. Si un aula es de un programa: **área restringida** a `plan-<slug>` o `edicion-<slug>` |
| `mentorias` | 1 a 1 con mentor | Varias salas pequeñas, cada una con **aforo** de 2–3 y **bloqueable** |
| `cafeteria` | Social | Burbujas libres (sin área de reunión) |
| `biblioteca` | Estudio | **Área silenciosa** (no abre burbujas de vídeo) |
| `zona-staff` | Equipo | Área restringida a `admin` |

Los nombres del script ([`src/main.ts`](./src/main.ts), constante `AREAS`) tienen que coincidir con los del mapa.

## Tags disponibles para permisos

Los pone el puente de la academia en cada conexión (ver `src/lib/campus/AGENTS.md` en `academy-routes`):

| Tag | Quién |
|---|---|
| `admin` | Admin (modera todo y siempre puede grabar) |
| `editor` | Admin (editor de mapas) |
| `mentor` | Profesores, mentores e instructores (y los admin) |
| `plan-racks-academy`, `plan-genia`… | Según sus planes activos (slug del nombre del plan) |
| `edicion-…` | Según su cohorte |

## Referencia

- **Áreas** (qué hace cada tipo): `docs/map-building/inline-editor/area-editor/` en este repo.
- **Scripting API** (`WA.*`): `docs/developer/map-scripting/`.
- **Ejemplos de mapas con scripts**: `maps/tests/` y `maps/starter/`.
