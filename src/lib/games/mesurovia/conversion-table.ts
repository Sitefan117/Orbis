export type ConversionFamilyId = 'length' | 'capacity' | 'mass' | 'area' | 'volume' | 'duration';

export type ConversionUnit = {
  key: string;
  label: string;
  factor: number;
  alias?: string;
};

export type ConversionFamily = {
  id: ConversionFamilyId;
  name: string;
  power: 1 | 2 | 3;
  units: ConversionUnit[];
  example: { value: string; from: string; to: string };
  note: string;
};

export type PlacementCell = {
  index: number;
  value: string;
  original: boolean;
  addedZero: boolean;
  groupIndex: number;
  subIndex: number;
};

const metricFamilies: ConversionFamily[] = [
  {
    id: 'length', name: 'Longueurs', power: 1,
    units: [
      { key: 'km', label: 'km', factor: 1000 }, { key: 'hm', label: 'hm', factor: 100 },
      { key: 'dam', label: 'dam', factor: 10 }, { key: 'm', label: 'm', factor: 1 },
      { key: 'dm', label: 'dm', factor: .1 }, { key: 'cm', label: 'cm', factor: .01 },
      { key: 'mm', label: 'mm', factor: .001 }
    ],
    example: { value: '2,4', from: 'm', to: 'cm' },
    note: 'Une case par unité : chaque déplacement correspond à un facteur 10.'
  },
  {
    id: 'capacity', name: 'Capacités', power: 1,
    units: [
      { key: 'kL', label: 'kL', factor: 1000 }, { key: 'hL', label: 'hL', factor: 100 },
      { key: 'daL', label: 'daL', factor: 10 }, { key: 'L', label: 'L', factor: 1 },
      { key: 'dL', label: 'dL', factor: .1 }, { key: 'cL', label: 'cL', factor: .01 },
      { key: 'mL', label: 'mL', factor: .001 }
    ],
    example: { value: '1,5', from: 'L', to: 'mL' },
    note: 'Une case par unité : L, dL, cL et mL restent visibles avec leurs intermédiaires.'
  },
  {
    id: 'mass', name: 'Masses', power: 1,
    units: [
      { key: 'kg', label: 'kg', factor: 1000 }, { key: 'hg', label: 'hg', factor: 100 },
      { key: 'dag', label: 'dag', factor: 10 }, { key: 'g', label: 'g', factor: 1 },
      { key: 'dg', label: 'dg', factor: .1 }, { key: 'cg', label: 'cg', factor: .01 },
      { key: 'mg', label: 'mg', factor: .001 }
    ],
    example: { value: '2,4', from: 'kg', to: 'g' },
    note: 'Une case par unité : kg, hg, dag, g, dg, cg et mg. Chaque déplacement correspond à un facteur 10.'
  },
  {
    id: 'area', name: 'Aires', power: 2,
    units: [
      { key: 'km²', label: 'km²', factor: 1_000_000 },
      { key: 'hm²', label: 'hm²', factor: 10_000, alias: 'ha' },
      { key: 'dam²', label: 'dam²', factor: 100, alias: 'a' },
      { key: 'm²', label: 'm²', factor: 1 }, { key: 'dm²', label: 'dm²', factor: .01 },
      { key: 'cm²', label: 'cm²', factor: .0001 }, { key: 'mm²', label: 'mm²', factor: .000001 }
    ],
    example: { value: '2,4', from: 'm²', to: 'cm²' },
    note: 'Deux cases par unité d’aire. 1 hm² = 1 ha et 1 dam² = 1 a.'
  },
  {
    id: 'volume', name: 'Volumes', power: 3,
    units: [
      { key: 'm³', label: 'm³', factor: 1 },
      { key: 'dm³', label: 'dm³', factor: .001, alias: 'L' },
      { key: 'cm³', label: 'cm³', factor: .000001, alias: 'mL' },
      { key: 'mm³', label: 'mm³', factor: .000000001 }
    ],
    example: { value: '1,5', from: 'm³', to: 'dm³' },
    note: 'Trois cases par unité de volume. 1 dm³ = 1 L et 1 cm³ = 1 mL.'
  }
];

export const durationFamily: ConversionFamily = {
  id: 'duration', name: 'Durées', power: 1,
  units: [
    { key: 'an', label: 'année', factor: 12 }, { key: 'mois', label: 'mois', factor: 1 },
    { key: 'sem', label: 'sem', factor: 604800 }, { key: 'j', label: 'j', factor: 86400 },
    { key: 'h', label: 'h', factor: 3600 }, { key: 'min', label: 'min', factor: 60 },
    { key: 's', label: 's', factor: 1 }
  ],
  example: { value: '2,5', from: 'h', to: 'min' },
  note: 'Le temps n’est pas décimal : on utilise 60, 24, 7 ou le calendrier.'
};

export const conversionFamilies = [...metricFamilies, durationFamily];

export function getConversionFamily(id: string): ConversionFamily {
  return conversionFamilies.find((family) => family.id === id) ?? conversionFamilies[0];
}

export function parseLocalizedNumber(raw: string): number {
  return Number(raw.trim().replace(/\s/g, '').replace(',', '.'));
}

export function formatLocalizedNumber(value: number): string {
  const clean = Number(Number(value).toPrecision(12));
  return clean.toLocaleString('fr-CH', { maximumFractionDigits: 9 }).replace(/\u202f/g, ' ');
}

export function unitAnchor(family: ConversionFamily, unit: string): number {
  const group = family.units.findIndex((candidate) => candidate.key === unit || candidate.alias === unit);
  return group < 0 ? -1 : group * family.power + family.power - 1;
}

/** Lit les chiffres du tableau dans l’unité demandée, sans dépendre d’un nombre caché. */
export function readPlacementCells(cells: string[], family: ConversionFamily, unit: string): string {
  const anchor = unitAnchor(family, unit);
  if (anchor < 0 || cells.every((cell) => !/\d/.test(cell))) return '';
  const occupied = cells.flatMap((cell, index) => /\d/.test(cell) ? [index] : []);
  const start = Math.min(anchor, ...occupied);
  const end = Math.max(anchor, ...occupied);
  const digits = Array.from({ length: end - start + 1 }, (_, offset) => cells[start + offset] || '0');
  const decimalAt = anchor - start + 1;
  let whole = digits.slice(0, decimalAt).join('') || '0';
  let decimal = digits.slice(decimalAt).join('');
  whole = whole.replace(/^0+(?=\d)/, '') || '0';
  decimal = decimal.replace(/0+$/, '');
  return decimal ? `${whole},${decimal}` : whole;
}

export function canConvert(family: ConversionFamily, from: string, to: string): boolean {
  if (family.id !== 'duration') return unitAnchor(family, from) >= 0 && unitAnchor(family, to) >= 0;
  const calendar = new Set(['an', 'mois']);
  return (calendar.has(from) && calendar.has(to)) || (!calendar.has(from) && !calendar.has(to));
}

export function convertTableValue(value: number, family: ConversionFamily, from: string, to: string): number | null {
  if (!Number.isFinite(value) || !canConvert(family, from, to)) return null;
  const fromUnit = family.units.find((unit) => unit.key === from || unit.alias === from);
  const toUnit = family.units.find((unit) => unit.key === to || unit.alias === to);
  if (!fromUnit || !toUnit) return null;
  return Number((value * fromUnit.factor / toUnit.factor).toPrecision(12));
}

export function buildPlacement(raw: string, family: ConversionFamily, from: string, to: string, completeZeros = true) {
  const count = family.units.length * family.power;
  const cells: PlacementCell[] = Array.from({ length: count }, (_, index) => ({
    index, value: '', original: false, addedZero: false,
    groupIndex: Math.floor(index / family.power), subIndex: index % family.power
  }));
  const sourceAnchor = unitAnchor(family, from);
  const targetAnchor = unitAnchor(family, to);
  const normalized = raw.trim().replace(/\s/g, '').replace('.', ',').replace(/[^\d,]/g, '');
  const [wholeRaw = '', decimalRaw = ''] = normalized.split(',');
  const whole = wholeRaw || '0';
  const occupied: number[] = [];

  [...whole].reverse().forEach((digit, offset) => {
    const index = sourceAnchor - offset;
    if (index >= 0 && index < count) {
      cells[index].value = digit;
      cells[index].original = true;
      occupied.push(index);
    }
  });
  [...decimalRaw].forEach((digit, offset) => {
    const index = sourceAnchor + offset + 1;
    if (index >= 0 && index < count) {
      cells[index].value = digit;
      cells[index].original = true;
      occupied.push(index);
    }
  });

  if (completeZeros && sourceAnchor >= 0 && targetAnchor >= 0) {
    const start = Math.min(targetAnchor, ...occupied);
    const end = Math.max(targetAnchor, ...occupied);
    for (let index = start; index <= end; index += 1) {
      if (!cells[index].value) {
        cells[index].value = '0';
        cells[index].addedZero = true;
      }
    }
  }

  return {
    cells, sourceAnchor, targetAnchor,
    overflowLeft: whole.length > sourceAnchor + 1,
    overflowRight: sourceAnchor + decimalRaw.length >= count
  };
}

export function durationRelation(from: string, to: string): string {
  const pair = `${from}:${to}`;
  const direct: Record<string, string> = {
    'an:mois': '1 année = 12 mois', 'mois:an': '12 mois = 1 année',
    'sem:j': '1 semaine = 7 jours', 'j:sem': '7 jours = 1 semaine',
    'j:h': '1 jour = 24 heures', 'h:j': '24 heures = 1 jour',
    'h:min': '1 heure = 60 minutes', 'min:h': '60 minutes = 1 heure',
    'min:s': '1 minute = 60 secondes', 's:min': '60 secondes = 1 minute'
  };
  return direct[pair] ?? 'On décompose la durée avec les rapports 60, 24 et 7.';
}
