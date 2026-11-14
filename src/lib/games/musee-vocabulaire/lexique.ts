export type Word = {
  id: string;
  theme: string;
  label: string;
  tier: 'base' | 'avance';
  word: string;
  definition: string;
  sentence: string;
  syllables: string[];
  sprite: string;
};

const columns = ['id', 'theme', 'intitule', 'parcours', 'mot', 'definition', 'phrase_a_trou', 'syllabes_ecrites', 'sprite'];

export const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('fr').replaceAll('’', "'");
export const gridWord = (value: string) => value.toLocaleUpperCase('fr').replace(/[^\p{L}]/gu, '');
const frenchLetters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÆÇÉÈÊËÎÏÔŒÙÛÜŸ');

export function letterChoices(word: string): string[] {
  const needed = [...new Set(Array.from(gridWord(word)))];
  const extras = shuffle(frenchLetters.filter((letter) => !needed.includes(letter))).slice(0, needed.length);
  return shuffle([...needed, ...extras]);
}

export function matchRounds(words: readonly Word[]): Word[][] {
  const pool: Word[] = [];
  const names = new Set<string>();
  const sprites = new Set<string>();
  for (const word of words) {
    const name = normalize(word.word);
    if (!word.sprite || names.has(name) || sprites.has(word.sprite)) continue;
    pool.push(word);
    names.add(name);
    sprites.add(word.sprite);
  }
  if (pool.length < 2) return [];
  const count = Math.ceil(pool.length / 6);
  return Array.from({ length: count }, (_, i) =>
    pool.slice(Math.ceil(i * pool.length / count), Math.ceil((i + 1) * pool.length / count)));
}

const atlas: Record<string, [number, number]> = {
  'ecole-sprites-v1': [3, 3], actions: [3, 3], quotidien2: [3, 3], emotions: [3, 3],
  maison: [4, 3], courses: [4, 3], ville: [4, 3], corps: [4, 3], loisirs: [4, 3],
  quotidien: [4, 3], demarches: [4, 3], numerique: [4, 3], formation: [3, 3], metiers: [4, 4]
};

// Some generated sheets use wider frames on the last row.
const irregular: Record<string, [number, number, number, number]> = {
  'formation:7': [0.012, 0.666, 0.48, 0.322],
  'formation:8': [0.507, 0.666, 0.48, 0.322],
  'numerique:10': [0.035, 0.685, 0.425, 0.3],
  'numerique:11': [0.51, 0.685, 0.46, 0.3]
};

function spriteCoordinates(sprite: string) {
  const [sheet, cell, width, height, ...rest] = sprite.split(':');
  if (!/^[a-z0-9-]+$/.test(sheet) || !/^\d+$/.test(cell ?? '') || rest.length) return;
  const regular = width === undefined && height === undefined && Object.hasOwn(atlas, sheet);
  const [cols, rows] = regular ? atlas[sheet] : [Number(width), Number(height)];
  const index = Number(cell);
  if (![cols, rows].every((n) => Number.isInteger(n) && n >= 1 && n <= 32) || index >= cols * rows) return;
  return { sheet, index, cols, rows };
}

export function spriteStyle(base: string, sprite: string): string {
  const coords = spriteCoordinates(sprite);
  if (!coords) return '';
  const { sheet, index, cols, rows } = coords;
  const [x, y, w, h] = irregular[sprite] ?? [index % cols / cols, Math.floor(index / cols) / rows, 1 / cols, 1 / rows];
  return `background-image:url('${base}/images/musee-vocabulaire/${sheet}.png');background-size:${100 / w}% ${100 / h}%;background-position:${w === 1 ? 0 : 100 * x / (1 - w)}% ${h === 1 ? 0 : 100 * y / (1 - h)}%;`;
}

export function readLexique(input: string): Word[] {
  const source = input.replace(/^\uFEFF/, '').trimEnd();
  const separator = source.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === separator || char === '\n' || char === '\r')) {
      row.push(value.trim());
      value = '';
      if (char !== separator) {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === '\r' && source[i + 1] === '\n') i++;
      }
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('Un champ du CSV contient des guillemets non fermés.');
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  const required = columns.slice(0, 6);
  if (!rows.length || !required.every((key) => headers.includes(key)) || new Set(headers).size !== headers.length) {
    throw new Error('Le CSV doit contenir des entrées et les colonnes id, theme, intitule, parcours, mot et definition.');
  }
  const ids = new Set<string>();
  return rows.map((fields, index) => {
    const get = (key: string) => fields[headers.indexOf(key)]?.normalize('NFC') ?? '';
    const [id, theme, label, tier, word, definition, sentence, syllables, sprite] = columns.map(get);
    const parts = syllables ? syllables.split('-') : [];
    const validSprite = !sprite || spriteCoordinates(sprite);
    if (fields.length !== headers.length || !id || ids.has(id) || !theme || !label || !word || !definition ||
        (tier !== 'base' && tier !== 'avance') || !validSprite ||
        (sentence && sentence.split('___').length !== 2) ||
        (parts.length && (parts.length < 2 || !parts.every(Boolean) || normalize(parts.join('')) !== normalize(word)))) {
      throw new Error(`Entrée CSV ${index + 2} invalide (${id || 'identifiant manquant'}).`);
    }
    ids.add(id);
    return { id, theme, label, tier, word, definition, sentence, syllables: parts, sprite };
  });
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const gridSize = 14;
export function makeGrid(words: Word[]) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]));
  const placed = shuffle(words.filter(({ word }) => /^[\p{L}]+$/u.test(word) && gridWord(word).length >= 3 && gridWord(word).length <= 11))
    .slice(0, 6).map((entry, index) => {
      const letters = gridWord(entry.word);
      const vertical = index >= 3;
      const offset = Math.floor(Math.random() * ((vertical ? gridSize - 3 : gridSize) - letters.length + 1));
      const cells = Array.from(letters, (letter, i) => {
        const row = vertical ? 3 + offset + i : index;
        const col = vertical ? 2 + (index - 3) * 4 : offset + i;
        grid[row][col] = letter;
        return row * gridSize + col;
      });
      return { entry, cells, letters };
    });
  // Accept any exact forward occurrence, including one formed by filler or crossings.
  const targets = placed.map(({ entry, letters }) => {
    const paths: number[][] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          if (Array.from(letters).every((letter, i) => grid[row + i * dr]?.[col + i * dc] === letter)) {
            paths.push(Array.from(letters, (_, i) => (row + i * dr) * gridSize + col + i * dc));
          }
        }
      }
    }
    return { entry, paths };
  });
  return { cells: grid.flat(), targets };
}
