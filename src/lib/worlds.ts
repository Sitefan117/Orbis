export type WorldId =
  | 'livrets'
  | 'geometrie'
  | 'calculs'
  | 'numeria'
  | 'pcp'
  | 'convertigo'
  | 'conju_lab'
  | 'race'
  | 'swissgamefactory'
  | 'mathhunt'
  | 'fractionstower2';

export type WorldSubject =
  | 'MATHS'
  | 'FRANÇAIS'
  | 'SCIENCES'
  | 'AUTRES'
  | 'À CLASSER';

export type GameStatus = 'available' | 'development' | 'prototype';

export interface World {
  id: WorldId;
  title: string;
  subtitle: string;
  route: string;
  /** Conservé pour compatibilité avec d'éventuels usages existants. */
  emoji: string;
  color: string;
  /** Matière affichée et utilisée par les filtres de l'Arcade. */
  subject: WorldSubject;
  /** Statut affiché sur la carte. */
  status: GameStatus;
}

export const worlds: World[] = [
  {
    id: 'race',
    title: 'Racer',
    subtitle: 'Arriveras-tu à franchir la ligne d’arrivée ?',
    route: '/race',
    emoji: '🏎️',
    color: 'blue',
    subject: 'MATHS',
    status: 'available'
  },
  {
    id: 'livrets',
    title: "L'Atelier des Livrets",
    subtitle: 'Défis de tables de multiplication.',
    route: '/livrets',
    emoji: '✖️',
    color: 'indigo',
    subject: 'MATHS',
    status: 'available'
  },
  {
    id: 'geometrie',
    title: 'Le Défi des Formes',
    subtitle: 'Connais-tu tes figures et solides sur le bout des doigts ?',
    route: '/geometrie',
    emoji: '📐',
    color: 'emerald',
    subject: 'MATHS',
    status: 'development'
  },
  {
    id: 'calculs',
    title: 'Le Calcul Décimal',
    subtitle: 'Les nombres à virgule ont-ils encore des secrets pour toi ?',
    route: '/calculs',
    emoji: '🔢',
    color: 'rose',
    subject: 'MATHS',
    status: 'available'
  },
  {
    id: 'numeria',
    title: 'Les Royaumes de Numéria',
    subtitle: 'Arriveras-tu à maîtriser les nombres aussi grands que les millions ?',
    route: '/numeria',
    emoji: '📜',
    color: 'purple',
    subject: 'MATHS',
    status: 'prototype'
  },
  {
    id: 'pcp',
    title: 'Espace PCP / Orientation',
    subtitle: 'Prêt à voir dans ton avenir ?',
    route: '/pcp',
    emoji: '💼',
    color: 'amber',
    subject: 'AUTRES',
    status: 'prototype'
  },
  {
    id: 'convertigo',
    title: 'Convertigo',
    subtitle: 'Les nombres ont différents noms, arriveras-tu à les décoder ?',
    route: '/convertigo',
    emoji: '🔄',
    color: 'blue',
    subject: 'MATHS',
    status: 'prototype'
  },
  {
    id: 'conju_lab',
    title: 'conju_lab',
    subtitle: 'Qui est le meilleur conjugueur ?',
    route: '/conju_lab',
    emoji: '🔄',
    color: 'blue',
    subject: 'FRANÇAIS',
    status: 'available'
  },
  {
    id: 'swissgamefactory',
    title: 'Swiss Game Factory',
    subtitle: 'Arriveras-tu à terminer les commandes ?',
    route: '/swissgamefactory',
    emoji: '🎮',
    color: 'green',
    subject: 'MATHS',
    status: 'development'
  },
  {
    id: 'fractionstower2',
    title: 'Fractions Tower',
    subtitle: 'Vaincras-tu la tour ?',
    route: '/fractionstower2',
    emoji: '🎮',
    color: 'green',
    subject: 'MATHS',
    status: 'available'
  },
  {
    id: 'mathhunt',
    title: 'Math Hunt',
    subtitle: 'Chasse aux canards !',
    route: '/mathhunt',
    emoji: '🔍',
    color: 'yellow',
    subject: 'MATHS',
    status: 'available'
  }
];

export const worldLabels: Record<WorldId, string> = {
  livrets: "L'Atelier des Livrets",
  geometrie: 'Le Défi des Formes',
  calculs: 'Le Calcul Décimal',
  numeria: 'Les Royaumes de Numéria',
  pcp: 'Espace PCP / Orientation',
  convertigo: 'Convertigo',
  conju_lab: 'conju_lab',
  race: 'race',
  swissgamefactory: 'swissgamefactory',
  mathhunt: 'mathhunt',
  fractionstower2: 'Tour des Fractions 2'
};
