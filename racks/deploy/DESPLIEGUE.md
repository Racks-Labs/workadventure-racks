# Despliegue en producción (sin Dokploy): 2 servidores con Docker Compose

Es el método oficial de WorkAdventure, el que prueban en cada versión. No lleva capas extra: si algo falla, el diagnóstico es directo.

| Servidor | Qué corre | Recomendado |
|---|---|---|
| **A: campus** (`campus.racks.university`) | Compose oficial de WorkAdventure: Traefik + Let's Encrypt, play, back, map-storage, uploader, icon, Redis | IONOS VPS XL (8 vCores / 16 GB), Ubuntu 24.04 |
| **B: media** (`livekit.` y `turn.racks.university`) | LiveKit (vídeo de grupo), Coturn (TURN) y Caddy (HTTPS para LiveKit) | Otro IONOS VPS XL, Ubuntu 24.04 |

Coste orientativo: ~34 €/mes sin IVA en promoción. Ver `../COMPARATIVA-HOSTING.md`.

---

## 1. DNS

Crea **tres registros A**:

| Nombre | Apunta a |
|---|---|
| `campus.racks.university` | IP del servidor A |
| `livekit.racks.university` | IP del servidor B |
| `turn.racks.university` | IP del servidor B |

Si usáis Cloudflare, pon **"DNS only" (nube gris)** en los tres. El proxy de Cloudflare no deja pasar WebRTC ni TURN y rompe los certificados de Let's Encrypt por HTTP.

## 2. Firewall (panel de IONOS → Red → Políticas de firewall)

| Servidor | Abrir |
|---|---|
| A | 22/TCP (solo desde vuestras IPs), 80/TCP, 443/TCP, 50051/TCP (Room API; ábrelo solo si se usa) |
| B | 22/TCP (solo desde vuestras IPs), 80/TCP, 443/TCP, 7881/TCP, 50000–60000/UDP (LiveKit), 3478/UDP+TCP, 40000–49999/UDP (Coturn) |

## 3. Preparar los dos servidores

```bash
# Ubuntu 24.04, como root o con sudo
curl -fsSL https://get.docker.com | sh
apt-get install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades
```

## 4. Servidor B (media): primero, porque A lo necesita

```bash
git clone -b docs/plan-incorporacion-racks-university https://github.com/Racks-Labs/workadventure-racks.git
cd workadventure-racks/racks/deploy/media
cp .env.example .env
nano .env          # rellenar: dominios, email, IP pública y los 3 secretos (con openssl rand)
docker compose up -d
docker compose logs -f   # esperar a que Caddy obtenga el certificado de livekit.racks.university
```

**Comprobaciones:**

- `curl https://livekit.racks.university` responde `OK`.
- La prueba de vídeo real se hace desde el campus en el paso 6.
- Para Coturn, abre https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/ con `turn:turn.racks.university:3478` y credenciales temporales. Debe aparecer al menos un candidato **`relay`**.

## 5. Servidor A (campus)

Usa **los ficheros del tag de la versión**, no los de `master`. La última versión es **v1.34.1**, publicada el 2026-10-09.

```bash
mkdir -p /opt/campus && cd /opt/campus
V=v1.34.1
curl -fsSLo docker-compose.yaml https://raw.githubusercontent.com/workadventure/workadventure/$V/contrib/docker/docker-compose.prod.yaml
curl -fsSLo .env               https://raw.githubusercontent.com/workadventure/workadventure/$V/contrib/docker/.env.prod.template
# Override de Racks: añade variables que el compose oficial no pasa
curl -fsSLo docker-compose.override.yaml https://raw.githubusercontent.com/Racks-Labs/workadventure-racks/docs/plan-incorporacion-racks-university/racks/deploy/campus/docker-compose.override.yaml
nano .env
```

**En `.env`**, aplica todo lo de `racks/env.racks.example`. Lo imprescindible:

- **Versión y dominio:** `VERSION=v1.34.1`, `DOMAIN`, `ACME_EMAIL` y `SECRET_KEY`.
- **Vídeo, con los mismos secretos que en el servidor B:**
  - `LIVEKIT_HOST=https://livekit.racks.university` (**https, no wss**)
  - `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`
  - `TURN_SERVER`, `TURN_STATIC_AUTH_SECRET` y `STUN_SERVER`
- **Mapas:** `MAP_STORAGE_AUTHENTICATION_USER` y `_PASSWORD`, y `MAP_STORAGE_ENABLE_BEARER_AUTHENTICATION=true` + `MAP_STORAGE_AUTHENTICATION_TOKEN`.
- **Seguridad y valores por defecto peligrosos:** `ENABLE_TELEMETRY=false`, `MAP_EDITOR_ALLOW_ALL_USERS=false`, y `BBB_URL=` / `BBB_SECRET=` / `JITSI_URL=` vacíos.
- **SSO (paso 7):** `DISABLE_ANONYMOUS=true` y las variables `OPENID_*`.

Arranca y sigue los logs:

```bash
docker compose up -d
docker compose logs -f play back
```

## 6. Primer mapa y prueba

1. Clona el [map-starter-kit](https://github.com/workadventure/map-starter-kit) en tu Mac y sube el mapa con `npm run upload`. Te pedirá la URL `https://campus.racks.university/map-storage/` y el token del paso 5.
2. Pon `START_ROOM_URL=/~/<ruta-del-mapa>.wam` en `.env` y ejecuta `docker compose up -d`.
3. Repite la checklist de `../PRUEBA-LOCAL.md` §3 con 3 o 4 personas reales, cada una desde su propia red. Al menos una debe estar en una red restrictiva, por ejemplo con los datos del móvil o en la oficina, para comprobar que Coturn funciona.

## 7. SSO con Logto (`auth.racks.academy`)

1. **Crea la aplicación en Logto:** ve a Applications → Traditional web y usa estas URIs:
   - Redirect URI: `https://campus.racks.university/openid-callback`
   - Post sign-out redirect URI: `https://campus.racks.university/`
2. **Configura `.env`:**

   ```
   OPENID_CLIENT_ISSUER=https://auth.racks.academy/oidc
   OPENID_CLIENT_ID=...
   OPENID_CLIENT_SECRET=...
   OPENID_SCOPE=openid email profile roles
   OPENID_USERNAME_CLAIM=name
   OPENID_TAGS_CLAIM=roles
   DISABLE_ANONYMOUS=true
   ```

3. **Reinicia `play`:** `docker compose up -d`.

## 8. Operación

- **Actualizar** (aproximadamente una versión al mes):
  1. Lee las notas de la versión y `UPGRADE.md`.
  2. Descarga el compose del nuevo tag.
  3. Cambia `VERSION`.
  4. Ejecuta `docker compose up -d --force-recreate`.
  5. Hazlo **fuera del horario de clases**.
- **Backups:**
  - Los mapas están en el volumen Docker `map-storage-data`. Cópialo cada día a S3 o a otro servidor, por ejemplo con un cron y `docker run --rm -v campus_map-storage-data:/d -v /backup:/b alpine tar czf /b/maps-$(date +%F).tgz -C /d .`.
  - Activa también las copias de seguridad del VPS en el panel de IONOS.
- **Monitorización:** como mínimo, un *uptime check* gratuito (UptimeRobot o similar) sobre `https://campus.racks.university` y `https://livekit.racks.university`.
- **Si el vídeo se entrecorta** con mucha gente: mira la CPU de B con `htop`. Si va saturada, sube B de plan o pásalo a un servidor dedicado. A no hace falta tocarlo.

## Problemas típicos

| Síntoma | Causa |
|---|---|
| El certificado no se emite | DNS mal configurado, el proxy de Cloudflare activado o el puerto 80 cerrado |
| Vídeo entre 2 sí, pero con 5 o más no | LiveKit inaccesible: `LIVEKIT_HOST` mal (tiene que ser https), claves distintas en A y B, o los puertos UDP 50000–60000 cerrados |
| A algunos alumnos no les conecta ni entre 2 | Coturn: puertos 3478/40000–49999 cerrados o `TURN_STATIC_AUTH_SECRET` distinto en A y B |
| Login en bucle | La redirect URI de Logto no coincide exactamente |
