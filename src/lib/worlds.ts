export type WorldId =
  | 'livrets'
  | 'geometrie'
  | 'calculs'
  | 'numeria'
  | 'pcp'
  | 'convertigo'
  | 'conju_fighter'
  | 'race'
  | 'swissgamefactory'
  | 'mathhunt'
  | 'fractionstower2';


export const worlds: Array<{
  id: WorldId;
  title: string;
  subtitle: string;
  route: string;
  emoji: string;
  color: string;
}> = [
  {
  id: 'race',
  title: 'Racer',
  subtitle: 'Arriveras-tu à franchir la ligne d’arrivée ?',
  route: '/race',
  emoji: '🏎️',
  color: 'blue'
},
  {
    id: 'livrets',
    title: "L'Atelier des Livrets",
    subtitle: 'Défis de tables de multiplication.',
    route: '/livrets',
    emoji: '✖️',
    color: 'indigo'
  },
  {
    id: 'geometrie',
    title: 'Le Défi des Formes',
    subtitle: 'Connais-tu tes figures et solides sur le bout des doigts ? ',
    route: '/geometrie',
    emoji: '📐',
    color: 'emerald'
  },
  {
    id: 'calculs',
    title: 'Le Calcul Décimal',
    subtitle: 'Les nombres à virgule ont-ils encore des secrets pour toi ?',
    route: '/calculs',
    emoji: '🔢',
    color: 'rose'
  },
  {
    id: 'numeria',
    title: 'Les Royaumes de Numéria',
    subtitle: 'Arriveras-tu à maîtriser les nombres aussi grands que les millions ?',
    route: '/numeria',
    emoji: '📜',
    color: 'purple'
  },
  {
    id: 'pcp',
    title: 'Espace PCP / Orientation',
    subtitle: 'Prêt à voir dans ton avenir ? ',
    route: '/pcp',
    emoji: '💼',
    color: 'amber'
  },
  {
    id: 'convertigo',
    title: 'Convertigo',
    subtitle: 'Les nombres ont différents noms, arriveras-tu à les décoder ?', // <-- Le guillemet manquant est ici
    route: '/convertigo', // <-- C'est l'adresse URL de ton module
    emoji: '🔄',
    color: 'blue'
  },
  {
    id: 'conju_fighter',
    title: 'Conju_fighter',
    subtitle: ' Qui est le meilleur conjugueur ?',
    route: '/conju_fighter', // <-- C'est l'adresse URL de ton module
    emoji: '🔄',
    color: 'blue'
  },
  
  {
    id: 'swissgamefactory',
    title: 'Swiss Game Factory',
    subtitle: ' Arriveras-tu à terminer les commandes ?',
    route: '/swissgamefactory',
    emoji: '🎮',
    color: 'green'
  },

  {
    id: 'fractionstower2',
    title: 'Fractions Tower',
    subtitle: ' Vaincras-tu la tour ?',
    route: '/fractionstower2',
    emoji: '🎮',
    color: 'green'
  },
  
  {
    id: 'mathhunt',
    title: 'Math Hunt',
    subtitle: 'Chasse aux canards !',
    route: '/mathhunt',
    emoji: '🔍',
    color: 'yellow'
  }
];

export const worldLabels: Record<WorldId, string> = {
  livrets: "L'Atelier des Livrets",
  geometrie: 'Le Défi des Formes',
  calculs: 'Le Calcul Décimal',
  numeria: 'Les Royaumes de Numéria',
  pcp: 'Espace PCP / Orientation',
  convertigo: 'Convertigo',
  conju_fighter: 'conju_fighter',
  race: 'race',
  swissgamefactory: 'swissgamefactory',
  mathhunt: 'mathhunt',
  fractionstower2: 'Tour des Fractions 2'
};