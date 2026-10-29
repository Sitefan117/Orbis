/** Catalogue d’affichage de l’arcade ; les règles de chaque jeu restent dans son propre dossier. */
export type WorldId =
  | 'livrets'
  | 'geometrie'
  | 'calculs'
  | 'numeria'
  | 'pcp'
  | 'mesurovia'
  | 'conju_lab'
  | 'race'
  | 'shift'
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
  /** Image facultative : les jeux sans illustration gardent leur tuile de fond. */
  image?: string;
  /** Conservé pour compatibilité avec d'éventuels usages existants. */
  emoji: string;
  color: string;
  /** Matière affichée et utilisée par les filtres de l'Arcade. */
  subject: WorldSubject;
  /** Statut affiché sur la carte. */
  status: GameStatus;
}

// Les pages d’accueil s’appuient sur ces fiches pour afficher les tuiles et leurs routes.
export const worlds: World[] = [
  {
    id: 'race',
    image: 'race.png',
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
    image: 'livrets.png',
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
    image: 'geometrie.png',
    title: 'Nexus - Le Défi des Formes',
    subtitle: 'Connais-tu tes figures et solides sur le bout des doigts ?',
    route: '/geometrie',
    emoji: '📐',
    color: 'emerald',
    subject: 'MATHS',
    status: 'development'
  },
  {
    id: 'calculs',
    image: 'calculs.png',
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
    image: 'numeria.png',
    title: 'Les Royaumes de Numéria',
    subtitle: 'Arriveras-tu à maîtriser les nombres aussi grands que les millions ?',
    route: '/numeria',
    emoji: '📜',
    color: 'purple',
    subject: 'MATHS',
    status: 'development'
  },
  {
    id: 'pcp',
    image: 'pcp.png',
    title: 'Espace PCP / Orientation',
    subtitle: 'Prêt à voir dans ton avenir ?',
    route: '/pcp',
    emoji: '💼',
    color: 'amber',
    subject: 'AUTRES',
    status: 'prototype'
  },
  {
    id: 'mesurovia',
    title: 'Mesurovia',
    subtitle: 'Les nombres ont différents noms, arriveras-tu à les décoder ?',
    route: '/mesurovia',
    emoji: '🔄',
    color: 'blue',
    subject: 'MATHS',
    status: 'development'
  },
  {
    id: 'conju_lab',
    image: 'conju_fighter.png',
    title: 'ConjuFighter',
    subtitle: 'Enchaîne les bonnes réponses et bats le boss des verbes !',
    route: '/conju_lab',
    emoji: '🔄',
    color: 'blue',
    subject: 'FRANÇAIS',
    status: 'available'
  },
  {
    id: 'shift',
    title: 'Shift',
    subtitle: 'Arriveras-tu maîtriser petits et grands nombres ?',
    route: '/shift',
    emoji: '🎮',
    color: 'green',
    subject: 'MATHS',
    status: 'available'
  },
  {
    id: 'fractionstower2',
    image: 'fractionstower2.png',
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
    image: 'mathhunt.png',
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
  mesurovia: 'Mesurovia',
  conju_lab: 'conju_lab',
  race: 'race',
  shift: 'shift',
  mathhunt: 'mathhunt',
  fractionstower2: 'Tour des Fractions 2'
};
