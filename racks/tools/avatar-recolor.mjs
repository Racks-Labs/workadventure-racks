#!/usr/bin/env node
// Recolorea un avatar o una capa conservando sombras y luces.
//
//   node avatar-recolor.mjs entrada.png salida.png "#c0392b=#f5911a" ["#2980b9=#111111" ...] [--tolerance=25]
//
// Pensado para el "camino A" de racks/AVATARES.md: una plantilla de sudadera
// diseñada una vez → una por plan / por marca de cada alumno.
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { checkAvatar, recolor, trimAfterIend } from "./avatar-lib.mjs";

const args = process.argv.slice(2);
const tolArg = args.find((a) => a.startsWith("--tolerance="));
const tolerance = tolArg ? Number(tolArg.split("=")[1]) : 25;
const positional = args.filter((a) => !a.startsWith("--"));
const [input, output, ...pairs] = positional;

if (!input || !output || pairs.length === 0) {
  console.error('Uso: node avatar-recolor.mjs entrada.png salida.png "#ORIGEN=#DESTINO" [...] [--tolerance=25]');
  process.exit(2);
}
const mappings = pairs.map((p) => {
  const [from, to] = p.split("=");
  if (!from || !to) throw new Error(`Par mal escrito: "${p}" (usa "#ORIGEN=#DESTINO").`);
  return { from, to };
});

const img = PNG.sync.read(trimAfterIend(readFileSync(input)).buffer);
const before = checkAvatar(img, { layer: "accessory" });
if (before.errors.some((e) => e.includes("exactamente"))) {
  console.error(`✗ ${input}: ${before.errors.join(" ")}`);
  process.exit(1);
}
const changed = recolor(img, mappings, { tolerance });
writeFileSync(output, PNG.sync.write(img));
console.log(`✓ ${output}: ${changed} píxeles recoloreados.`);
if (changed === 0) console.log("  aviso  No ha cambiado nada: ¿el color origen está en la imagen? Prueba a subir --tolerance.");
