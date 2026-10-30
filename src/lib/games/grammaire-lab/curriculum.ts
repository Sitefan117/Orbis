import type { GrammarBlock, GrammarCategory, GrammarChallenge, GrammarLevel } from './types';

type Piece = [text: string, category?: GrammarCategory, group?: string];

function order(
  id: string,
  prompt: string,
  answer: Piece[],
  shuffle: number[],
  explanation: string,
  hint: string,
  errorFamily: string,
  context?: string
): GrammarChallenge {
  const inAnswerOrder: GrammarBlock[] = answer.map(([text, category = 'neutral', group], index) => ({
    id: `${id}-${index}`,
    text,
    category,
    group
  }));
  return {
    id,
    kind: 'order',
    prompt,
    context,
    blocks: shuffle.map((index) => inAnswerOrder[index]),
    solution: inAnswerOrder.map((block) => block.id),
    sentence: inAnswerOrder.map((block) => block.text).join(' ').replace(/ ([.!?])/g, '$1'),
    explanation,
    hint,
    errorFamily
  };
}

function select(
  id: string,
  prompt: string,
  choices: Piece[],
  correctIndexes: number[],
  explanation: string,
  hint: string,
  errorFamily: string,
  context?: string
): GrammarChallenge {
  const blocks = choices.map(([text, category = 'neutral', group], index) => ({
    id: `${id}-${index}`,
    text,
    category,
    group
  }));
  return {
    id,
    kind: 'select',
    prompt,
    context,
    blocks,
    solution: correctIndexes.map((index) => blocks[index].id),
    sentence: correctIndexes.map((index) => blocks[index].text).join(' / '),
    explanation,
    hint,
    errorFamily
  };
}

export const GRAMMAR_LEVELS: GrammarLevel[] = [
  {
    id: 1,
    title: 'Reconnaître une phrase', shortTitle: 'Une phrase ?', grade: '2H–3H',
    goal: 'Reconnaître un message complet et compréhensible.',
    prerequisite: 'Comprendre une consigne orale simple.',
    notions: ['phrase', 'sens', 'message complet'],
    theory: 'Une phrase raconte quelque chose de compréhensible. Elle commence généralement par une majuscule et se termine par un signe de ponctuation.',
    categoriesVisible: [],
    challenges: [
      select('l1-a', 'Choisis la phrase qui raconte quelque chose.', [['Le chat dort.', 'phrase'], ['dans la maison', 'non-phrase'], ['mange le bleu', 'non-phrase']], [0], '« Le chat dort. » forme un message complet.', 'Cherche la proposition que tu peux comprendre sans ajouter de mots.', 'reconnaissance-phrase'),
      select('l1-b', 'Quelle proposition est une phrase ?', [['Les oiseaux chantent.', 'phrase'], ['très vite dans', 'non-phrase'], ['une grande fleur', 'non-phrase']], [0], 'La phrase dit ce que font les oiseaux.', 'Une phrase doit transmettre une idée complète.', 'reconnaissance-phrase'),
      select('l1-c', 'Trouve le message complet.', [['Le soleil brille.', 'phrase'], ['sur la colline', 'non-phrase'], ['brille le rapidement', 'non-phrase']], [0], '« Le soleil brille. » est compréhensible et complet.', 'Demande-toi : est-ce que je comprends toute l’idée ?', 'reconnaissance-phrase')
    ]
  },
  {
    id: 2,
    title: 'Phrase ou non-phrase', shortTitle: 'Trier', grade: '2H–3H',
    goal: 'Distinguer une phrase d’une suite de mots incomplète.',
    prerequisite: 'Reconnaître un message compréhensible.',
    notions: ['phrase', 'non-phrase', 'majuscule', 'ponctuation'],
    theory: 'Une phrase complète commence par une majuscule, a du sens et se termine par un point, un point d’interrogation ou un point d’exclamation.',
    categoriesVisible: ['phrase', 'non-phrase'],
    challenges: [
      select('l2-a', 'Sélectionne toutes les phrases.', [['Mila dessine un arbre.', 'phrase'], ['un arbre vert', 'non-phrase'], ['La cloche sonne.', 'phrase']], [0, 2], 'Les deux phrases donnent une information complète.', 'Il y a deux bonnes réponses.', 'phrase-non-phrase'),
      select('l2-b', 'Sélectionne les non-phrases.', [['Dans la cour.', 'non-phrase'], ['Les élèves jouent.', 'phrase'], ['une jolie bille', 'non-phrase']], [0, 2], 'Ces groupes de mots ne donnent pas un message complet.', 'Cherche ce qui demande encore une suite.', 'phrase-non-phrase'),
      select('l2-c', 'Quelles propositions sont des phrases ?', [['Il pleut !', 'phrase'], ['Pourquoi ris-tu ?', 'phrase'], ['de la forêt', 'non-phrase']], [0, 1], 'Une phrase peut se terminer par différents signes.', 'Observe le sens, la majuscule et le signe final.', 'ponctuation')
    ]
  },
  {
    id: 3,
    title: 'Remettre les mots dans l’ordre', shortTitle: 'En ordre', grade: '3H',
    goal: 'Construire une phrase simple dans un ordre compréhensible.',
    prerequisite: 'Distinguer phrase et non-phrase.',
    notions: ['ordre des mots', 'début', 'fin'],
    theory: 'Les mots d’une phrase suivent un ordre. Cherche d’abord qui fait l’action, puis ce qui se passe.',
    categoriesVisible: [],
    challenges: [
      order('l3-a', 'Remets les blocs dans l’ordre.', [['Le renard', 'subject', 'gs'], ['court', 'verb', 'gv'], ['dans la forêt', 'place', 'gv'], ['.', 'punctuation']], [1, 2, 0, 3], 'Le groupe qui fait l’action vient avant le verbe.', 'Commence par « Le renard ».', 'ordre-mots'),
      order('l3-b', 'Construis une phrase correcte.', [['Mila', 'subject', 'gs'], ['observe', 'verb', 'gv'], ['une fleur', 'complement', 'gv'], ['.', 'punctuation']], [2, 1, 0, 3], 'Mila fait l’action d’observer.', 'Qui observe ? Place ce bloc en premier.', 'ordre-mots'),
      order('l3-c', 'Remets la phrase debout.', [['Les enfants', 'subject', 'gs'], ['préparent', 'verb', 'gv'], ['un gâteau', 'complement', 'gv'], ['.', 'punctuation']], [1, 0, 2, 3], 'Le sujet pluriel « Les enfants » est suivi de « préparent ».', 'Cherche le bloc avec une majuscule.', 'ordre-mots')
    ]
  },
  {
    id: 4,
    title: 'Identifier le sujet et le verbe', shortTitle: 'Qui fait quoi ?', grade: '3H–4H',
    goal: 'Repérer qui fait l’action et le mot qui indique l’action.',
    prerequisite: 'Construire une phrase simple en ordre.',
    notions: ['sujet', 'verbe', 'accord simple'],
    theory: 'Le sujet indique qui fait l’action. Le verbe dit ce que fait le sujet ou ce qui se passe. Le sujet et le verbe s’accordent.',
    categoriesVisible: ['subject', 'verb'],
    challenges: [
      select('l4-a', 'Clique sur le sujet.', [['Le petit chien', 'subject', 'gs'], ['aboie', 'verb', 'gv'], ['dans le jardin', 'place', 'gv']], [0], '« Le petit chien » est celui qui aboie.', 'Pose la question : qui est-ce qui aboie ?', 'sujet', 'Le petit chien aboie dans le jardin.'),
      select('l4-b', 'Clique sur le verbe.', [['Les oiseaux', 'subject', 'gs'], ['construisent', 'verb', 'gv'], ['un nid', 'complement', 'gv']], [1], '« construisent » indique l’action.', 'Demande-toi : que font les oiseaux ?', 'verbe', 'Les oiseaux construisent un nid.'),
      select('l4-c', 'Choisis le verbe qui s’accorde avec le sujet.', [['joue', 'verb'], ['jouent', 'verb'], ['jouons', 'verb']], [1], '« Les filles » est au pluriel : elles jouent.', 'Remplace « Les filles » par « elles ».', 'accord-sujet-verbe', 'Les filles … dans la cour.')
    ]
  },
  {
    id: 5,
    title: 'Comprendre les groupes de mots', shortTitle: 'Les groupes', grade: '4H',
    goal: 'Assembler les mots qui fonctionnent ensemble.',
    prerequisite: 'Identifier un sujet et un verbe simples.',
    notions: ['groupe de mots', 'déplacement', 'fusion'],
    theory: 'Plusieurs mots peuvent former un seul bloc de sens. Une fois assemblés, ils se déplacent ensemble.',
    categoriesVisible: ['subject', 'verb', 'complement'],
    challenges: [
      order('l5-a', 'Assemble les groupes dans l’ordre.', [['Le petit chien', 'subject', 'gs'], ['aboie', 'verb', 'gv'], ['dans le jardin', 'place', 'gv'], ['.', 'punctuation']], [2, 0, 1, 3], 'La phrase contient un groupe sujet et un groupe qui dit ce qui se passe.', 'Cherche d’abord qui aboie.', 'groupes-mots'),
      order('l5-b', 'Construis la phrase avec trois groupes.', [['Une petite souris', 'subject', 'gs'], ['mange', 'verb', 'gv'], ['un morceau de fromage', 'complement', 'gv'], ['.', 'punctuation']], [1, 2, 0, 3], 'Chaque grand bloc rassemble des mots qui vont ensemble.', 'La souris fait l’action.', 'groupes-mots'),
      select('l5-c', 'Quel groupe peut remplacer « Le grand arbre » ?', [['Il', 'pronoun'], ['Ils', 'pronoun'], ['Elle', 'pronoun']], [0], '« Le grand arbre » est masculin singulier : on peut dire « il ».', 'Le groupe parle d’un seul arbre.', 'pronominalisation', 'Le grand arbre abrite un nid.')
    ]
  },
  {
    id: 6,
    title: 'Construire le groupe nominal', shortTitle: 'Déterminant + nom', grade: '4H–5H',
    goal: 'Assembler un déterminant et un nom.',
    prerequisite: 'Comprendre qu’un groupe forme un bloc de sens.',
    notions: ['groupe nominal', 'déterminant', 'nom'],
    theory: 'Un groupe nominal contient un nom. Il commence souvent par un déterminant : le chat, une maison, des fleurs.',
    categoriesVisible: ['determiner', 'noun'],
    challenges: [
      order('l6-a', 'Construis le groupe nominal.', [['le', 'determiner', 'gn'], ['chat', 'noun', 'gn']], [1, 0], '« le » est le déterminant et « chat » est le nom.', 'Le petit mot vient avant le nom.', 'groupe-nominal'),
      order('l6-b', 'Assemble le groupe nominal au pluriel.', [['des', 'determiner', 'gn'], ['fleurs', 'noun', 'gn']], [1, 0], 'Le déterminant « des » accompagne le nom pluriel « fleurs ».', 'Cherche le déterminant.', 'determinant-nom'),
      select('l6-c', 'Clique sur le nom.', [['une', 'determiner', 'gn'], ['maison', 'noun', 'gn']], [1], '« maison » est le mot principal du groupe nominal.', 'Le nom désigne une chose, une personne, un animal ou une idée.', 'nom', 'une maison')
    ]
  },
  {
    id: 7,
    title: 'Ajouter des adjectifs', shortTitle: 'Préciser le nom', grade: '5H',
    goal: 'Enrichir un groupe nominal avec un adjectif.',
    prerequisite: 'Identifier déterminant et nom.',
    notions: ['adjectif', 'accord dans le groupe nominal'],
    theory: 'L’adjectif précise le nom. Il s’accorde avec lui : un petit chat, des petites chattes.',
    categoriesVisible: ['determiner', 'noun', 'adjective'],
    challenges: [
      order('l7-a', 'Construis le groupe nominal enrichi.', [['un', 'determiner', 'gn'], ['petit', 'adjective', 'gn'], ['chat', 'noun', 'gn'], ['noir', 'adjective', 'gn']], [2, 0, 3, 1], 'Les adjectifs « petit » et « noir » précisent le nom « chat ».', 'Commence par le déterminant.', 'adjectif'),
      select('l7-b', 'Choisis l’adjectif bien accordé.', [['petit', 'adjective'], ['petite', 'adjective'], ['petits', 'adjective']], [1], '« fleur » est féminin singulier : une petite fleur.', 'Regarde le déterminant « une ».', 'accord-groupe-nominal', 'une … fleur'),
      order('l7-c', 'Assemble le groupe nominal au pluriel.', [['les', 'determiner', 'gn'], ['grandes', 'adjective', 'gn'], ['maisons', 'noun', 'gn'], ['blanches', 'adjective', 'gn']], [2, 3, 0, 1], 'Tous les mots du groupe s’accordent au féminin pluriel.', 'Le déterminant « les » commence le groupe.', 'accord-groupe-nominal')
    ]
  },
  {
    id: 8,
    title: 'Groupe sujet et groupe verbal', shortTitle: 'Les deux piliers', grade: '5H–6H',
    goal: 'Découper la phrase en groupe sujet et groupe verbal.',
    prerequisite: 'Reconnaître sujet, verbe et groupe nominal.',
    notions: ['groupe sujet', 'groupe verbal'],
    theory: 'Le groupe sujet indique de qui ou de quoi on parle. Le groupe verbal contient le verbe et ce qui le complète.',
    categoriesVisible: ['subject', 'verb', 'complement'],
    challenges: [
      select('l8-a', 'Sélectionne tout le groupe sujet.', [['Le', 'determiner', 'gs'], ['grand', 'adjective', 'gs'], ['arbre', 'noun', 'gs'], ['abrite', 'verb', 'gv'], ['un nid', 'complement', 'gv']], [0, 1, 2], '« Le grand arbre » forme tout le groupe sujet.', 'Sélectionne tous les mots qui désignent ce qui abrite le nid.', 'groupe-sujet', 'Le grand arbre abrite un nid.'),
      select('l8-b', 'Sélectionne tout le groupe verbal.', [['Les élèves attentifs', 'subject', 'gs'], ['écoutent', 'verb', 'gv'], ['la consigne', 'complement', 'gv']], [1, 2], 'Le groupe verbal est « écoutent la consigne ».', 'Il commence par le verbe.', 'groupe-verbal', 'Les élèves attentifs écoutent la consigne.'),
      order('l8-c', 'Assemble les deux grands groupes.', [['La petite fille', 'subject', 'gs'], ['range ses crayons', 'verb', 'gv'], ['.', 'punctuation']], [1, 0, 2], 'La phrase repose sur le groupe sujet et le groupe verbal.', 'Qui range ses crayons ?', 'groupe-sujet-verbal')
    ]
  },
  {
    id: 9,
    title: 'Ajouter des compléments', shortTitle: 'Enrichir', grade: '6H',
    goal: 'Ajouter une information à une phrase simple.',
    prerequisite: 'Distinguer groupe sujet et groupe verbal.',
    notions: ['complément', 'information ajoutée'],
    theory: 'Un complément apporte une information : quoi, où, quand ou comment. Certains compléments peuvent être déplacés ou supprimés.',
    categoriesVisible: ['subject', 'verb', 'complement'],
    challenges: [
      order('l9-a', 'Enrichis la phrase avec le complément.', [['Le chat', 'subject', 'gs'], ['dort', 'verb', 'gv'], ['sur le canapé', 'place', 'gv'], ['.', 'punctuation']], [2, 0, 1, 3], '« sur le canapé » précise où dort le chat.', 'Construis d’abord « Le chat dort ».', 'complement'),
      select('l9-b', 'Clique sur le complément.', [['Mila', 'subject', 'gs'], ['ouvre', 'verb', 'gv'], ['la fenêtre', 'complement', 'gv']], [2], '« la fenêtre » complète le verbe « ouvre ».', 'Mila ouvre quoi ?', 'complement-verbe', 'Mila ouvre la fenêtre.'),
      order('l9-c', 'Construis la phrase enrichie.', [['Les enfants', 'subject', 'gs'], ['jouent', 'verb', 'gv'], ['dans la cour', 'place', 'gv'], ['après la classe', 'time', 'gv'], ['.', 'punctuation']], [3, 1, 0, 2, 4], 'Deux compléments précisent le lieu et le moment.', 'Commence par le groupe sujet.', 'complements')
    ]
  },
  {
    id: 10,
    title: 'Lieu, temps et manière', shortTitle: 'Où ? Quand ? Comment ?', grade: '6H–7H',
    goal: 'Reconnaître les compléments de lieu, de temps et de manière.',
    prerequisite: 'Reconnaître un complément.',
    notions: ['complément de lieu', 'complément de temps', 'complément de manière'],
    theory: 'Le complément de lieu répond à « où ? », celui de temps à « quand ? » et celui de manière à « comment ? ».',
    categoriesVisible: ['place', 'time', 'manner'],
    challenges: [
      select('l10-a', 'Quel bloc indique le lieu ?', [['dans la forêt', 'place'], ['le matin', 'time'], ['rapidement', 'manner']], [0], '« dans la forêt » répond à la question « où ? ».', 'Cherche l’endroit.', 'complement-lieu', 'Le renard court dans la forêt.'),
      select('l10-b', 'Quel bloc indique le temps ?', [['avec prudence', 'manner'], ['après le repas', 'time'], ['sur la table', 'place']], [1], '« après le repas » répond à la question « quand ? ».', 'Cherche le moment.', 'complement-temps'),
      select('l10-c', 'Quel bloc indique la manière ?', [['doucement', 'manner'], ['dans la classe', 'place'], ['demain', 'time']], [0], '« doucement » répond à la question « comment ? ».', 'Cherche la façon de faire.', 'complement-maniere')
    ]
  },
  {
    id: 11,
    title: 'Transformer les phrases', shortTitle: 'Négation et question', grade: '7H',
    goal: 'Passer de l’affirmation à la négation et de la déclaration à la question.',
    prerequisite: 'Maîtriser l’ordre de la phrase simple.',
    notions: ['affirmative', 'négative', 'déclarative', 'interrogative'],
    theory: 'Pour nier, on encadre souvent le verbe avec « ne … pas ». Pour poser une question, on peut utiliser « est-ce que » et un point d’interrogation.',
    categoriesVisible: ['subject', 'verb', 'negation', 'punctuation'],
    challenges: [
      order('l11-a', 'Transforme la phrase en phrase négative.', [['Le chat', 'subject', 'gs'], ['ne', 'negation', 'gv'], ['dort', 'verb', 'gv'], ['pas', 'negation', 'gv'], ['.', 'punctuation']], [3, 0, 2, 1, 4], '« ne » et « pas » encadrent le verbe.', 'Place « ne » avant le verbe et « pas » après.', 'negation', 'Le chat dort.'),
      order('l11-b', 'Construis la question.', [['Est-ce que', 'neutral'], ['tu', 'pronoun', 'gs'], ['viens', 'verb', 'gv'], ['?', 'punctuation']], [1, 2, 0, 3], '« Est-ce que » transforme la déclaration en question.', 'La question commence par « Est-ce que ».', 'interrogation', 'Tu viens.'),
      select('l11-c', 'Choisis la phrase interrogative.', [['Les enfants jouent.', 'phrase'], ['Est-ce que les enfants jouent ?', 'phrase'], ['Les enfants ne jouent pas.', 'phrase']], [1], 'Le point d’interrogation et « Est-ce que » signalent la question.', 'Cherche la phrase qui demande une réponse.', 'interrogation')
    ]
  },
  {
    id: 12,
    title: 'Pronoms et accords', shortTitle: 'Remplacer et accorder', grade: '7H–8H',
    goal: 'Remplacer le sujet et choisir la bonne forme verbale.',
    prerequisite: 'Identifier le groupe sujet et le verbe.',
    notions: ['pronom sujet', 'accord sujet-verbe'],
    theory: 'On peut remplacer un groupe sujet par un pronom. Le verbe change pour s’accorder avec ce pronom.',
    categoriesVisible: ['pronoun', 'subject', 'verb'],
    challenges: [
      select('l12-a', 'Remplace « Les filles » par un pronom.', [['Il', 'pronoun'], ['Elle', 'pronoun'], ['Elles', 'pronoun']], [2], '« Les filles » est féminin pluriel : on utilise « elles ».', 'Le sujet désigne plusieurs filles.', 'pronominalisation', 'Les filles chantent.'),
      select('l12-b', 'Choisis le verbe accordé avec « Nous ».', [['joue', 'verb'], ['jouons', 'verb'], ['jouent', 'verb']], [1], 'Avec « nous », le verbe est « jouons ».', 'Écoute la terminaison de « nous jouons ».', 'accord-sujet-verbe'),
      order('l12-c', 'Construis la phrase avec le pronom sujet.', [['Ils', 'pronoun', 'gs'], ['construisent', 'verb', 'gv'], ['un nid', 'complement', 'gv'], ['.', 'punctuation']], [2, 1, 0, 3], 'Le pronom pluriel « ils » s’accorde avec « construisent ».', 'Commence par le pronom.', 'accord-sujet-verbe')
    ]
  },
  {
    id: 13,
    title: 'Reconnaître les sujets complexes', shortTitle: 'Sujets difficiles', grade: '8H',
    goal: 'Trouver un sujet long ou placé après le verbe.',
    prerequisite: 'Maîtriser sujet, pronom et accord sujet-verbe.',
    notions: ['sujet long', 'sujet inversé', 'accord à distance'],
    theory: 'Le sujet n’est pas toujours juste avant le verbe. Pour le trouver, repère qui fait l’action et vérifie l’accord.',
    categoriesVisible: ['subject', 'verb', 'place'],
    challenges: [
      select('l13-a', 'Sélectionne tout le sujet.', [['Le petit garçon', 'subject', 'gs'], ['de la classe', 'subject', 'gs'], ['court', 'verb', 'gv'], ['rapidement', 'manner', 'gv']], [0, 1], 'Le sujet complet est « Le petit garçon de la classe ».', 'Qui est-ce qui court ?', 'sujet-long', 'Le petit garçon de la classe court rapidement.'),
      select('l13-b', 'Quel groupe est le sujet du verbe « arrivent » ?', [['Dans la cour', 'place'], ['arrivent', 'verb'], ['les élèves', 'subject']], [2], 'Le sujet est placé après le verbe : ce sont les élèves qui arrivent.', 'Qui est-ce qui arrive ?', 'sujet-inverse', 'Dans la cour arrivent les élèves.'),
      select('l13-c', 'Choisis le verbe bien accordé.', [['pousse', 'verb'], ['poussent', 'verb'], ['poussons', 'verb']], [1], 'Le noyau du sujet est « fleurs », au pluriel : elles poussent.', 'Remplace « Les fleurs du jardin » par un pronom.', 'accord-sujet-long', 'Les fleurs du jardin … au printemps.')
    ]
  },
  {
    id: 14,
    title: 'Construire des phrases enrichies', shortTitle: 'Maître bâtisseur', grade: '8H',
    goal: 'Réinvestir toutes les notions dans des phrases complexes.',
    prerequisite: 'Avoir travaillé les niveaux 1 à 13.',
    notions: ['phrase enrichie', 'analyse complète', 'réinvestissement'],
    theory: 'Une phrase enrichie reste organisée : un groupe sujet, un verbe bien accordé et des compléments qui précisent le sens.',
    categoriesVisible: ['determiner', 'noun', 'adjective', 'subject', 'verb', 'place', 'time', 'manner'],
    challenges: [
      order('l14-a', 'Construis la phrase enrichie.', [['Le petit renard roux', 'subject', 'gs'], ['traverse', 'verb', 'gv'], ['rapidement', 'manner', 'gv'], ['la forêt', 'complement', 'gv'], ['au lever du jour', 'time', 'gv'], ['.', 'punctuation']], [3, 0, 4, 2, 1, 5], 'La phrase combine sujet enrichi, verbe, manière, complément et temps.', 'Commence par le groupe sujet, puis le verbe.', 'phrase-enrichie'),
      order('l14-b', 'Construis une phrase avec un sujet inversé.', [['Au sommet de la colline', 'place'], ['se dressent', 'verb', 'gv'], ['deux grands sapins', 'subject', 'gs'], ['.', 'punctuation']], [2, 1, 0, 3], 'Le groupe sujet « deux grands sapins » est placé après le verbe.', 'La phrase commence par le lieu.', 'sujet-inverse'),
      order('l14-c', 'Construis la phrase négative enrichie.', [['Les jeunes explorateurs', 'subject', 'gs'], ['ne', 'negation', 'gv'], ['traversent', 'verb', 'gv'], ['jamais', 'negation', 'gv'], ['la rivière', 'complement', 'gv'], ['sans prudence', 'manner', 'gv'], ['.', 'punctuation']], [4, 0, 5, 2, 3, 1, 6], 'La négation encadre le verbe dans une phrase enrichie.', 'Construis d’abord « Les jeunes explorateurs traversent la rivière ».', 'phrase-enrichie')
    ]
  }
];

// Plusieurs placements sont pédagogiquement valables : le français permet souvent
// de déplacer un complément de temps, de lieu ou de manière sans perdre le sens.
function addAcceptedOrders(challengeId: string, alternatives: number[][]): void {
  const challenge = GRAMMAR_LEVELS.flatMap((level) => level.challenges).find((item) => item.id === challengeId);
  if (!challenge) return;
  challenge.acceptedSolutions = alternatives.map((order) => order.map((index) => challenge.solution[index]));
}
addAcceptedOrders('l9-c', [[0, 1, 3, 2, 4]]);
addAcceptedOrders('l14-a', [[0, 1, 3, 2, 4, 5], [0, 1, 4, 2, 3, 5]]);
addAcceptedOrders('l14-c', [[0, 1, 2, 4, 3, 5, 6]]);

export const CATEGORY_LABELS: Record<GrammarCategory, string> = {
  phrase: 'PHRASE',
  'non-phrase': 'NON-PHRASE',
  determiner: 'DÉTERMINANT',
  noun: 'NOM',
  adjective: 'ADJECTIF',
  subject: 'SUJET',
  verb: 'VERBE',
  complement: 'COMPLÉMENT',
  place: 'LIEU',
  time: 'TEMPS',
  manner: 'MANIÈRE',
  pronoun: 'PRONOM',
  negation: 'NÉGATION',
  punctuation: 'PONCTUATION',
  neutral: 'BLOC'
};

export function getGrammarLevel(id: number): GrammarLevel {
  return GRAMMAR_LEVELS.find((level) => level.id === id) ?? GRAMMAR_LEVELS[0];
}
