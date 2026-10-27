import type { Grade, TenseId, TenseInfo } from './types';

/**
 * Repères pédagogiques de départ, à relier à la progression réelle de la classe.
 * Les années indiquées suivent la progression publiée dans le PER L1 26 (cycle 2)
 * et L1 36 (cycle 3). Le choix précis des verbes/temps doit rester modulable.
 */
export const TENSES: TenseInfo[] = [
  { id: 'present', label: 'Présent de l’indicatif', shortLabel: 'Présent', mood: 'Indicatif', description: 'Ce qui se passe maintenant, ce qui se répète ou ce qui est généralement vrai.', minGrade: '6H' },
  { id: 'imparfait', label: 'Imparfait de l’indicatif', shortLabel: 'Imparfait', mood: 'Indicatif', description: 'Une habitude, une description ou une action en cours dans le passé.', minGrade: '6H' },
  { id: 'futurSimple', label: 'Futur simple de l’indicatif', shortLabel: 'Futur simple', mood: 'Indicatif', description: 'Une action située dans l’avenir.', minGrade: '6H' },
  { id: 'passeCompose', label: 'Passé composé', shortLabel: 'Passé composé', mood: 'Indicatif', description: 'Un temps composé : auxiliaire au présent + participe passé.', minGrade: '6H' },
  { id: 'conditionnelPresent', label: 'Conditionnel présent', shortLabel: 'Conditionnel présent', mood: 'Conditionnel', description: 'Une action envisagée, souhaitée ou présentée comme dépendant d’une condition.', minGrade: '7H' },
  { id: 'imperatif', label: 'Impératif présent', shortLabel: 'Impératif', mood: 'Impératif', description: 'Donner un ordre, un conseil ou une consigne. On n’exprime pas le sujet.', minGrade: '7H' },
  { id: 'plusQueParfait', label: 'Plus-que-parfait', shortLabel: 'Plus-que-parfait', mood: 'Indicatif', description: 'Une action déjà accomplie avant un autre moment du passé.', minGrade: '8H' },
  { id: 'futurAnterieur', label: 'Futur antérieur', shortLabel: 'Futur antérieur', mood: 'Indicatif', description: 'Une action qui sera accomplie avant un autre moment futur.', minGrade: '8H' },
  { id: 'passeSimple3e', label: 'Passé simple · 3e personne', shortLabel: 'Passé simple (3e pers.)', mood: 'Indicatif', description: 'Temps du récit écrit ; repérage d’abord à il/elle/on et ils/elles.', minGrade: '8H', recognitionOnlyAt8H: true },
  { id: 'subjonctifPresent', label: 'Subjonctif présent', shortLabel: 'Subjonctif présent', mood: 'Subjonctif', description: 'Souvent introduit par que après une expression de souhait, nécessité, doute ou sentiment.', minGrade: '8H' },
  { id: 'passeSimple', label: 'Passé simple · toutes personnes', shortLabel: 'Passé simple', mood: 'Indicatif', description: 'Approfondissement : identifier et construire le passé simple à toutes les personnes.', minGrade: '9H', advanced: true },
  { id: 'passeAnterieur', label: 'Passé antérieur', shortLabel: 'Passé antérieur', mood: 'Indicatif', description: 'Temps composé du récit, souvent associé au passé simple.', minGrade: '9H', advanced: true },
  { id: 'subjonctifPasse', label: 'Subjonctif passé', shortLabel: 'Subjonctif passé', mood: 'Subjonctif', description: 'Auxiliaire au subjonctif présent + participe passé.', minGrade: '9H', advanced: true },
  { id: 'conditionnelPasse', label: 'Conditionnel passé', shortLabel: 'Conditionnel passé', mood: 'Conditionnel', description: 'Auxiliaire au conditionnel présent + participe passé ; exprime notamment un fait non réalisé.', minGrade: '9H', advanced: true }
];

const GRADE_ORDER: Record<Grade, number> = { '6H': 6, '7H': 7, '8H': 8, '9H': 9 };

/** Temps présentés au niveau sélectionné. Le passé simple 8H est remplacé par sa version étendue en 9H. */
export function getTensesForGrade(grade: Grade): TenseInfo[] {
  return TENSES.filter((tense) => {
    if (GRADE_ORDER[tense.minGrade] > GRADE_ORDER[grade]) return false;
    if (grade === '9H' && tense.id === 'passeSimple3e') return false;
    if (grade !== '9H' && tense.id === 'passeSimple') return false;
    return true;
  });
}

export function getTenseInfo(id: TenseId): TenseInfo {
  const found = TENSES.find((tense) => tense.id === id);
  if (!found) throw new Error(`Temps de conjugaison inconnu : ${id}`);
  return found;
}

/** Fiches-règles courtes : elles décrivent les modèles, pas une règle absolue pour tous les verbes. */
export const RULE_CARDS = [
  {
    title: 'Trouver le groupe',
    color: 'violet',
    steps: [
      '1er groupe : presque tous les verbes en -er (chanter, aimer). Aller est une exception : il appartient au 3e groupe.',
      '2e groupe : verbes en -ir dont le participe présent se termine en -issant (finir → finissant).',
      '3e groupe : les autres verbes, avec des modèles variés et souvent des radicaux qui changent.'
    ]
  },
  {
    title: 'Radical + terminaison',
    color: 'cyan',
    steps: [
      'Le radical porte une grande partie du sens du verbe.',
      'La terminaison renseigne notamment sur le temps et la personne.',
      'Le radical n’est pas toujours identique : je viens, nous venons, ils viennent.'
    ]
  },
  {
    title: 'Imparfait',
    color: 'green',
    steps: [
      'Pour beaucoup de verbes, pars de « nous » au présent, retire -ons, puis ajoute : -ais, -ais, -ait, -ions, -iez, -aient.',
      'Exception à retenir : être → ét- (j’étais, nous étions).',
      'Attention aux verbes dont le radical change ou dont l’orthographe s’adapte.'
    ]
  },
  {
    title: 'Futur simple et conditionnel présent',
    color: 'amber',
    steps: [
      'Au futur simple, on utilise le radical du futur puis -ai, -as, -a, -ons, -ez, -ont.',
      'Au conditionnel présent, le radical est généralement celui du futur, avec les terminaisons de l’imparfait.',
      'Exemples de radicaux particuliers : ser- (être), aur- (avoir), ir- (aller), fer- (faire), viendr- (venir).'
    ]
  },
  {
    title: 'Temps composés',
    color: 'rose',
    steps: [
      'Un temps composé se construit avec un auxiliaire conjugué et un participe passé.',
      'La plupart des verbes utilisent avoir ; certains verbes comme aller et venir utilisent être dans leur emploi de déplacement.',
      'Avec être, le participe passé s’accorde avec le sujet dans les exemples travaillés ici : elle est allée, ils sont partis.'
    ]
  },
  {
    title: 'Les verbes irréguliers',
    color: 'blue',
    steps: [
      'Ne cherche pas à appliquer mécaniquement une terminaison régulière à toutes les personnes.',
      'Observe les formes d’un même verbe : elles peuvent partager plusieurs radicaux.',
      'Compare le verbe avec un modèle connu, puis vérifie dans le tableau de conjugaison.'
    ]
  }
];
