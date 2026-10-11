#!/usr/bin/env node
// Comprueba que uno o varios PNG sirven como avatar (Woka) de WorkAdventure.
//
//   node avatar-check.mjs mi-avatar.png               # personaje completo
//   node avatar-check.mjs --layer=hat gorra-racks.png # una capa
//
// Sale con código 1 si algún fichero tiene errores (útil en CI o al validar
// la entrega de un reto).
import { readFileSync, statSync } from "node:fs";
import { PNG } from "pngjs";
import { checkAvatar, LAYERS, trimAfterIend } from "./avatar-lib.mjs";

const args = process.argv.slice(2);
const layerArg = args.find((a) => a.startsWith("--layer="));
const layer = layerArg ? layerArg.split("=")[1] : "woka";
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0) {
  console.error(`Uso: node avatar-check.mjs [--layer=${LAYERS.join("|")}] fichero.png [...]`);
  process.exit(2);
}

let failed = false;
for (const file of files) {
  let img;
  let trailing = 0;
  try {
    const trimmed = trimAfterIend(readFileSync(file));
    trailing = trimmed.trailing;
    img = PNG.sync.read(trimmed.buffer);
  } catch (e) {
    console.log(`✗ ${file}\n  - No es un PNG válido (${e.message}).`);
    failed = true;
    continue;
  }
  const { errors, warnings } = checkAvatar(img, { layer, bytes: statSync(file).size });
  if (trailing > 0) warnings.push(`Lleva ${trailing} bytes sobrantes tras el final del PNG: el navegador lo tolera, pero conviene volver a exportarlo.`);
  console.log(`${errors.length ? "✗" : "✓"} ${file} (${layer})`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
  for (const w of warnings) console.log(`  aviso  ${w}`);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
