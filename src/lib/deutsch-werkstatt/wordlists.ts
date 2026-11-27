import wortschatzCsv from '../../../Wortschatz_6H_listes.csv?raw';
import museumCsv from './musee-de.csv?raw';

export type WordListEntry = {
  id: string;
  fr: string;
  de: string;
  theme: string;
  section: string;
  source: 'Wortschatz' | 'Musée des mots';
  level: '6H' | '12–16 ans';
  article?: string;
  definition?: string;
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function readWortschatz() {
  const lines = wortschatzCsv.trim().split(/\r?\n/).slice(1);
  return lines.map((line, index) => {
    const [number, theme, section, german, french] = parseCsvLine(line);
    const article = /^(der|die|das)\b/i.exec(german)?.[1]?.toLowerCase();
    return {
      id: `wortschatz-6h-${number}-${index}`,
      fr: french,
      de: german,
      theme,
      section,
      source: 'Wortschatz',
      level: '6H',
      ...(article ? { article } : {})
    } satisfies WordListEntry;
  });
}

export const wortschatz6H = readWortschatz();
export const wortschatz6HThemes = [...new Set(wortschatz6H.map((entry) => entry.theme))];

function readMuseum() {
  const lines = museumCsv.trim().split(/\r?\n/).slice(1);
  return lines.map((line, index) => {
    const [id, theme, title, source, level, french, german, definition] = parseCsvLine(line);
    const article = /^(der|die|das)\b/i.exec(german)?.[1]?.toLowerCase();
    return {
      id: `${id}-${index}`,
      fr: french,
      de: german,
      theme: title,
      section: 'Musée des mots',
      source: source as 'Musée des mots',
      level: level as '12–16 ans',
      definition,
      ...(article ? { article } : {})
    } satisfies WordListEntry;
  });
}

export const museumEntries = readMuseum();
export const museumThemes = [...new Set(museumEntries.map((entry) => entry.theme))];
