# Comparativa de hosting: campus completo con Dokploy

> **Decisión (2026-10-10): no se usa Dokploy.** Se despliega con el Docker Compose oficial en 2 servidores. Ver [`deploy/DESPLIEGUE.md`](./deploy/DESPLIEGUE.md). La tabla de precios sigue valiendo; la sección de Dokploy queda solo como referencia.

> **Fecha:** 2026-10-10. Los precios son de la web de cada proveedor y de listados de terceros. **Hetzner ha subido precios tres veces en 2026** y las fuentes no siempre coinciden, así que confirmad cada cifra en la web oficial antes de contratar.
> Los importes van sin IVA (21 %), salvo donde se indica.

## Qué se despliega ("el proyecto completo")

| Servidor | Servicios | Cómo |
|---|---|---|
| **A: campus** | **Dokploy** (panel, con su Traefik y Let's Encrypt), WorkAdventure (play, back, map-storage, uploader, icon, Redis), RustFS (S3 para grabaciones) y, si se quiere, Synapse | Una aplicación *Docker Compose* de Dokploy |
| **B: media** | LiveKit (SFU de vídeo), LiveKit Egress (grabación) y Coturn (TURN) | Dokploy lo gestiona como **servidor remoto**. Contenedores con `network_mode: host` |

**Por qué dos servidores:** el vídeo (LiveKit) se come la CPU y la red en picos, y si comparte máquina con el panel y el campus, una clase grande ralentiza todo. **Para un piloto vale con uno solo.**

**Tamaño mínimo:**

- **A:** 4 vCPU / 8 GB. Dokploy pide como mínimo 2 GB de RAM y 30 GB de disco solo para él.
- **B:** 4–8 vCPU / 8 GB.

**Una regla para todos los proveedores:** Dokploy **no está probado en ARM**, según su propia guía en la comunidad de Hetzner. Hay que usar **servidores x86**, así que los CAX (ARM) de Hetzner quedan descartados.

## Comparativa (2 servidores, ~50 alumnos activos, ~3 TB/mes de tráfico)

| Proveedor | Configuración | Tráfico incluido | €/$ al mes (sin IVA) | Notas |
|---|---|---|---|---|
| **IONOS** | 2 × VPS XL (8 vCores / 16 GB / 480 GB NVMe) | **Ilimitado a 1 Gbit/s** | **~34 € en promoción** · ~56 € a precio normal | El más barato. CPD en España. Los vCores son compartidos. ~10 € de alta por VPS. Ya tenéis cuenta |
| **Hetzner Cloud** | 2 × CX43 (8 vCPU / 16 GB / 160 GB) | 20 TB por servidor | ~32 € (+~1 €/IP) | Precio de junio de 2026, **pero los planes CX aparecían "no disponibles"** en octubre de 2026 |
| Hetzner Cloud (alternativa) | 2 × CPX42 (8 vCPU AMD / 16 GB) | 20 TB por servidor | **~140 €** | Tras la subida de junio de 2026 se ha encarecido mucho |
| **Hetzner dedicado** (Server Auction) | 1 × Ryzen de 64 GB (B, media) + 1 × CX43 (A) | Ilimitado a 1 Gbit/s (dedicado) | ~45–85 € | Lo mejor para el vídeo: CPU **dedicada**. El stock y el precio de la subasta cambian a diario; tiene cuota de alta |
| **DigitalOcean** | 2 × Basic de 4 vCPU / 8 GB + backups | ~5 TB por droplet, en saldo común | **~110–155 $** | Muy fácil de usar, precio predecible y overage barato (~0,01 $/GB) |
| **AWS EC2** | t3.large + c6i.xlarge | 100 GB gratis, luego ~0,09 $/GB | **~450–550 $** | El tráfico lo encarece todo. No compensa para esto |

### Recomendación

1. **IONOS 2 × VPS XL: es la mejor relación precio/riesgo.** Tráfico ilimitado, CPD en España y la cuenta ya existe. Son ~41 €/mes con IVA en promoción.
2. **Si el vídeo va justo** (cortes en clases grandes, por los vCores compartidos), mantened A en IONOS y mudad **B (LiveKit) a un dedicado de Hetzner o de IONOS**. Es lo único que se beneficia de tener CPU dedicada.
3. **DigitalOcean** solo si se prioriza la comodidad del panel sobre el precio. **AWS, no.**

## Dokploy: qué cambia respecto al compose oficial

Dokploy ya trae su propio Traefik en los puertos 80 y 443, así que el `contrib/docker/docker-compose.prod.yaml` **no se puede pegar tal cual**. Los cambios, todos mecánicos:

1. **Quitar el servicio `reverse-proxy`.** Si se deja, choca con el Traefik de Dokploy en los puertos 80 y 443.
2. **Unir cada servicio con etiquetas** a la red `dokploy-network` (`networks: [dokploy-network]`, declarada como `external: true`). Añadir además `traefik.docker.network: dokploy-network`.
3. **Cambiar el resolvedor de certificados:** `tls.certresolver: myresolver` pasa a ser `letsencrypt` (el de Dokploy). Los routers del entrypoint `web` se pueden borrar, porque Dokploy ya redirige a HTTPS.
4. **Mantener las etiquetas Traefik del compose** en lugar de usar la pantalla "Domains" de Dokploy. WorkAdventure enruta **por rutas dentro de un mismo dominio** y necesita cosas que esa pantalla no configura:
   - `/api`, `/uploader`, `/icon` y `/map-storage` con *strip-prefix*
   - `/ws/` con **cookie de afinidad** (`wa_ws_affinity`)
5. **Mover la Room API (gRPC) a un subdominio.** El compose oficial abre un entrypoint propio en el `:50051`, que el Traefik de Dokploy no tiene. Hay que publicarla en `room-api.campus.racks.university` por el 443, con `scheme: h2c`. El cliente `@workadventure/room-api-client` usa TLS en el puerto 443.
6. **No poner `container_name`**, porque rompe los logs y las métricas de Dokploy. En los servicios con dominio, usar `expose` en vez de `ports`.
7. **LiveKit y Coturn van en el servidor B con `network_mode: host`**, fuera de Traefik:
   - Necesitan UDP directo: 50000–60000/UDP, 7881/TCP, 3478 UDP/TCP y 5349/TCP.
   - La señalización de LiveKit (puerto 7880) sí puede ir por el Traefik de Dokploy en `livekit.campus.racks.university` (WebSocket con TLS).
8. **Variables:** el `.env` (ver `racks/env.racks.example`) va en la pestaña *Environment* de la aplicación en Dokploy.
9. **Backups:** configurar en Dokploy un destino S3 para los volúmenes `map-storage-data` y `redisdata`. Esos volúmenes son los mapas del campus.

**Licencia:** Dokploy autoalojado es open source y gratuito. Tiene una versión cloud de pago opcional que aquí no hace falta.

### Puertos que hay que abrir en el firewall del proveedor

| Servidor | Puertos |
|---|---|
| A (Dokploy + campus) | 80/TCP, 443/TCP, 3000/TCP (panel de Dokploy; cerradlo cuando el panel tenga dominio con HTTPS), 22/TCP (SSH, restringido a vuestras IPs) |
| B (media) | 22/TCP, 443/TCP (si la señalización de LiveKit va por Traefik), 7880–7881/TCP, 50000–60000/UDP, 3478/UDP+TCP, 5349/TCP |

## Fuentes

- IONOS VPS (oficial): https://www.ionos.com/servers/vps · https://www.whtop.com/plans/ionos.fr/140736
- Ajuste de precios de Hetzner (15/06/2026): https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/
- Desglose de la subida de Hetzner: https://northflank.com/blog/hetzner-cloud-server-price-increases · https://privatedevops.com/news/hetzner-june-2026-cloud-price-increase-what-to-do · https://webhosting.today/2026/06/18/hetzners-price-increases-reached-209-the-30-headline-applied-to-a-different-tier/
- Hetzner AX42 / subasta: https://www.deskmodder.de/blog/?p=210160 · https://lowendtalk.com/discussion/212897/hetzner-server-amd-ryzen-7-3700x-for-transfer
- Dokploy (requisitos, dominios, compose): https://docs.dokploy.com/docs/core/installation · https://docs.dokploy.com/docs/core/troubleshooting/domains · https://docs.dokploy.com/docs/core/docker-compose/example · https://community.hetzner.com/tutorials/setup-dokploy-on-your-vps/
- DigitalOcean: https://infratally.com/articles/digitalocean-droplet-pricing-guide-2026/
- AWS (tráfico): https://egresscost.com/aws/data-transfer-pricing
