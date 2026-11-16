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
const voices = { eddy: 'Eddy (Français (France))', flo: 'Flo (Français (France))' };
mkdirSync(output, { recursive: true });

for (const id of manifest.words) {
  const word = words.get(id);
  if (!word) throw new Error(`Mot absent du CSV : ${id}`);
  for (const voice of manifest.voices) {
    const aiff = resolve('/tmp', `${id}-${voice}.aiff`);
    const wav = resolve(output, `${id}-${voice}.wav`);
    execFileSync('say', ['-v', voices[voice], '-o', aiff, word], { stdio: 'inherit' });
    execFileSync('afconvert', [aiff, wav, '-f', 'WAVE', '-d', 'LEI16'], { stdio: 'inherit' });
  }
}

console.log(`${manifest.words.length * manifest.voices.length} fichiers WAV générés.`);
