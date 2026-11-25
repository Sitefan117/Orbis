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
const officialSources = [
  { grade: '7e', gradeLabel: '7ᵉ', file: resolve(root, 'static/vocabulaire/english-lab-official-7e.csv') },
  { grade: '8e', gradeLabel: '8ᵉ', file: resolve(root, 'static/vocabulaire/english-lab-official-8e.csv') }
];
const hypher = new Hypher(english);

function parseCsv(source) {
  const delimiter = source.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { value += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && (char === delimiter || char === '\n' || char === '\r')) {
      row.push(value); value = '';
      if (char !== delimiter) {
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

const cleanCell = (value) => String(value ?? '').normalize('NFC').replace(/[\t\u00a0]+/gu, ' ').replace(/\s+/gu, ' ').trim();
const slugify = (value) => cleanCell(value).normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'entree';

function officialVocabularyRows(headers) {
  const result = [];
  const usedIds = new Set();
  for (const source of officialSources) {
    const sourceRows = parseCsv(readFileSync(source.file, 'utf8'));
    const sourceHeaders = sourceRows.shift().map(cleanCell);
    const sourceIndex = Object.fromEntries(sourceHeaders.map((name, index) => [name, index]));
    for (const row of sourceRows) {
      const unit = cleanCell(row[sourceIndex.Unit]);
      const category = cleanCell(row[sourceIndex.Category]);
      let word = cleanCell(row[sourceIndex.English]);
      let definition = cleanCell(row[sourceIndex['Français']]);
      const notes = cleanCell(row[sourceIndex.Notes]);
      if (word === 'Can I try on this shirt please?') word = 'Can I try on this shirt, please?';
      if (word === 'Dear Ben') word = 'Dear Ben,';
      if (word === 'Love from Aisha') definition = 'Affectueusement, Aisha';
      const unitNumber = unit.match(/\d+/)?.[0];
      if (!unitNumber || !category || !word || !definition) throw new Error(`Entrée officielle incomplète : ${source.grade} ${unit} ${category}`);
      const theme = `official-${source.grade}-u${unitNumber}-${slugify(category)}`;
      const stem = `${theme}-${slugify(word)}`;
      let id = stem;
      for (let suffix = 2; usedIds.has(id); suffix++) id = `${stem}-${suffix}`;
      usedIds.add(id);
      const values = {
        id,
        theme,
        intitule: `${source.gradeLabel} — Unité ${unitNumber} — ${category}`,
        parcours: 'base',
        mot: word,
        definition,
        phrase_a_trou: '',
        syllabes_ecrites: writtenSyllables(word).join('-'),
        sprite: '',
        variants: notes.replace(/^Plural:\s*/i, 'Pluriel : ')
      };
      result.push(headers.map((name) => values[name] ?? ''));
    }
  }
  return result;
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
const baseSourceRows = sourceRows.filter((sourceRow) => !sourceRow[oldIndex.id]?.startsWith('official-'));
const rows = baseSourceRows.map((sourceRow) => {
  const row = Object.fromEntries(oldHeaders.map((name, index) => [name, sourceRow[index] ?? '']));
  row.mot = wordOverrides[row.id] ?? row.mot;
  row.intitule = labelOverrides[row.theme] ?? row.intitule;
  row.phrase_a_trou = sentenceOverrides[row.id] ?? row.phrase_a_trou;
  row.syllabes_ecrites = writtenSyllables(row.mot).join('-');
  row.variants = variantOverrides[row.id] ?? row.variants ?? '';
  if (row.id === 'tatoueuse-encre') row.sprite = 'english-lab-ink:0:1:1';
  return headers.map((name) => row[name] ?? '');
});
rows.push(...officialVocabularyRows(headers));

const ids = new Set(baseSourceRows.map((row) => row[oldIndex.id]));
for (const id of [...Object.keys(wordOverrides), ...Object.keys(sentenceOverrides), ...Object.keys(variantOverrides)]) {
  if (!ids.has(id)) throw new Error(`Correction sans entrée correspondante : ${id}`);
}

const csv = encodeCsv([headers, ...rows]);
for (const file of files) writeFileSync(file, csv);
console.log(`${rows.length} entrées English Lab révisées dans ${files.length} fichiers.`);
