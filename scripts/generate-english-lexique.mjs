import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'static/vocabulaire/lexique.csv');
const outputPaths = [
  resolve(root, 'static/vocabulaire/english-lab.csv'),
  resolve(root, 'src/lib/games/musee-vocabulaire/data/english-lab.csv')
];
const separator = '\n§§§\n';
const blankToken = 'ZXQBLANKZXQ';
const protectBlank = (value) => value.replaceAll('___', blankToken);
const restoreBlank = (value) => value.replaceAll(blankToken, '___');

const computingRows = [
  ['computer-screen', 'computing', 'Computer hardware', 'base', 'screen', 'écran', '', 'screen', ''],
  ['computer-keyboard', 'computing', 'Computer hardware', 'base', 'keyboard', 'clavier', '', 'key-board', ''],
  ['computer-mouse', 'computing', 'Computer hardware', 'base', 'mouse', 'souris', '', 'mouse', ''],
  ['computer-file', 'computing', 'Computer hardware', 'base', 'file', 'fichier', '', 'file', ''],
  ['computer-folder', 'computing', 'Computer hardware', 'base', 'folder', 'dossier', '', 'fold-er', ''],
  ['computer-password', 'computing', 'Digital safety', 'base', 'password', 'mot de passe', '', 'pass-word', ''],
  ['computer-privacy', 'computing', 'Digital safety', 'base', 'privacy', 'vie privée', '', 'pri-va-cy', ''],
  ['computer-click', 'computer-actions', 'Computer actions', 'base', 'click', 'cliquer', '', 'click', ''],
  ['computer-save', 'computer-actions', 'Computer actions', 'base', 'save', 'enregistrer', '', 'save', ''],
  ['computer-download', 'computer-actions', 'Computer actions', 'base', 'download', 'télécharger', '', 'down-load', '']
];

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

async function translateBatch(texts) {
  const query = new URLSearchParams({ client: 'gtx', sl: 'fr', tl: 'en', dt: 't', q: texts.join(separator) });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`);
  if (!response.ok) throw new Error(`Traduction HTTP ${response.status}`);
  const body = await response.json();
  const translated = body[0].map((part) => part[0]).join('');
  const results = translated.split(/\n?§§§\n?/).map((value) => value.trim());
  if (results.length !== texts.length) throw new Error(`Lot traduit incomplet : ${results.length}/${texts.length}`);
  return results;
}

async function translateAll(values) {
  const unique = [...new Set(values.filter(Boolean))];
  const translations = new Map();
  let batch = [], length = 0;
  const flush = async () => {
    if (!batch.length) return;
    let translated;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { translated = await translateBatch(batch); break; }
      catch (error) {
        if (attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    batch.forEach((source, index) => translations.set(source, translated[index]));
    process.stdout.write(`\r${translations.size}/${unique.length} textes traduits`);
    batch = []; length = 0;
  };
  for (const value of unique) {
    if (batch.length && length + value.length > 3000) await flush();
    batch.push(value); length += value.length + separator.length;
  }
  await flush();
  process.stdout.write('\n');
  return translations;
}

const rows = parseCsv(readFileSync(sourcePath, 'utf8'));
const headers = rows.shift();
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const values = rows.flatMap((row) => [row[index.intitule], row[index.mot], protectBlank(row[index.phrase_a_trou])]);
const translations = await translateAll(values);
const outputHeaders = ['id', 'theme', 'intitule', 'parcours', 'mot', 'definition', 'phrase_a_trou', 'syllabes_ecrites', 'sprite'];
const outputRows = rows.map((row) => {
  const englishWord = translations.get(row[index.mot]) ?? row[index.mot];
  let sentence = row[index.phrase_a_trou] ? restoreBlank(translations.get(protectBlank(row[index.phrase_a_trou])) ?? '') : '';
  if (sentence && sentence.split('___').length !== 2) {
    sentence = `The French word “${row[index.mot]}” is translated as ___ in English.`;
  }
  return [
    row[index.id], row[index.theme], translations.get(row[index.intitule]) ?? row[index.intitule],
    row[index.parcours], englishWord, row[index.mot], sentence, '', row[index.sprite]
  ];
});
outputRows.push(...computingRows);
const csv = encodeCsv([outputHeaders, ...outputRows]);
for (const outputPath of outputPaths) writeFileSync(outputPath, csv);
console.log(`${outputRows.length} entrées anglaises écrites dans ${outputPaths.length} fichiers.`);
