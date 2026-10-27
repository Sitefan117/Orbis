/** Fonctions mathématiques de Shift : rangs, valeurs, nombres en mots et saisies. */
export interface PlaceValue {
  key: string;
  label: string;
  short: string;
  exp: number;
  symbol: string;
}

// Référentiel unique des rangs ; l’exposant définit la puissance de dix du rang.
export const PLACE_VALUES: PlaceValue[] = [
  { key: 'hundredBillion', label: 'Centaines de milliards', short: 'C Md', exp: 11, symbol: '▦' },
  { key: 'tenBillion', label: 'Dizaines de milliards', short: 'D Md', exp: 10, symbol: '▦' },
  { key: 'billion', label: 'Milliards', short: 'Md', exp: 9, symbol: '▦' },
  { key: 'hundredMillion', label: 'Centaines de millions', short: 'C Mio', exp: 8, symbol: '▦' },
  { key: 'tenMillion', label: 'Dizaines de millions', short: 'D Mio', exp: 7, symbol: '▦' },
  { key: 'million', label: 'Millions', short: 'Mio', exp: 6, symbol: '▦' },
  { key: 'hundredThousand', label: 'Centaines de milliers', short: 'C milliers', exp: 5, symbol: '▦' },
  { key: 'tenThousand', label: 'Dizaines de milliers', short: 'D milliers', exp: 4, symbol: '▦' },
  { key: 'thousand', label: 'Milliers', short: 'M', exp: 3, symbol: '▦' },
  { key: 'hundred', label: 'Centaines', short: 'C', exp: 2, symbol: '▦' },
  { key: 'ten', label: 'Dizaines', short: 'D', exp: 1, symbol: '▦' },
  { key: 'unit', label: 'Unités', short: 'U', exp: 0, symbol: '▪' },
  { key: 'tenth', label: 'Dixièmes', short: 'dixièmes', exp: -1, symbol: '◌' },
  { key: 'hundredth', label: 'Centièmes', short: 'centièmes', exp: -2, symbol: '◌' },
  { key: 'thousandth', label: 'Millièmes', short: 'millièmes', exp: -3, symbol: '◌' }
];

export const TICK_WEIGHT: Record<string, number> = Object.fromEntries(
  PLACE_VALUES.map((place) => [place.key, Math.pow(10, place.exp + 3)])
);
export const PLACE_BY_KEY: Record<string, PlaceValue> = Object.fromEntries(
  PLACE_VALUES.map((place) => [place.key, place])
);
export const LINE_TICKS = Array.from({ length: 21 }, (_, index) => index * 5);
export const TEN_BLOCKS = Array.from({ length: 10 }, (_, index) => index);
export const HUNDRED_BLOCKS = Array.from({ length: 100 }, (_, index) => index);

// Configure les rangs visibles puis convertit entre cases, graduations et nombres.
export function emptyCounts(): Record<string, number> {
  return Object.fromEntries(PLACE_VALUES.map((place) => [place.key, 0]));
}

export function getRanksForMission(missionId: string, difficultyId: string): PlaceValue[] {
  if (missionId === 'factory') {
    if (difficultyId === 'starter') return PLACE_VALUES.filter((place) => place.exp >= 0 && place.exp <= 2);
    if (difficultyId === 'decimal') return PLACE_VALUES.filter((place) => place.exp <= 3 && place.exp >= -3);
    if (difficultyId === 'expedition') return PLACE_VALUES.filter((place) => place.exp >= 0);
    return PLACE_VALUES.filter((place) => place.exp >= 0 && place.exp <= 3);
  }
  if (missionId === 'decompose') {
    if (difficultyId === 'starter') return PLACE_VALUES.filter((place) => place.exp >= 0 && place.exp <= 2);
    if (difficultyId === 'workshop') return PLACE_VALUES.filter((place) => place.exp >= 0 && place.exp <= 3);
    if (difficultyId === 'decimal') return PLACE_VALUES.filter((place) => place.exp <= 3 && place.exp >= -3);
    return PLACE_VALUES;
  }
  return PLACE_VALUES.filter((place) => place.exp >= 0 && place.exp <= 3);
}

export function valueFromCounts(counts: Record<string, number>): number {
  return PLACE_VALUES.reduce((sum, place) => sum + (Number(counts[place.key]) || 0) * TICK_WEIGHT[place.key], 0);
}

export function decomposeTicks(ticks: number, ranks: PlaceValue[] = PLACE_VALUES): Record<string, number> {
  const safeTicks = Math.max(0, Math.round(ticks));
  const result: Record<string, number> = {};
  for (const place of ranks) {
    const weight = TICK_WEIGHT[place.key];
    result[place.key] = Math.floor(safeTicks / weight + 1e-8) % 10;
  }
  return result;
}

// Présentation des valeurs avec les conventions françaises de Suisse.
export function formatTicks(ticks: number, maxDecimals = 3): string {
  const value = Math.max(0, Math.round(ticks)) / 1000;
  const hasDecimal = Math.round(ticks) % 1000 !== 0;
  return new Intl.NumberFormat('fr-CH', {
    maximumFractionDigits: hasDecimal ? maxDecimals : 0,
    minimumFractionDigits: 0
  }).format(value);
}

export function formatValue(value: number, maxDecimals = 3): string {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: maxDecimals }).format(value);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeTargetTicks(difficultyId: string): number {
  if (difficultyId === 'starter') return randomInt(1, 999) * 1000;
  if (difficultyId === 'workshop') return randomInt(1, 9999) * 1000;
  if (difficultyId === 'decimal') return randomInt(1, 9999999);
  return randomInt(1, 999999999999) * 1000;
}

// Convertit un entier en mots, avec septante, huitante et nonante.
export function numberToSwissText(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'zéro';
  const groups = [
    { base: 1_000_000_000, singular: 'milliard', plural: 'milliards', type: 'named' },
    { base: 1_000_000, singular: 'million', plural: 'millions', type: 'named' },
    { base: 1000, singular: 'mille', plural: 'mille', type: 'thousand' },
    { base: 1, singular: '', plural: '', type: 'units' }
  ];
  let remaining = n;
  const parts: string[] = [];
  for (const group of groups) {
    const amount = Math.floor(remaining / group.base);
    remaining %= group.base;
    if (!amount) continue;
    if (group.type === 'named') {
      parts.push(`${underThousandSwiss(amount)} ${amount === 1 ? group.singular : group.plural}`);
    } else if (group.type === 'thousand') {
      const amountText = underThousandSwiss(amount).replace(/cents$/, 'cent');
      parts.push(amount === 1 ? 'mille' : `${amountText} mille`);
    } else {
      parts.push(underThousandSwiss(amount));
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function underThousandSwiss(n: number): string {
  if (n === 0) return '';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tensWords = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'septante', 'huitante', 'nonante'];
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) {
    if (hundreds === 1) parts.push('cent');
    else parts.push(`${units[hundreds]} cent${rest === 0 ? 's' : ''}`);
  }
  if (rest > 0) {
    if (rest < 10) parts.push(units[rest]);
    else if (rest < 20) parts.push(teens[rest - 10]);
    else {
      const tens = Math.floor(rest / 10);
      const unit = rest % 10;
      if (unit === 1) parts.push(`${tensWords[tens]} et un`);
      else if (unit > 1) parts.push(`${tensWords[tens]}-${units[unit]}`);
      else parts.push(tensWords[tens]);
    }
  }
  return parts.join(' ');
}

// Nettoie les mots ou nombres saisis avant analyse de la réponse.
export function normalizeWords(text: string): string {
  return String(text || '').toLocaleLowerCase('fr-CH')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function parseNumberInput(text: string): number | null {
  let cleaned = String(text ?? '').trim().replace(/[\s\u00a0\u202f'’]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else {
    cleaned = cleaned.replace(',', '.');
  }
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
