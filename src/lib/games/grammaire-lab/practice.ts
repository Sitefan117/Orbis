import type { GrammarBlock, GrammarCategory, GrammarChallenge, GrammarTask } from './types';

type Piece = [text: string, category?: GrammarCategory, group?: string, label?: string];

function pieces(id: string, entries: Piece[]): GrammarBlock[] {
  return entries.map(([text, category = 'neutral', group, label], index) => ({ id: `${id}-${index}`, text, category, group, label }));
}

function O(id: string, task: GrammarTask, prompt: string, entries: Piece[], explanation: string, hint: string, errorFamily: string, alternatives: number[][] = [], context?: string): GrammarChallenge {
  const ordered = pieces(id, entries);
  const blocks = [...ordered].sort((a, b) => (a.id.charCodeAt(a.id.length - 1) * 7 % 11) - (b.id.charCodeAt(b.id.length - 1) * 7 % 11));
  return {
    id, kind: 'order', task, prompt, context, blocks,
    solution: ordered.map((block) => block.id),
    acceptedSolutions: alternatives.map((solution) => solution.map((index) => ordered[index].id)),
    sentence: ordered.map((block) => block.text).join(' ').replace(/ ([.!])/g, '$1').replace(/([’']) /g, '$1'),
    explanation, hint, errorFamily
  };
}

function S(id: string, task: GrammarTask, prompt: string, entries: Piece[], correct: number[], explanation: string, hint: string, errorFamily: string, context?: string): GrammarChallenge {
  const blocks = pieces(id, entries);
  return {
    id, kind: 'select', task, prompt, context, blocks,
    solution: correct.map((index) => blocks[index].id),
    sentence: correct.map((index) => blocks[index].text).join(' / '),
    explanation, hint, errorFamily
  };
}

const n = (text: string): Piece => [text];
const b = (text: string, category: GrammarCategory, group?: string, label?: string): Piece => [text, category, group, label];

function H(id: string, prompt: string, entries: Piece[], correct: number[], explanation: string, hint: string, errorFamily: string): GrammarChallenge {
  const blocks = pieces(id, entries);
  return { id, kind: 'highlight', task: 'analyser', prompt, blocks, solution: correct.map((index) => blocks[index].id),
    context: blocks.map((block) => block.text).join(' ').replace(/ ([.!?])/g, '$1'),
    sentence: correct.map((index) => blocks[index].text).join(' '), explanation, hint, errorFamily };
}

function R(id: string, prompt: string, before: string, wrong: string, after: string, expected: string, explanation: string, hint: string, errorFamily: string): GrammarChallenge {
  const blocks = pieces(id, [n(expected)]);
  return { id, kind: 'repair', task: 'transformer', prompt, repair: { before, wrong, after }, blocks,
    solution: [blocks[0].id], sentence: `${before}${expected}${after}`, explanation, hint, errorFamily };
}

function M(id: string, prompt: string, entries: Piece[], removable: number, explanation: string, hint: string, errorFamily: string, moveOperation: 'remove' | 'front' = 'remove'): GrammarChallenge {
  const blocks = pieces(id, entries);
  const remainder = blocks.filter((_, index) => index !== removable).map((block) => block.text).join(' ').replace(/ ([.!?])/g, '$1');
  const moved = blocks[removable].text;
  return { id, kind: 'move', task: 'transformer', prompt, moveOperation, blocks, solution: [blocks[removable].id],
    context: blocks.map((block) => block.text).join(' ').replace(/ ([.!?])/g, '$1'),
    sentence: moveOperation === 'front' ? `${moved.charAt(0).toLocaleUpperCase('fr-CH') + moved.slice(1)}, ${remainder}` : remainder,
    explanation, hint, errorFamily };
}

export const INTERACTIVE_CHALLENGES: Record<number, GrammarChallenge[]> = {
  1: [
    H('i1-a', 'Surligne les mots qui racontent ce que fait Mila.', [n('Mila'), n('dessine'), n('un soleil'), n('.')], [1, 2], '« dessine un soleil » dit ce que fait Mila.', 'Cherche l’action et ce qu’elle dessine.', 'phrase-complete'),
    R('i1-b', 'Répare le message : écris le mot qui manque.', 'Le chat ', '…', '.', 'dort', '« Le chat dort. » est une phrase complète.', 'Que fait le chat ?', 'phrase-complete')
  ],
  2: [
    H('i2-a', 'Surligne tous les mots de la phrase complète.', [n('Le'), n('train'), n('arrive'), n('.')], [0, 1, 2, 3], 'Tous ces mots forment la phrase « Le train arrive. ».', 'Une phrase complète dit ce qui arrive et se termine par un point.', 'phrase-non-phrase'),
    R('i2-b', 'Répare la phrase en remplaçant le mot incomplet.', 'La souris mange ', 'dans', '.', 'du fromage', '« La souris mange du fromage. » a un sens complet.', 'Que mange la souris ?', 'sens-phrase')
  ],
  4: [
    H('i4-a', 'Surligne le verbe dans la phrase.', [b('Les enfants', 'subject'), b('chantent', 'verb'), n('.')], [1], '« chantent » est le verbe ; il s’accorde avec « Les enfants ».', 'Que font les enfants ?', 'verbe'),
    R('i4-b', 'Répare l’accord du verbe.', 'Les chiens ', 'aboie', '.', 'aboient', 'Plusieurs chiens : ils aboient.', 'Remplace « Les chiens » par « ils ».', 'accord-sujet-verbe'),
    M('i4-c', 'Enlève le groupe qui précise le moment. La phrase doit rester complète.', [b('Le soleil', 'subject', 'gs'), b('brille', 'verb', 'gv'), b('ce matin', 'time', 'cp'), n('.')], 2, '« Le soleil brille. » reste une phrase complète.', 'Essaie de retirer « ce matin ».', 'complement-phrase'),
    S('i4-d', 'analyser', 'Quelle est la classe grammaticale de « rapide » ?', [b('sujet', 'subject'), b('verbe', 'verb'), b('adjectif', 'adjective')], [2], '« rapide » est un adjectif : il précise un nom.', 'Quel mot donne une précision sur un nom ?', 'classe-grammaticale', 'Le train rapide arrive.'),
    S('i4-e', 'analyser', 'Quelle est la classe grammaticale de « les » ?', [b('déterminant', 'determiner'), b('nom', 'noun'), b('verbe', 'verb')], [0], '« les » est un déterminant : il accompagne un nom.', 'Quel mot accompagne le nom ?', 'classe-grammaticale', 'Les enfants jouent.')
  ],
  9: [
    M('i9-a', 'Enlève le complément de phrase : garde une phrase complète.', [b('Mila', 'subject', 'gs'), b('ouvre', 'verb', 'gv'), b('la fenêtre', 'complement', 'gv'), b('ce matin', 'time', 'cp'), n('.')], 3, '« ce matin » est un CP : on peut le supprimer. « la fenêtre » complète le verbe.', 'Cherche le groupe que l’on peut retirer.', 'complement-phrase'),
    M('i9-b', 'Déplace le complément de phrase au début.', [b('Nora', 'subject', 'gs'), b('lit', 'verb', 'gv'), b('un livre', 'complement', 'gv'), b('le soir', 'time', 'cp'), n('.')], 3, '« le soir » est un CP : on peut dire « Le soir, Nora lit un livre. ».', 'Cherche l’indication de temps.', 'complement-phrase', 'front')
  ],
  14: [
    M('i14-a', 'Enlève le complément de phrase sans retirer le CVD ni le CVI.', [b('Lina', 'subject', 'gs'), b('offre', 'verb', 'gv'), b('un livre', 'complement', 'gv'), b('à Sami', 'complement', 'gv'), b('ce matin', 'time', 'cp'), n('.')], 4, '« ce matin » est un CP ; « un livre » est CVD et « à Sami » est CVI.', 'Le CP peut être supprimé sans casser la construction du verbe.', 'complement-phrase'),
    M('i14-b', 'Déplace le complément de phrase au début, sans déplacer le CVI.', [b('Lina', 'subject', 'gs'), b('offre', 'verb', 'gv'), b('un livre', 'complement', 'gv'), b('à Sami', 'complement', 'gv'), b('demain', 'time', 'cp'), n('.')], 4, '« demain » se déplace : « Demain, Lina offre un livre à Sami. » Le CVI reste avec le verbe.', 'Le complément de phrase indique quand.', 'complement-phrase', 'front')
  ]
};

export const EXTRA_CHALLENGES: Record<number, GrammarChallenge[]> = {
  1: [
    S('p1-a', 'observer', 'Quel message raconte une action complète ?', [n('dans le jardin'), n('La pluie tombe.'), n('très grand arbre')], [1], 'On comprend ce qui se passe : la pluie tombe.', 'Qui fait quoi ?', 'reconnaissance-phrase'),
    S('p1-b', 'trier', 'Choisis les deux phrases complètes.', [n('Le train arrive.'), n('Les enfants rient.'), n('sous un grand chêne')], [0, 1], 'Les deux premières propositions donnent une information complète.', 'Il y a deux réponses.', 'reconnaissance-phrase'),
    S('p1-c', 'observer', 'Quelle proposition peut être dite seule ?', [n('un oiseau bleu'), n('sur le chemin'), n('Nina lit.')], [2], '« Nina lit. » est une phrase complète.', 'Cherche une idée que tu comprends sans suite.', 'reconnaissance-phrase'),
    S('p1-d', 'completer', 'Quel groupe complète « Le vélo… » pour faire une phrase ?', [n('rouge et bleu'), n('roule vite.'), n('dans la cour')], [1], '« Le vélo roule vite. » dit ce qui se passe.', 'Il manque ce que fait le vélo.', 'phrase-complete', 'Le vélo…'),
    S('p1-e', 'trier', 'Sélectionne toutes les phrases qui ont du sens.', [n('La lune éclaire la nuit.'), n('Le gâteau la fenêtre regarde.'), n('Mon frère chante.')], [0, 2], 'Ces deux phrases transmettent un message compréhensible.', 'Deux propositions sont attendues.', 'sens-phrase'),
    S('p1-f', 'observer', 'Quelle phrase raconte quelque chose qui se passe ?', [n('Les abeilles butinent.'), n('dans les fleurs jaunes'), n('butinent les rapidement')], [0], 'Les abeilles font une action : elles butinent.', 'Cherche de qui on parle et ce qui se passe.', 'reconnaissance-phrase'),
    S('p1-g', 'completer', 'Quel début permet de former « … saute. » ?', [n('Au-dessus'), n('La grenouille'), n('Très vite')], [1], '« La grenouille saute. » forme une phrase.', 'Qui saute ?', 'phrase-complete', '… saute.'),
    S('p1-h', 'trier', 'Trouve les messages complets.', [n('Léo peint un mur.'), n('près du mur'), n('La porte grince.')], [0, 2], 'Les propositions avec un sujet et une action sont complètes.', 'Il y a deux phrases.', 'reconnaissance-phrase')
  ],
  2: [
    S('p2-a', 'trier', 'Quels groupes ne sont pas des phrases complètes ?', [n('Le ballon rebondit.'), n('au fond du sac'), n('une grande école')], [1, 2], 'Ces deux groupes demandent encore une suite.', 'Choisis deux groupes incomplets.', 'phrase-non-phrase'),
    S('p2-b', 'observer', 'Quelle proposition a un sens complet ?', [n('La tortue avance.'), n('une tortue sur'), n('avance la dans')], [0], 'On comprend ce que fait la tortue.', 'Lis chaque proposition en entier.', 'phrase-non-phrase'),
    S('p2-c', 'trier', 'Sélectionne les deux phrases interrogatives complètes.', [n('Où habites-tu ?'), n('dans quel village'), n('Qui arrive ?')], [0, 2], 'Les deux questions complètes se terminent par un point d’interrogation.', 'Il y a deux questions.', 'interrogation'),
    S('p2-d', 'completer', 'Quel ajout transforme « Les élèves… » en phrase ?', [n('dans'), n('travaillent.'), n('les grands')], [1], '« Les élèves travaillent. » est une phrase.', 'Cherche ce que font les élèves.', 'phrase-complete'),
    S('p2-e', 'trier', 'Quels messages sont incomplets ?', [n('La cloche retentit.'), n('Quand la cloche'), n('sous la table')], [1, 2], 'Ces groupes ont besoin d’une suite.', 'Deux réponses sont attendues.', 'phrase-non-phrase'),
    S('p2-f', 'observer', 'Quel exemple montre qu’un point ne suffit pas ?', [n('Le chien aboie.'), n('Le chien mange dans.'), n('Nora danse.')], [1], '« Le chien mange dans. » reste incomplet malgré le point.', 'Cherche le groupe avec un point mais sans information complète.', 'sens-phrase'),
    S('p2-g', 'trier', 'Choisis toutes les phrases qui racontent une action.', [n('Le facteur arrive.'), n('une lettre bleue'), n('Maman prépare le repas.')], [0, 2], 'Dans chacune, quelqu’un fait quelque chose.', 'Il y a deux réponses.', 'phrase-non-phrase'),
    S('p2-h', 'completer', 'Quel début complète « … ouvre la porte. » ?', [n('Une grande'), n('Salomé'), n('Devant la')], [1], '« Salomé ouvre la porte. » est une phrase complète.', 'Qui ouvre la porte ?', 'phrase-complete')
  ],
  3: [
    O('p3-a', 'construire', 'Construis une phrase sur le lapin.', [b('Le lapin','subject','gs'),b('saute','verb','gv'),b('dans le pré','place','cp'),b('.','punctuation')], 'Le lapin saute dans le pré.', 'Commence par celui qui saute.', 'ordre-mots'),
    O('p3-b', 'construire', 'Remets les mots en ordre.', [b('Sara','subject','gs'),b('lit','verb','gv'),b('un livre','complement','gv'),b('.','punctuation')], 'Sara lit un livre.', 'Qui lit ?', 'ordre-mots'),
    O('p3-c', 'construire', 'Construis une phrase complète.', [b('Les chats','subject','gs'),b('dorment','verb','gv'),b('sur le tapis','place','cp'),b('.','punctuation')], 'Les chats dorment sur le tapis.', 'Cherche le sujet pluriel.', 'ordre-mots'),
    S('p3-d', 'analyser', 'Quel bloc doit venir juste après « Le cheval » ?', [n('galopent'),n('galope'),n('galopons')], [1], 'Le cheval est seul : il galope.', 'Remplace « Le cheval » par « il ».', 'accord-sujet-verbe', 'Le cheval …'),
    O('p3-e', 'construire', 'Raconte ce que fait Inès.', [b('Inès','subject','gs'),b('dessine','verb','gv'),b('une étoile','complement','gv'),b('.','punctuation')], 'Inès dessine une étoile.', 'Place Inès au début.', 'ordre-mots'),
    S('p3-f', 'trier', 'Quelle suite de blocs est dans un ordre possible ?', [n('Mila prépare le repas.'),n('Prépare Mila le repas.'),n('Le repas Mila prépare.')], [0], 'Dans cette phrase déclarative, le sujet précède le verbe.', 'Cherche qui prépare et ce qu’elle prépare.', 'ordre-mots'),
    O('p3-g', 'construire', 'Construis la phrase avec la ponctuation.', [b('Le vent','subject','gs'),b('souffle','verb','gv'),b('fort','manner','cp'),b('.','punctuation')], 'Le vent souffle fort.', 'Commence par « Le vent ».', 'ordre-mots'),
    O('p3-h', 'construire', 'Mets les blocs en ordre.', [b('Nous','pronoun','gs'),b('jouons','verb','gv'),b('aux cartes','complement','gv'),b('.','punctuation')], 'Nous jouons aux cartes.', 'Le pronom sujet vient avant le verbe.', 'ordre-mots')
  ],
  4: [
    S('p4-a', 'analyser', 'Qui fait l’action ?', [b('Ma sœur','subject'),b('arrose','verb'),b('les fleurs','complement')], [0], 'Ma sœur est le sujet : c’est elle qui arrose.', 'Qui arrose ?', 'sujet', 'Ma sœur arrose les fleurs.'),
    S('p4-b', 'analyser', 'Quel mot indique ce qui se passe ?', [b('Les feuilles','subject'),b('tombent','verb'),b('en automne','time')], [1], '« tombent » est le verbe.', 'Que font les feuilles ?', 'verbe', 'Les feuilles tombent en automne.'),
    S('p4-c', 'completer', 'Quel verbe convient à « Les chiens… » ?', [n('aboie'),n('aboient'),n('aboyons')], [1], '« Les chiens » peut devenir « ils » : ils aboient.', 'Le sujet désigne plusieurs chiens.', 'accord-sujet-verbe'),
    S('p4-d', 'analyser', 'Quel est le sujet de « brille » ?', [b('Le soleil','subject'),b('brille','verb'),b('ce matin','time')], [0], 'Le soleil est ce qui brille.', 'Qui est-ce qui brille ?', 'sujet', 'Le soleil brille ce matin.'),
    S('p4-e', 'completer', 'Complète « La petite souris… ».', [n('mangent'),n('mange'),n('mangeons')], [1], 'Une seule souris mange.', 'Remplace le sujet par « elle ».', 'accord-sujet-verbe'),
    S('p4-f', 'analyser', 'Quel bloc est le verbe ?', [b('Nora','subject'),b('répare','verb'),b('son vélo','complement')], [1], '« répare » dit ce que fait Nora.', 'Que fait Nora ?', 'verbe', 'Nora répare son vélo.'),
    S('p4-g', 'trier', 'Quelles phrases ont un accord correct ?', [n('Les enfants chantent.'),n('Le chat dorment.'),n('La fleur pousse.')], [0, 2], '« Les enfants chantent » et « La fleur pousse » sont accordés.', 'Il y a deux réponses.', 'accord-sujet-verbe'),
    S('p4-h', 'completer', 'Quel sujet convient à « … jouons » ?', [n('Nous'),n('Ils'),n('Elle')], [0], 'Avec « nous », le verbe est « jouons ».', 'Observe la terminaison du verbe.', 'accord-sujet-verbe')
  ],
  5: [
    O('p5-a', 'construire', 'Rassemble le groupe qui nomme l’animal.', [b('Le','determiner','gn'),b('grand','adjective','gn'),b('chien','noun','gn')], '« Le grand chien » fonctionne comme un groupe.', 'Le déterminant ouvre le groupe.', 'groupes-mots'),
    O('p5-b', 'construire', 'Construis un groupe de mots cohérent.', [b('une','determiner','gn'),b('jolie','adjective','gn'),b('maison','noun','gn')], '« une jolie maison » nomme une maison.', 'Le nom est « maison ».', 'groupes-mots'),
    S('p5-c', 'analyser', 'Quel groupe peut se déplacer ensemble ?', [n('dans le jardin'),n('dans / jardin'),n('le / court')], [0], '« dans le jardin » forme un groupe de lieu.', 'Choisis des mots qui gardent leur sens ensemble.', 'groupes-mots'),
    S('p5-d', 'analyser', 'Dans la phrase, quel groupe désigne celui qui agit ?', [b('Les petites fourmis','subject'),b('transportent','verb'),b('une feuille','complement')], [0], 'Tout le groupe « Les petites fourmis » désigne celles qui agissent.', 'Qui transporte ?', 'groupe-sujet', 'Les petites fourmis transportent une feuille.'),
    O('p5-e', 'construire', 'Assemble deux groupes puis le point.', [b('Le jeune marin','subject','gs'),b('salue le port','verb','gv'),b('.','punctuation')], 'Le groupe sujet et le groupe verbal forment une phrase.', 'Le groupe sujet vient d’abord.', 'groupes-mots'),
    S('p5-f', 'trier', 'Quels groupes peuvent répondre à « où ? » ?', [n('sous le lit'),n('dans la cour'),n('très lentement')], [0, 1], 'Les deux premiers groupes indiquent un lieu.', 'Deux lieux sont attendus.', 'groupe-lieu'),
    S('p5-g', 'analyser', 'Quel groupe contient le verbe ?', [n('Le vieux bateau'),n('avance doucement'),n('le vieux')], [1], '« avance doucement » est centré sur le verbe « avance ».', 'Cherche ce qui se passe.', 'groupe-verbal'),
    O('p5-h', 'construire', 'Forme le groupe qui nomme les fleurs.', [b('les','determiner','gn'),b('petites','adjective','gn'),b('fleurs','noun','gn')], 'Ces trois mots forment un groupe nominal.', 'Le déterminant commence le groupe.', 'groupes-mots')
  ],
  6: [
    O('p6-a', 'construire', 'Assemble un groupe nominal féminin.', [b('la','determiner','gn'),b('rivière','noun','gn')], '« la rivière » contient un déterminant et un nom.', 'Le déterminant vient avant le nom.', 'groupe-nominal'),
    O('p6-b', 'construire', 'Construis un groupe nominal au pluriel.', [b('les','determiner','gn'),b('arbres','noun','gn')], '« les arbres » est un groupe nominal pluriel.', 'Place « les » avant « arbres ».', 'groupe-nominal'),
    S('p6-c', 'analyser', 'Quel mot est le déterminant ?', [b('ces','determiner','gn'),b('oiseaux','noun','gn')], [0], '« ces » accompagne le nom « oiseaux ».', 'Cherche le mot placé avant le nom.', 'determinant', 'ces oiseaux'),
    S('p6-d', 'completer', 'Quel déterminant convient à « … maison » ?', [n('un'),n('une'),n('des')], [1], '« maison » est féminin singulier : une maison.', 'Un seul nom féminin.', 'accord-groupe-nominal'),
    S('p6-e', 'analyser', 'Dans « un grand cheval », quel est le nom ?', [b('un','determiner','gn'),b('grand','adjective','gn'),b('cheval','noun','gn')], [2], '« cheval » est le nom principal.', 'Quel mot désigne l’animal ?', 'nom', 'un grand cheval'),
    O('p6-f', 'construire', 'Assemble le déterminant et le nom.', [b('des','determiner','gn'),b('étoiles','noun','gn')], '« des étoiles » est un groupe nominal.', 'Le petit mot vient d’abord.', 'groupe-nominal'),
    S('p6-g', 'trier', 'Quels exemples sont des groupes nominaux ?', [n('le jardin'),n('une chanson'),n('court vite')], [0, 1], 'Les deux premiers contiennent un déterminant et un nom.', 'Il y a deux réponses.', 'groupe-nominal'),
    S('p6-h', 'completer', 'Quel nom peut suivre « les » ?', [n('court'),n('fleurs'),n('vite')], [1], '« les fleurs » forme un groupe nominal.', 'Cherche un nom au pluriel.', 'determinant-nom')
  ],
  7: [
    O('p7-a', 'construire', 'Construis un groupe nominal enrichi.', [b('une','determiner','gn'),b('petite','adjective','gn'),b('étoile','noun','gn')], 'L’adjectif « petite » précise « étoile ».', 'Commence par « une ».', 'adjectif'),
    O('p7-b', 'construire', 'Place l’adjectif après le nom.', [b('un','determiner','gn'),b('bateau','noun','gn'),b('bleu','adjective','gn')], '« bleu » précise le bateau.', 'L’adjectif vient ici après le nom.', 'adjectif'),
    S('p7-c', 'completer', 'Complète « des arbres … ».', [n('vert'),n('verts'),n('verte')], [1], '« arbres » est masculin pluriel : verts.', 'Plusieurs arbres.', 'accord-groupe-nominal'),
    S('p7-d', 'completer', 'Quel adjectif convient à « une porte … » ?', [n('ouverte'),n('ouvert'),n('ouverts')], [0], '« porte » est féminin singulier : ouverte.', 'Remplace par « elle est… ».', 'accord-groupe-nominal'),
    S('p7-e', 'analyser', 'Quel mot précise le nom ?', [b('le','determiner','gn'),b('vieux','adjective','gn'),b('pont','noun','gn')], [1], '« vieux » est un adjectif.', 'Quel mot donne un détail sur le pont ?', 'adjectif', 'le vieux pont'),
    O('p7-f', 'construire', 'Assemble le groupe au féminin pluriel.', [b('les','determiner','gn'),b('longues','adjective','gn'),b('routes','noun','gn')], 'Déterminant, adjectif et nom sont au pluriel.', 'Commence par « les ».', 'accord-groupe-nominal'),
    S('p7-g', 'trier', 'Quels groupes sont bien accordés ?', [n('une fleur blanche'),n('des petits chats'),n('une grand maison')], [0, 1], 'Les deux premiers groupes sont correctement accordés.', 'Deux groupes conviennent.', 'accord-groupe-nominal'),
    S('p7-h', 'completer', 'Choisis la suite correcte : « les … fleurs ».', [n('jolie'),n('jolies'),n('jolis')], [1], '« fleurs » est féminin pluriel : jolies.', 'Plusieurs fleurs.', 'accord-groupe-nominal')
  ],
  8: [
    S('p8-a', 'analyser', 'Repère tous les mots du groupe sujet de la musicienne.', [b('La','determiner','gs'),b('jeune','adjective','gs'),b('musicienne','noun','gs'),b('répète','verb','gv')], [0,1,2], 'Le sujet complet est « La jeune musicienne ».', 'Qui répète ?', 'groupe-sujet', 'La jeune musicienne répète.'),
    S('p8-b', 'analyser', 'Choisis les blocs du groupe verbal du bus.', [b('Le vieux bus','subject','gs'),b('traverse','verb','gv'),b('le village','complement','gv')], [1,2], 'Le groupe verbal est « traverse le village ».', 'Il commence par le verbe.', 'groupe-verbal', 'Le vieux bus traverse le village.'),
    O('p8-c', 'construire', 'Construis la phrase des enfants curieux.', [b('Les enfants curieux','subject','gs'),b('observent les nuages','verb','gv'),b('.','punctuation')], 'Le groupe sujet précède le groupe verbal.', 'Qui observe ?', 'groupe-sujet-verbal'),
    S('p8-d', 'analyser', 'Quel groupe peut être remplacé par « elle » ?', [b('La grande forêt','subject','gs'),b('abrite','verb','gv'),b('des animaux','complement','gv')], [0], '« La grande forêt » est le groupe sujet.', 'De qui parle-t-on ?', 'groupe-sujet', 'La grande forêt abrite des animaux.'),
    S('p8-e', 'analyser', 'Choisis le groupe verbal complet.', [n('soulève'),n('soulève la valise'),n('La voyageuse')], [1], 'Le groupe verbal comprend ici le verbe et son complément.', 'Que fait la voyageuse ?', 'groupe-verbal', 'La voyageuse soulève la valise.'),
    O('p8-f', 'construire', 'Place le groupe sujet avant le groupe verbal.', [b('Le petit écureuil','subject','gs'),b('cache des noisettes','verb','gv'),b('.','punctuation')], 'La phrase est formée de deux grands groupes.', 'Commence par celui qui cache.', 'groupe-sujet-verbal'),
    S('p8-g', 'trier', 'Quels groupes appartiennent au groupe sujet ?', [b('Les','determiner','gs'),b('oiseaux','noun','gs'),b('chantent','verb','gv'),b('doucement','manner','cp')], [0,1], '« Les oiseaux » forme le groupe sujet.', 'Qui chante ?', 'groupe-sujet', 'Les oiseaux chantent doucement.'),
    S('p8-h', 'analyser', 'Quel groupe dit ce que fait Lina ?', [n('Lina'),n('dessine un arbre'),n('un arbre')], [1], '« dessine un arbre » est le groupe verbal.', 'Cherche le verbe et ce qui le complète.', 'groupe-verbal', 'Lina dessine un arbre.')
  ],
  9: [
    O('p9-a', 'construire', 'Ajoute le lieu à la phrase.', [b('Nina','subject','gs'),b('chante','verb','gv'),b('dans le jardin','place','cp'),b('.','punctuation')], 'Le lieu précise où Nina chante.', 'Commence par Nina.', 'complement-lieu'),
    O('p9-b', 'construire', 'Ajoute le moment.', [b('Le train','subject','gs'),b('arrive','verb','gv'),b('ce soir','time','cp'),b('.','punctuation')], '« ce soir » précise le moment.', 'Place le sujet au début.', 'complement-temps'),
    S('p9-c', 'analyser', 'Quel groupe complète directement « mange » ?', [b('Le garçon','subject','gs'),b('mange','verb','gv'),b('une pomme','complement','gv'),b('à midi','time','cp')], [2], '« une pomme » répond à « mange quoi ? ».', 'Que mange le garçon ?', 'complement-verbe', 'Le garçon mange une pomme à midi.'),
    S('p9-d', 'trier', 'Quels ajouts indiquent un lieu ?', [n('près du lac'),n('demain'),n('sous la table')], [0,2], 'Les deux groupes situent l’action dans l’espace.', 'Deux lieux sont attendus.', 'complement-lieu'),
    O('p9-e', 'construire', 'Enrichis la phrase avec deux informations.', [b('Les voisins','subject','gs'),b('discutent','verb','gv'),b('sur le balcon','place','cp'),b('le soir','time','cp'),b('.','punctuation')], 'Le lieu et le temps peuvent changer de place.', 'Commence par le sujet et le verbe.', 'complements', [[0,1,3,2,4]]),
    S('p9-f', 'completer', 'Quel ajout répond à « quand ? » ?', [n('dans le parc'),n('après l’école'),n('avec joie')], [1], '« après l’école » indique le temps.', 'Cherche le moment.', 'complement-temps'),
    O('p9-g', 'construire', 'Ajoute un complément à la phrase.', [b('La joueuse','subject','gs'),b('lance','verb','gv'),b('la balle','complement','gv'),b('.','punctuation')], '« la balle » complète le verbe « lance ».', 'Elle lance quoi ?', 'complement-verbe'),
    S('p9-h', 'analyser', 'Quel complément peut être déplacé en début de phrase ?', [n('la balle'),n('dans la cour'),n('le livre')], [1], '« Dans la cour, … » peut se placer au début.', 'Cherche une indication de lieu.', 'complement-phrase', 'Les enfants jouent dans la cour.'),
    S('p9-i', 'comparer', 'Compare « la balle » et « dans la cour » : lequel est un complément de verbe (CV) ?', [b('La joueuse','subject'),b('lance','verb'),b('la balle','complement','gv','COMPLÉMENT DE VERBE (CV)'),b('dans la cour','place','cp','COMPLÉMENT DE PHRASE (CP)')], [2], '« la balle » complète le verbe « lance » ; « dans la cour » peut se déplacer : c’est un complément de phrase.', 'Essaie de déplacer chaque groupe au début de la phrase.', 'complement-verbe', 'La joueuse lance la balle dans la cour.')
  ],
  10: [
    S('p10-a', 'analyser', 'Qu’est-ce qui indique la manière ?', [n('avec soin'),n('ce matin'),n('sous le banc')], [0], '« avec soin » dit comment on agit.', 'Pose la question « comment ? ».', 'complement-maniere'),
    S('p10-b', 'analyser', 'Quel groupe indique un moment ?', [n('au bord du lac'),n('pendant la nuit'),n('silencieusement')], [1], '« pendant la nuit » répond à « quand ? ».', 'Cherche le temps.', 'complement-temps'),
    S('p10-c', 'analyser', 'Quel groupe indique un endroit ?', [n('demain matin'),n('dans la cave'),n('sans bruit')], [1], '« dans la cave » répond à « où ? ».', 'Cherche le lieu.', 'complement-lieu'),
    S('p10-d', 'trier', 'Sélectionne les deux compléments de temps.', [n('le mercredi'),n('sous le pont'),n('à midi')], [0,2], 'Les deux groupes indiquent quand cela se passe.', 'Il y a deux moments.', 'complement-temps'),
    S('p10-e', 'trier', 'Sélectionne les deux compléments de manière.', [n('lentement'),n('avec précision'),n('dans la rue')], [0,1], 'Les deux premiers indiquent comment on agit.', 'Deux réponses sont attendues.', 'complement-maniere'),
    S('p10-f', 'analyser', 'Dans la phrase, quel groupe indique le lieu ?', [b('Mila','subject'),b('court','verb'),b('sur la piste','place'),b('rapidement','manner')], [2], '« sur la piste » est le lieu.', 'Où court Mila ?', 'complement-lieu', 'Mila court rapidement sur la piste.'),
    S('p10-g', 'analyser', 'Dans la phrase, quel mot indique la manière ?', [b('Les enfants','subject'),b('marchent','verb'),b('calmement','manner'),b('ce matin','time')], [2], '« calmement » répond à « comment ? ».', 'Comment marchent-ils ?', 'complement-maniere', 'Les enfants marchent calmement ce matin.'),
    O('p10-h', 'construire', 'Construis une phrase qui précise comment le facteur marche.', [b('Le facteur','subject','gs'),b('marche','verb','gv'),b('calmement','manner','cp'),b('.','punctuation')], '« calmement » indique la manière de marcher.', 'Commence par le sujet, puis le verbe.', 'complement-maniere')
  ],
  11: [
    O('p11-a', 'transformer', 'Transforme « Lina chante. » à la forme négative.', [b('Lina','subject','gs'),b('ne','negation','gv'),b('chante','verb','gv'),b('pas','negation','gv'),b('.','punctuation')], '« ne » et « pas » encadrent le verbe.', 'Place « ne » avant « chante ».', 'negation', [], 'Lina chante.'),
    O('p11-b', 'transformer', 'Pose la question avec « Est-ce que ».', [b('Est-ce que','neutral'),b('vous','pronoun','gs'),b('jouez','verb','gv'),b('?','punctuation')], 'La question est « Est-ce que vous jouez ? ».', 'La question commence par « Est-ce que ».', 'interrogation', [], 'Vous jouez.'),
    S('p11-c', 'trier', 'Quelles phrases sont négatives ?', [n('Le soleil ne brille pas.'),n('Le soleil brille.'),n('Les oiseaux ne chantent plus.')], [0,2], 'Les négations sont « ne … pas » et « ne … plus ».', 'Il y a deux phrases négatives.', 'negation'),
    S('p11-d', 'trier', 'Quelles phrases posent une question ?', [n('Tu viens ?'),n('Est-ce qu’il pleut ?'),n('Il pleut.')], [0,1], 'Les deux premières demandent une réponse.', 'Cherche deux questions.', 'interrogation'),
    S('p11-e', 'completer', 'Quel mot complète « Je ne joue … » ?', [n('pas'),n('très'),n('dans')], [0], '« Je ne joue pas » est une forme négative.', 'Cherche la deuxième partie de la négation.', 'negation'),
    O('p11-f', 'transformer', 'Mets « Le chien aboie. » à la forme négative.', [b('Le chien','subject','gs'),b('n’','negation','gv'),b('aboie','verb','gv'),b('pas','negation','gv'),b('.','punctuation')], 'Devant une voyelle, « ne » devient « n’ ».', 'La négation entoure « aboie ».', 'negation', [], 'Le chien aboie.'),
    S('p11-g', 'analyser', 'Quel signe termine une question écrite ?', [n('.'),n('?'),n('!')], [1], 'Une question se termine par « ? ».', 'Cherche le point d’interrogation.', 'interrogation'),
    S('p11-h', 'transformer', 'Quelle transformation garde le sens de « Tu dessines. » en question ?', [n('Est-ce que tu dessines ?'),n('Tu ne dessines pas.'),n('Dessine tu.')], [0], '« Est-ce que tu dessines ? » est la question attendue.', 'Cherche une phrase qui demande une réponse.', 'interrogation')
  ],
  12: [
    S('p12-a', 'completer', 'Remplace « Les garçons » par un pronom.', [n('Il'),n('Ils'),n('Elles')], [1], '« Les garçons » peut devenir « ils ».', 'Plusieurs garçons.', 'pronominalisation'),
    S('p12-b', 'completer', 'Remplace « La fleur » par un pronom.', [n('Elle'),n('Elles'),n('Il')], [0], 'Une fleur : elle.', 'Féminin singulier.', 'pronominalisation'),
    S('p12-c', 'completer', 'Complète « Vous … une chanson. ».', [n('chante'),n('chantez'),n('chantent')], [1], 'Avec « vous », on écrit « chantez ».', 'Regarde le pronom sujet.', 'accord-sujet-verbe'),
    S('p12-d', 'trier', 'Quels accords sont corrects ?', [n('Nous lisons.'),n('Elles joue.'),n('Il écoute.')], [0,2], '« Nous lisons » et « Il écoute » sont accordés.', 'Deux phrases sont justes.', 'accord-sujet-verbe'),
    O('p12-e', 'construire', 'Construis une phrase au pluriel.', [b('Elles','pronoun','gs'),b('préparent','verb','gv'),b('un spectacle','complement','gv'),b('.','punctuation')], '« Elles » s’accorde avec « préparent ».', 'Commence par le pronom.', 'accord-sujet-verbe'),
    S('p12-f', 'completer', 'Quel pronom remplace « Le vieux pont » ?', [n('Elles'),n('Il'),n('Ils')], [1], '« Le vieux pont » est masculin singulier : il.', 'Un seul pont.', 'pronominalisation'),
    S('p12-g', 'completer', 'Quel verbe convient à « Mes amies… » ?', [n('vient'),n('viennent'),n('venons')], [1], '« Mes amies » peut devenir « elles » : elles viennent.', 'Plusieurs amies.', 'accord-sujet-verbe'),
    O('p12-h', 'construire', 'Assemble une phrase avec « nous ».', [b('Nous','pronoun','gs'),b('observons','verb','gv'),b('les étoiles','complement','gv'),b('.','punctuation')], 'Le verbe « observons » s’accorde avec « nous ».', 'Commence par « Nous ».', 'accord-sujet-verbe')
  ],
  13: [
    S('p13-a', 'analyser', 'Sélectionne le sujet complet.', [b('Les oiseaux','subject','gs'),b('du grand jardin','subject','gs'),b('chantent','verb','gv')], [0,1], 'Le sujet complet est « Les oiseaux du grand jardin ».', 'Qui chante ?', 'sujet-long', 'Les oiseaux du grand jardin chantent.'),
    S('p13-b', 'analyser', 'Dans cette phrase, quel groupe est sujet ?', [b('Sous le pont','place','cp'),b('passent','verb','gv'),b('les bateaux','subject','gs')], [2], 'Le sujet inversé est « les bateaux ».', 'Qu’est-ce qui passe ?', 'sujet-inverse', 'Sous le pont passent les bateaux.'),
    S('p13-c', 'completer', 'Quel verbe convient au sujet long ?', [n('arrive'),n('arrivent'),n('arrivons')], [1], '« Les élèves de cette classe » est pluriel : ils arrivent.', 'Remplace le groupe sujet par « ils ».', 'accord-sujet-long', 'Les élèves de cette classe … bientôt.'),
    O('p13-d', 'construire', 'Construis une phrase à sujet inversé.', [b('Dans le ciel','place','cp'),b('passent','verb','gv'),b('de grands oiseaux','subject','gs'),b('.','punctuation')], 'Le sujet « de grands oiseaux » suit le verbe.', 'Le lieu ouvre la phrase.', 'sujet-inverse'),
    S('p13-e', 'analyser', 'Quel est le noyau du sujet ?', [n('Les'),n('fleurs'),n('du jardin')], [1], 'Dans « Les fleurs du jardin », le nom noyau est « fleurs ».', 'Quel nom commande l’accord ?', 'sujet-long', 'Les fleurs du jardin poussent.'),
    S('p13-f', 'completer', 'Quel verbe convient dans « Au loin … les cloches » ?', [n('sonne'),n('sonnent'),n('sonnons')], [1], 'Le sujet « les cloches » est après le verbe et au pluriel.', 'Remplace « les cloches » par « elles ».', 'accord-sujet-inverse'),
    S('p13-g', 'analyser', 'Sélectionne toutes les parties du sujet.', [b('La petite maison','subject','gs'),b('au toit rouge','subject','gs'),b('résiste','verb','gv'),b('au vent','complement','gv')], [0,1], 'Le sujet complet est « La petite maison au toit rouge ».', 'Qu’est-ce qui résiste ?', 'sujet-long', 'La petite maison au toit rouge résiste au vent.'),
    S('p13-h', 'trier', 'Quelles phrases ont un sujet après le verbe ?', [n('Dans la cour jouent les enfants.'),n('Les enfants jouent dans la cour.'),n('Au loin brillent deux étoiles.')], [0,2], 'Dans les deux phrases choisies, le sujet suit le verbe.', 'Il y a deux sujets inversés.', 'sujet-inverse')
  ],
  14: [
    O('p14-a', 'construire', 'Construis une phrase avec lieu et temps.', [b('Les jeunes musiciens','subject','gs'),b('répètent','verb','gv'),b('dans la salle','place','cp'),b('ce soir','time','cp'),b('.','punctuation')], 'Le lieu et le temps peuvent permuter.', 'Place le sujet et le verbe d’abord.', 'phrase-enrichie', [[0,1,3,2,4]]),
    O('p14-b', 'construire', 'Enrichis la phrase avec une manière.', [b('La petite équipe','subject','gs'),b('prépare','verb','gv'),b('soigneusement','manner','cp'),b('un spectacle','complement','gv'),b('.','punctuation')], 'La manière précise comment l’équipe prépare le spectacle.', 'Le sujet précède le verbe.', 'phrase-enrichie', [[0,1,3,2,4]]),
    S('p14-c', 'analyser', 'Sélectionne les compléments de phrase.', [b('La scientifique','subject','gs'),b('observe','verb','gv'),b('les étoiles','complement','gv'),b('la nuit','time','cp'),b('avec attention','manner','cp')], [3,4], '« la nuit » et « avec attention » précisent le temps et la manière.', 'Deux informations peuvent se déplacer.', 'complements', 'La scientifique observe les étoiles la nuit avec attention.'),
    S('p14-d', 'trier', 'Quelles phrases enrichies sont bien accordées ?', [n('Les petits renards traversent la forêt.'),n('La grande chouette observent le ciel.'),n('Une jeune fille marche doucement.')], [0,2], 'Les deux phrases choisies ont un accord juste.', 'Il y a deux réponses.', 'accord-sujet-verbe'),
    O('p14-e', 'transformer', 'Construis une phrase négative enrichie.', [b('Les enfants','subject','gs'),b('ne','negation','gv'),b('jouent','verb','gv'),b('pas','negation','gv'),b('dehors','place','cp'),b('ce soir','time','cp'),b('.','punctuation')], 'La négation entoure « jouent » ; les compléments précisent le lieu et le temps.', 'Place « ne » avant le verbe.', 'phrase-enrichie'),
    S('p14-f', 'completer', 'Quel verbe convient au sujet enrichi ?', [n('observe'),n('observent'),n('observons')], [1], '« Les jeunes exploratrices du village » est pluriel : elles observent.', 'Repère le nom noyau « exploratrices ».', 'accord-sujet-long', 'Les jeunes exploratrices du village … le ciel.'),
    O('p14-g', 'construire', 'Place le sujet après le verbe dans la phrase de la vallée.', [b('Dans la vallée','place','cp'),b('avancent','verb','gv'),b('trois grands chevaux','subject','gs'),b('.','punctuation')], '« trois grands chevaux » est le sujet, placé après le verbe.', 'Commence par le lieu.', 'sujet-inverse'),
    S('p14-h', 'analyser', 'Quel groupe est le sujet complet ?', [b('Au lever du jour','time','cp'),b('chantent','verb','gv'),b('les oiseaux de la forêt','subject','gs'),b('doucement','manner','cp')], [2], 'Le sujet est « les oiseaux de la forêt », après le verbe.', 'Qui chante ?', 'sujet-inverse', 'Au lever du jour chantent doucement les oiseaux de la forêt.'),
    S('p14-i', 'analyser', 'Dans « Lina offre un livre à Sami », quel groupe est le CVD ?', [b('Lina','subject','gs'),b('offre','verb','gv'),b('un livre','complement','gv','COMPLÉMENT DE VERBE DIRECT (CVD)'),b('à Sami','complement','gv','COMPLÉMENT DE VERBE INDIRECT (CVI)')], [2], '« un livre » complète « offre » sans préposition : c’est le complément de verbe direct (CVD).', 'Cherche le groupe relié directement au verbe.', 'complement-verbe-direct', 'Lina offre un livre à Sami.'),
    S('p14-j', 'analyser', 'Quel groupe est le CVI dans cette phrase ?', [b('Les enfants','subject','gs'),b('parlent','verb','gv'),b('à leur maîtresse','complement','gv','COMPLÉMENT DE VERBE INDIRECT (CVI)'),b('ce matin','time','cp','COMPLÉMENT DE PHRASE (CP)')], [2], '« à leur maîtresse » complète « parlent » avec la préposition « à » : c’est le complément de verbe indirect (CVI). « ce matin » est un complément de phrase.', 'Cherche le groupe relié au verbe par « à ».', 'complement-verbe-indirect', 'Les enfants parlent à leur maîtresse ce matin.'),
    S('p14-k', 'trier', 'Quels groupes sont des compléments de phrase (CP) dans cette phrase ?', [b('Les élèves','subject','gs'),b('lisent','verb','gv'),b('un conte','complement','gv','COMPLÉMENT DE VERBE (CV)'),b('ce matin','time','cp','COMPLÉMENT DE PHRASE (CP) · TEMPS'),b('dans la classe','place','cp','COMPLÉMENT DE PHRASE (CP) · LIEU')], [3,4], '« ce matin » et « dans la classe » peuvent être déplacés ou supprimés ; « un conte » complète le verbe « lisent ».', 'Essaie de mettre les groupes au début de la phrase.', 'complement-phrase', 'Les élèves lisent un conte ce matin dans la classe.'),
    S('p14-l', 'analyser', 'Dans « Nora montre la carte à Jules », repère le CVD.', [b('Nora','subject','gs'),b('montre','verb','gv'),b('la carte','complement','gv','COMPLÉMENT DE VERBE DIRECT (CVD)'),b('à Jules','complement','gv','COMPLÉMENT DE VERBE INDIRECT (CVI)')], [2], '« la carte » est le CVD : ce groupe complète « montre » sans préposition.', 'Nora montre quoi ?', 'complement-verbe-direct', 'Nora montre la carte à Jules.'),
    S('p14-m', 'analyser', 'Dans « Le garçon pense à son ami », repère le CVI.', [b('Le garçon','subject','gs'),b('pense','verb','gv'),b('à son ami','complement','gv','COMPLÉMENT DE VERBE INDIRECT (CVI)'),b('chaque soir','time','cp','COMPLÉMENT DE PHRASE (CP)')], [2], '« à son ami » est le CVI : ce groupe complète « pense » avec la préposition « à ». « chaque soir » est un CP.', 'Le garçon pense à qui ?', 'complement-verbe-indirect', 'Le garçon pense à son ami chaque soir.')
  ]
};
