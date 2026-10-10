# Marca Racks en el campus

Hay dos vías. **La A es la buena**; la B sirve para salir del paso sin Admin API.

## A. Con la Admin API (recomendada)

El puente de la academia (`/api/map`, en `academy-routes/src/lib/campus/`) puede devolver estos campos. Hoy **no los rellena**: queda pendiente para cuando se retome el trabajo en la academia.

| Campo | Qué cambia | Valor para Racks |
|---|---|---|
| `loadingLogo` | Logo de la pantalla de carga | URL del logo Racks University (PNG/SVG, fondo transparente) |
| `loginSceneLogo` | Logo de la pantalla de nombre/avatar | Igual |
| `errorSceneLogo` | Logo de las pantallas de error | Igual |
| `primaryColor` / `backgroundColor` | Colores de las pantallas de configuración | Los del sistema de diseño de Racks |
| `showPoweredBy` | Sello "Powered by WorkAdventure" | `false` (ya se manda así) |
| `metatags.title` / `description` | Título de la pestaña y tarjeta al compartir | Ya se manda "Campus Racks University" |
| `metatags.favIcons` / `manifestIcons` / `themeColor` / `appName` | Favicon e icono de la app instalable (PWA) | Iconos Racks: 16, 32, 192 y 512 px |
| `metatags.cardImage` | Imagen al compartir el enlace | 1200×630 |
| `legals` | Enlaces de privacidad, términos y cookies | Las páginas legales de Racks |
| `customizeWokaScene` | Texto/imagen de la pantalla de elegir avatar | Opcional |

**Hay que preparar estos ficheros (los hace diseño):**

- logo horizontal en SVG y PNG de 1086×153;
- isotipo cuadrado de 128×128;
- favicons de 16, 32, 192 y 512 px;
- tarjeta social de 1200×630.

**Publicación:** se suben a una URL pública. Puede ser el Blob de la academia o una carpeta estática del campus.

## B. Sin Admin API: sustituir ficheros en el contenedor

`play` sirve `/static/images/…` desde su carpeta `dist/public`. Se pueden tapar algunos ficheros con volúmenes en `docker-compose.override.yaml`:

```yaml
services:
  play:
    volumes:
      - ./branding/logo.png:/usr/src/play/dist/public/static/images/logo.png:ro
      - ./branding/logo-min.png:/usr/src/play/dist/public/static/images/logo-WA-min.png:ro
```

**Limitaciones:**

- **Algunos logos no se pueden tapar así:** van empaquetados en el JavaScript con un hash en el nombre, como el sello grande de "Powered by" de la pantalla de login.
- **Hay que revisarlo en cada actualización:** la ruta interna de la imagen puede cambiar.
- **Ruta sin probar:** compruébala la primera vez con `docker compose exec play ls dist/public/static/images`.

Por eso esta vía solo sirve como apaño temporal.
