import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Hypher from 'hypher';
import english from 'hyphenation.en-gb';
import { labelOverrides, sentenceOverrides, variantOverrides, wordOverrides } from './english-lab-curation.mjs';

const root = resolve(import.meta.dirname, '..');
const files = [
  resolve(root, 'static/vocabulaire/english-lab.csv'),
  resolve(root, 'src/lib/games/musee-vocabulaire/data/english-lab.csv')
];
const hypher = new Hypher(english);

function parseCsv(source) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { value += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(value); value = '';
      if (char !== ',') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === '\r' && source[index + 1] === '\n') index++;
      }
    } else value += char;
  }
  row.push(value);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function encodeCsv(rows) {
  const cell = (value) => {
    const text = String(value ?? '').normalize('NFC');
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return `${rows.map((row) => row.map(cell).join(',')).join('\n')}\n`;
}

function writtenSyllables(word) {
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ’' ]+$/u.test(word)) return [];
  const tokens = word.split(/( +)/u).filter(Boolean);
  const parts = [];
  for (const token of tokens) {
    if (/^ +$/u.test(token)) {
      if (!parts.length) return [];
      parts[parts.length - 1] += token;
      continue;
    }
    const tokenParts = hypher.hyphenate(token);
    parts.push(...(tokenParts.length ? tokenParts : [token]));
  }
  return parts.length >= 2 && parts.join('') === word ? parts : [];
}

const sourceRows = parseCsv(readFileSync(files[0], 'utf8'));
const oldHeaders = sourceRows.shift();
const oldIndex = Object.fromEntries(oldHeaders.map((name, index) => [name, index]));
const headers = [...oldHeaders.filter((name) => name !== 'variants'), 'variants'];
const rows = sourceRows.map((sourceRow) => {
  const row = Object.fromEntries(oldHeaders.map((name, index) => [name, sourceRow[index] ?? '']));
  row.mot = wordOverrides[row.id] ?? row.mot;
  row.intitule = labelOverrides[row.theme] ?? row.intitule;
  row.phrase_a_trou = sentenceOverrides[row.id] ?? row.phrase_a_trou;
  row.syllabes_ecrites = writtenSyllables(row.mot).join('-');
  row.variants = variantOverrides[row.id] ?? row.variants ?? '';
  if (row.id === 'tatoueuse-encre') row.sprite = 'english-lab-ink:0:1:1';
  return headers.map((name) => row[name] ?? '');
});

const ids = new Set(sourceRows.map((row) => row[oldIndex.id]));
for (const id of [...Object.keys(wordOverrides), ...Object.keys(sentenceOverrides), ...Object.keys(variantOverrides)]) {
  if (!ids.has(id)) throw new Error(`Correction sans entrée correspondante : ${id}`);
}

const csv = encodeCsv([headers, ...rows]);
for (const file of files) writeFileSync(file, csv);
console.log(`${rows.length} entrées English Lab révisées dans ${files.length} fichiers.`);
