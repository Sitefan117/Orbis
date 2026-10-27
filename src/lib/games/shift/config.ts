/** Configuration pédagogique de Shift : niveaux, missions et unités de mesure. */
export interface ShiftDifficulty {
  id: string;
  name: string;
  range: string;
  maxInteger: number;
  minTicks: number;
  maxTicks: number;
}

export interface ShiftMission {
  id: string;
  number: string;
  section: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  skills: string;
  theme: string;
}

export interface MeasureUnit {
  name: string;
  exp?: number;
  factor?: number;
}

export const DIFFICULTIES: ShiftDifficulty[] = [
  { id: 'starter', name: 'Réactivation', range: 'Jusqu’à 999', maxInteger: 999, minTicks: 1000, maxTicks: 999000 },
  { id: 'workshop', name: 'Atelier', range: 'Jusqu’à 9’999', maxInteger: 9999, minTicks: 1000, maxTicks: 9999000 },
  { id: 'decimal', name: 'Décimaux', range: 'Jusqu’à 9’999,999', maxInteger: 9999, minTicks: 1, maxTicks: 9999999 },
  { id: 'expedition', name: 'Grande expédition', range: 'Jusqu’à 999’999’999’999', maxInteger: 999999999999, minTicks: 1, maxTicks: 999999999999999 }
];

export const MISSIONS: ShiftMission[] = [
  {
    id: 'factory', number: '01', section: 'Les fondamentaux', icon: '▦', title: 'La fabrique des nombres',
    subtitle: 'Récupère, échange et livre la bonne quantité.',
    description: 'Comprendre pourquoi 10 unités font 1 dizaine, et pourquoi la valeur reste la même après un échange.',
    skills: 'Composer · Décomposer · Échanger par 10', theme: 'mint'
  },
  {
    id: 'measure', number: '02', section: 'Dans la vraie vie', icon: '↔', title: 'Le convertisseur',
    subtitle: 'Fais passer les mesures d’une unité à l’autre.',
    description: 'Longueurs, masses, capacités, surfaces, volumes et durées : choisis la bonne unité et le bon facteur.',
    skills: 'Longueur · masse · capacité · surface · volume · durée · équivalences m³/L', theme: 'blue'
  },
  {
    id: 'words', number: '03', section: 'Le scanner', icon: 'Aa', title: 'Le scanner de nombres',
    subtitle: 'Passe de l’écriture en chiffres aux mots-nombres.',
    description: 'Lis, écris et vérifie des nombres, du nombre familier aux très grandes quantités.',
    skills: 'Écriture chiffrée ↔ mot-nombre', theme: 'amber'
  },
  {
    id: 'decompose', number: '04', section: 'Le labo', icon: '▤', title: 'Le labo des rangs',
    subtitle: 'Découpe un nombre rang par rang.',
    description: 'Repère le chiffre des milliards, des unités, des dixièmes ou des millièmes.',
    skills: 'Valeur de position · Zéros · Décomposition', theme: 'violet'
  },
  {
    id: 'sort', number: '05', section: 'Le centre de tri', icon: '⇅', title: 'Le centre de tri',
    subtitle: 'Range les colis du plus petit au plus grand.',
    description: 'Compare, ordonne et repère les nombres qui se ressemblent sans avoir la même valeur.',
    skills: '< · > · Ordre croissant', theme: 'pink'
  },
  {
    id: 'line', number: '06', section: 'Le rail', icon: '⌁', title: 'La ligne de précision',
    subtitle: 'Place le nombre à la bonne position.',
    description: 'Lis une droite graduée et utilise les repères pour situer une quantité.',
    skills: 'Droite graduée · Repères · Encadrement', theme: 'blue'
  },
  {
    id: 'rank', number: '07', section: 'Le scanner', icon: '⌕', title: 'Le compteur de rangs',
    subtitle: 'Compte les dizaines, les centaines ou les millièmes entiers.',
    description: 'Distingue le chiffre d’un rang du nombre entier de groupes de ce rang.',
    skills: 'Dizaines entières · Centièmes entiers · Millièmes', theme: 'amber'
  },
  {
    id: 'build', number: '08', section: 'Les défis', icon: '↗', title: 'Crée un nombre',
    subtitle: 'Construis un nombre plus grand ou plus petit.',
    description: 'Choisis une valeur qui respecte une contrainte, puis vérifie ta stratégie.',
    skills: 'Plus grand · Plus petit · Encadrement', theme: 'mint'
  }
];

export const MEASURE_UNITS: Record<string, MeasureUnit[]> = {
  Longueur: [
    { name: 'mm', exp: -3 }, { name: 'cm', exp: -2 }, { name: 'dm', exp: -1 },
    { name: 'm', exp: 0 }, { name: 'dam', exp: 1 }, { name: 'hm', exp: 2 }, { name: 'km', exp: 3 }
  ],
  Masse: [
    { name: 'mg', exp: -3 }, { name: 'cg', exp: -2 }, { name: 'dg', exp: -1 },
    { name: 'g', exp: 0 }, { name: 'dag', exp: 1 }, { name: 'hg', exp: 2 }, { name: 'kg', exp: 3 }
  ],
  Capacité: [
    { name: 'mL', exp: -3 }, { name: 'cL', exp: -2 }, { name: 'dL', exp: -1 },
    { name: 'L', exp: 0 }, { name: 'daL', exp: 1 }, { name: 'hL', exp: 2 }, { name: 'kL', exp: 3 }
  ],
  Surface: [
    { name: 'mm²', exp: -6 }, { name: 'cm²', exp: -4 }, { name: 'dm²', exp: -2 },
    { name: 'm²', exp: 0 }, { name: 'dam²', exp: 2 }, { name: 'hm²', exp: 4 }, { name: 'km²', exp: 6 }
  ],
  Volume: [
    { name: 'mm³', exp: -9 }, { name: 'cm³', exp: -6 }, { name: 'dm³', exp: -3 },
    { name: 'm³', exp: 0 }, { name: 'dam³', exp: 3 }, { name: 'hm³', exp: 6 }, { name: 'km³', exp: 9 }
  ],
  // Correspondances utiles entre volume et capacité : 1 cm³ = 1 mL,
  // 1 dm³ = 1 L et 1 m³ = 1'000 L. Le facteur est exprimé en litres.
  'Volume et capacité': [
    { name: 'cm³', factor: 0.001 }, { name: 'mL', factor: 0.001 },
    { name: 'dm³', factor: 1 }, { name: 'L', factor: 1 },
    { name: 'm³', factor: 1000 }, { name: 'kL', factor: 1000 }
  ],
  Temps: [
    { name: 's', factor: 1 }, { name: 'min', factor: 60 },
    { name: 'h', factor: 3600 }, { name: 'j', factor: 86400 }
  ]
};
