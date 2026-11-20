import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'static/audio/musee-vocabulaire');
const manifest = JSON.parse(readFileSync(resolve(output, 'manifest.json'), 'utf8'));
const csv = readFileSync(resolve(root, 'static/vocabulaire/lexique.csv'), 'utf8');

function parseCsv(source) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(value); value = '';
      if (char !== ',') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === '\r' && source[i + 1] === '\n') i++;
      }
    } else value += char;
  }
  row.push(value);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const rows = parseCsv(csv);
const headers = rows.shift();
const idIndex = headers.indexOf('id');
const wordIndex = headers.indexOf('mot');
const words = new Map(rows.map((row) => [row[idIndex], row[wordIndex]]));
const piper = process.env.PIPER_BIN || 'piper';
const model = process.env.PIPER_MODEL;
if (!model) throw new Error('Définis PIPER_MODEL avec le chemin du modèle Piper français.');
mkdirSync(output, { recursive: true });

for (const id of manifest.words) {
  const word = words.get(id);
  if (!word) throw new Error(`Mot absent du CSV : ${id}`);
  const wav = resolve(output, `${id}-piper.wav`);
  execFileSync(piper, [
    '-m', model, '--length-scale', '1.12', '--sentence-silence', '0.25', '-f', wav
  ], { input: `${word}\n`, stdio: ['pipe', 'inherit', 'inherit'] });
}

console.log(`${manifest.words.length} fichiers WAV Piper générés.`);
