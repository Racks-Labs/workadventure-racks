// Lógica pura de avatares (Wokas) de WorkAdventure. Sin E/S: recibe la imagen ya
// decodificada ({ width, height, data: RGBA }), para poder probarla sin ficheros.
//
// Formato (verificado en play/src/front/Phaser/Entity/PlayerTexturesLoadingManager.ts
// y Player/Animation.ts): PNG 96×128 = 3 columnas × 4 filas de 32×32.
// Filas: 0 abajo · 1 izquierda · 2 derecha · 3 arriba. Columnas: pasos (el central = quieto).

export const FRAME = 32;
export const COLS = 3;
export const ROWS = 4;
export const WIDTH = FRAME * COLS; // 96
export const HEIGHT = FRAME * ROWS; // 128
export const DIRECTIONS = ["abajo", "izquierda", "derecha", "arriba"];
export const LAYERS = ["woka", "body", "eyes", "hair", "clothes", "hat", "accessory"];

/** Tope orientativo: un avatar de pixel art no pasa de unos KB; más suele ser un PNG sin optimizar. */
export const MAX_BYTES = 100 * 1024;

function alphaAt(img, x, y) {
  return img.data[(y * img.width + x) * 4 + 3];
}

/** Píxeles opacos (alfa > 0) de un fotograma. */
export function framePixelCount(img, col, row) {
  let n = 0;
  for (let y = row * FRAME; y < (row + 1) * FRAME; y++) {
    for (let x = col * FRAME; x < (col + 1) * FRAME; x++) {
      if (alphaAt(img, x, y) > 0) n++;
    }
  }
  return n;
}

/**
 * Comprueba una textura. Devuelve { errors, warnings }: un error impide usarla
 * (WorkAdventure la pintaría mal o no la pintaría); un aviso merece una mirada.
 *
 * `layer` = "woka" (personaje completo) o una capa (body, hair…). Las capas
 * pueden tener mucha transparencia; un woka completo debe tener cuerpo en cada
 * fotograma.
 */
export function checkAvatar(img, { layer = "woka", bytes } = {}) {
  const errors = [];
  const warnings = [];

  if (!LAYERS.includes(layer)) {
    errors.push(`Capa desconocida "${layer}". Válidas: ${LAYERS.join(", ")}.`);
  }
  if (img.width !== WIDTH || img.height !== HEIGHT) {
    errors.push(
      `Mide ${img.width}×${img.height} y tiene que medir exactamente ${WIDTH}×${HEIGHT} (3×4 fotogramas de ${FRAME}×${FRAME}).`,
    );
    return { errors, warnings };
  }

  let transparent = 0;
  let semi = 0;
  const total = img.width * img.height;
  for (let i = 3; i < img.data.length; i += 4) {
    const a = img.data[i];
    if (a === 0) transparent++;
    else if (a < 255) semi++;
  }
  if (transparent === 0) {
    errors.push("No tiene ningún píxel transparente: el fondo tiene que ser transparente, no de color.");
  } else if (layer === "woka" && transparent / total < 0.3) {
    warnings.push(
      `Solo el ${Math.round((transparent / total) * 100)} % es transparente: ¿se ha quedado un fondo pintado?`,
    );
  }
  if (semi / total > 0.05) {
    warnings.push(
      `${Math.round((semi / total) * 100)} % de píxeles semitransparentes: en pixel art suelen salir de un reescalado con suavizado. Reescala con "vecino más próximo".`,
    );
  }

  const empty = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (framePixelCount(img, col, row) === 0) empty.push(`${DIRECTIONS[row]} #${col + 1}`);
    }
  }
  // Los ojos no se ven de espaldas: su fila "arriba" vacía es lo correcto.
  if (layer === "eyes") {
    for (let i = empty.length - 1; i >= 0; i--) if (empty[i].startsWith("arriba")) empty.splice(i, 1);
  }
  if (empty.length === ROWS * COLS) {
    // WorkAdventure usa capas vacías a propósito como opción "ninguno"
    // (character_hairs0 = sin pelo, character_hats1 = sin sombrero).
    if (layer === "woka" || layer === "body") errors.push("Todos los fotogramas están vacíos.");
    else warnings.push('Capa vacía: solo tiene sentido como opción "ninguno" (sin pelo, sin sombrero…).');
  } else if (empty.length > 0) {
    const msg = `Fotogramas vacíos: ${empty.join(", ")}.`;
    if (layer === "woka" || layer === "body") errors.push(msg);
    else warnings.push(`${msg} Una capa debería verse en las 4 direcciones.`);
  }

  // El fotograma central de cada fila es el "quieto": si difiere mucho de los
  // laterales en masa, la animación "salta".
  for (let row = 0; row < ROWS; row++) {
    const counts = [0, 1, 2].map((c) => framePixelCount(img, c, row));
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max > 0 && min / max < 0.5) {
      warnings.push(
        `Fila "${DIRECTIONS[row]}": los 3 pasos son muy distintos en tamaño (${counts.join(" / ")} píxeles). Revisa que sea el mismo personaje.`,
      );
    }
  }

  if (typeof bytes === "number" && bytes > MAX_BYTES) {
    warnings.push(`Pesa ${Math.round(bytes / 1024)} KB: optimízalo (un avatar suele pesar menos de 20 KB).`);
  }

  return { errors, warnings };
}

// ─── Lectura tolerante ───────────────────────────────────────────────────

/**
 * Recorta lo que haya después del bloque IEND de un PNG. Algunos PNG del propio
 * WorkAdventure traen basura al final: el navegador la ignora, pero un lector
 * estricto los rechaza. Devuelve { buffer, trailing } (bytes sobrantes).
 */
export function trimAfterIend(buffer) {
  const marker = Buffer.from("IEND");
  const at = buffer.indexOf(marker);
  if (at < 0) return { buffer, trailing: 0 };
  const end = at + 4 + 4; // "IEND" + CRC
  return { buffer: buffer.subarray(0, end), trailing: buffer.length - end };
}

// ─── Color ────────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Color no válido: "${hex}" (usa #RRGGBB).`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Recolorea en el sitio: cada píxel cuyo tono esté a menos de `tolerance` grados
 * del color origen pasa al tono y saturación del destino, CONSERVANDO su
 * luminosidad relativa. Así se mantienen las sombras y las luces del pixel art
 * (una sudadera roja con sus pliegues pasa a naranja con sus pliegues).
 *
 * Los grises (saturación < 0.12) no se tocan: son contornos y blancos.
 * Devuelve cuántos píxeles ha cambiado.
 */
export function recolor(img, mappings, { tolerance = 25 } = {}) {
  const prepared = mappings.map(({ from, to }) => {
    const [fh, fs, fl] = rgbToHsl(...hexToRgb(from));
    const [th, ts, tl] = rgbToHsl(...hexToRgb(to));
    if (fs < 0.12) throw new Error(`El color origen ${from} es casi gris: elige un color con tono para recolorear.`);
    return { fh, fl, th, ts, tl };
  });
  let changed = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(img.data[i], img.data[i + 1], img.data[i + 2]);
    if (s < 0.12) continue;
    const m = prepared.find((p) => hueDistance(h, p.fh) <= tolerance);
    if (!m) continue;
    // Luminosidad relativa: el tono "base" del origen pasa a la del destino.
    const ratio = m.fl > 0 ? l / m.fl : 1;
    const nl = Math.max(0, Math.min(1, m.tl * ratio));
    const [r, g, b] = hslToRgb(m.th, m.ts, nl);
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    changed++;
  }
  return changed;
}

/** Superpone capas (mismo tamaño) en orden, con alfa. Útil para previsualizar un avatar por capas. */
export function composite(layers) {
  const { width, height } = layers[0];
  const out = { width, height, data: new Uint8Array(width * height * 4) };
  for (const layer of layers) {
    if (layer.width !== width || layer.height !== height) {
      throw new Error("Todas las capas tienen que medir lo mismo.");
    }
    for (let i = 0; i < out.data.length; i += 4) {
      const a = layer.data[i + 3] / 255;
      if (a === 0) continue;
      const ba = out.data[i + 3] / 255;
      const oa = a + ba * (1 - a);
      for (let c = 0; c < 3; c++) {
        out.data[i + c] = Math.round((layer.data[i + c] * a + out.data[i + c] * ba * (1 - a)) / oa);
      }
      out.data[i + 3] = Math.round(oa * 255);
    }
  }
  return out;
}
