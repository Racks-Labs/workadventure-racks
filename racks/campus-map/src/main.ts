/// <reference types="@workadventure/iframe-api-typings" />
/**
 * Script del mapa del campus Racks University.
 *
 * Se usa con el map-starter-kit de WorkAdventure: sustituye a su `src/main.ts`
 * (ver ../README.md). Corre en el navegador de CADA alumno, así que no puede
 * cambiar lo que ven los demás: para eso están las variables (`WA.state`) y la
 * Room API.
 *
 * Convención de nombres de áreas (créalas con esos nombres en Tiled o en el
 * editor de mapas): ver AREAS más abajo.
 */

const LEARN_URL = "https://learn.racks.university";

/** Áreas con un mensaje de bienvenida al entrar. */
const AREAS: Record<string, { titulo: string; mensaje: string }> = {
  recepcion: {
    titulo: "Recepción",
    mensaje: "Bienvenido al campus. Acércate a alguien para hablar por vídeo.",
  },
  auditorio: {
    titulo: "Auditorio",
    mensaje: "Aquí se dan los directos. Solo los mentores tienen megáfono.",
  },
  mentorias: {
    titulo: "Mentorías",
    mensaje: "Salas para hablar con tu mentor. Respeta la puerta cerrada.",
  },
  cafeteria: {
    titulo: "Cafetería",
    mensaje: "Zona social: charla libre con la comunidad.",
  },
  biblioteca: {
    titulo: "Biblioteca",
    mensaje: "Zona de silencio para estudiar acompañado.",
  },
};

let mensajeActual: { remove: () => Promise<void> } | undefined;

WA.onInit()
  .then(() => {
    const nombre = WA.player.name;
    const tags = WA.player.tags;
    const esMentor = tags.includes("mentor") || tags.includes("admin");

    // Botón fijo para volver a la academia.
    WA.ui.actionBar.addButton({
      id: "racks-learn",
      label: "Ir a la academia",
      callback: () => WA.nav.openTab(LEARN_URL),
    });

    // Aviso solo a mentores: tienen permisos que el alumno no tiene.
    if (esMentor) {
      WA.ui.banner.openBanner({
        id: "racks-mentor",
        text: `Hola ${nombre}: tienes megáfono en el auditorio y puedes grabar.`,
        closable: true,
        timeToClose: 15000,
      });
    }

    for (const [area, info] of Object.entries(AREAS)) {
      WA.room.area.onEnter(area).subscribe(() => {
        void mensajeActual?.remove();
        mensajeActual = WA.ui.displayActionMessage({
          message: `${info.titulo} — ${info.mensaje}`,
          type: "message",
          callback: () => void mensajeActual?.remove(),
        });
      });
      WA.room.area.onLeave(area).subscribe(() => {
        void mensajeActual?.remove();
        mensajeActual = undefined;
      });
    }
  })
  .catch((e) => console.error("[campus] error al iniciar el script", e));

export {};
