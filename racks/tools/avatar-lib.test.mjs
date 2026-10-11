import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { checkAvatar, composite, hexToRgb, recolor, trimAfterIend, WIDTH, HEIGHT } from "./avatar-lib.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => PNG.sync.read(readFileSync(repo + p));

function blank(w = WIDTH, h = HEIGHT) {
  return { width: w, height: h, data: new Uint8Array(w * h * 4) };
}
function paint(img, x0, y0, x1, y1, [r, g, b, a = 255]) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.width + x) * 4;
    img.data.set([r, g, b, a], i);
  }
}
function fullCharacter() {
  const img = blank();
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    paint(img, col * 32 + 10, row * 32 + 6, col * 32 + 22, row * 32 + 30, [200, 40, 40]);
  }
  return img;
}

test("los avatares reales de WorkAdventure pasan la comprobación", () => {
  const woka = read("play/public/resources/characters/pipoya/Male 01-1.png");
  assert.deepEqual(checkAvatar(woka).errors, []);
  const hair = read("play/public/resources/customisation/character_hairs/character_hairs1.png");
  assert.deepEqual(checkAvatar(hair, { layer: "hair" }).errors, []);
  // "sin pelo": capa vacía a propósito → aviso, no error
  const none = read("play/public/resources/customisation/character_hairs/character_hairs0.png");
  const r = checkAvatar(none, { layer: "hair" });
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.includes("ninguno")));
});

test("rechaza el tamaño equivocado", () => {
  const { errors } = checkAvatar(blank(64, 64));
  assert.match(errors[0], /96×128/);
});

test("rechaza un fondo sin transparencia", () => {
  const img = blank();
  paint(img, 0, 0, WIDTH, HEIGHT, [255, 255, 255]);
  assert.ok(checkAvatar(img).errors.some((e) => e.includes("transparente")));
});

test("un personaje completo con fotogramas vacíos es error; en una capa, aviso", () => {
  const img = fullCharacter();
  paint(img, 64, 96, 96, 128, [0, 0, 0, 0]); // vacía "arriba #3"
  assert.ok(checkAvatar(img).errors.some((e) => e.includes("arriba #3")));
  const asHat = checkAvatar(img, { layer: "hat" });
  assert.deepEqual(asHat.errors, []);
  assert.ok(asHat.warnings.some((w) => w.includes("arriba #3")));
});

test("un personaje bien formado no da errores", () => {
  assert.deepEqual(checkAvatar(fullCharacter()).errors, []);
});

test("recolorea conservando la luminosidad relativa y sin tocar los grises", () => {
  const img = blank();
  paint(img, 0, 0, 1, 1, [200, 40, 40]); // rojo base
  paint(img, 1, 0, 2, 1, [100, 20, 20]); // rojo sombra
  paint(img, 2, 0, 3, 1, [30, 30, 30]); // contorno gris
  const n = recolor(img, [{ from: "#c82828", to: "#f5911a" }]);
  assert.equal(n, 2);
  const px = (x) => Array.from(img.data.slice(x * 4, x * 4 + 3));
  // la base pasa a ser el naranja destino (con redondeo)
  px(0).forEach((v, i) => assert.ok(Math.abs(v - hexToRgb("#f5911a")[i]) <= 2));
  // la sombra sigue siendo más oscura que la base
  assert.ok(px(1).reduce((a, b) => a + b) < px(0).reduce((a, b) => a + b));
  assert.deepEqual(px(2), [30, 30, 30]);
});

test("superpone capas respetando la transparencia", () => {
  const base = blank(2, 1);
  paint(base, 0, 0, 2, 1, [0, 0, 255]);
  const top = blank(2, 1);
  paint(top, 1, 0, 2, 1, [255, 0, 0]);
  const out = composite([base, top]);
  assert.deepEqual(Array.from(out.data), [0, 0, 255, 255, 255, 0, 0, 255]);
});

test("acepta PNG con datos sobrantes al final (hay 4 así en WorkAdventure)", () => {
  const raw = readFileSync(repo + "play/public/resources/characters/pipoya/Male 01-3.png");
  const { buffer, trailing } = trimAfterIend(raw);
  assert.ok(trailing > 0);
  assert.deepEqual(checkAvatar(PNG.sync.read(buffer)).errors, []);
});

test("los ojos no avisan por no verse de espaldas", () => {
  const eyes = read("play/public/resources/customisation/character_eyes/character_eyes1.png");
  assert.deepEqual(checkAvatar(eyes, { layer: "eyes" }).warnings.filter((w) => w.includes("arriba")), []);
});
