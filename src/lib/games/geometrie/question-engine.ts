import { getFiguresForLevel } from './figures';
import type { GeometryFigure, Level, Mode, PlayMode, Question, QuestionOption } from './types';

/** Mélange Fisher–Yates : contrairement à sort(Math.random), chaque permutation
 * est produite par un algorithme de mélange correct. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function choose<T>(items: T[], random: () => number): T {
  if (items.length === 0) throw new Error('Impossible de choisir un élément dans une liste vide.');
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function optionsFor(figures: GeometryFigure[]): QuestionOption[] {
  return figures.map((figure) => ({ id: figure.id, label: figure.name, figure }));
}

/** Les questions passent toutes par ce validateur avant d'être affichées. */
export function validateQuestion(question: Question): boolean {
  if (!question.text.trim() || question.options.length < 2 || question.correctIds.length === 0) return false;
  const optionIds = question.options.map((option) => option.id);
  const optionLabels = question.options.map((option) => option.label.trim().toLocaleLowerCase('fr'));
  if (new Set(optionIds).size !== optionIds.length) return false;
  if (new Set(optionLabels).size !== optionLabels.length) return false;
  if (question.correctIds.some((id) => !optionIds.includes(id))) return false;
  if (new Set(question.correctIds).size !== question.correctIds.length) return false;
  if (question.type === 'single' && question.correctIds.length !== 1) return false;
  if (question.type === 'multiple' && (question.correctIds.length < 2 || question.correctIds.length >= question.options.length)) return false;
  return true;
}

type Clue = { text: string; matches: (figure: GeometryFigure) => boolean };

/** Crée des indices à partir de données géométriques explicites, jamais du nom. */
function buildClues(target: GeometryFigure): Clue[] {
  const p = target.properties;
  const clues: Clue[] = [];
  clues.push({ text: target.kind === 'plane' ? 'Je suis une figure plane (2D).' : 'Je suis un solide (3D).', matches: (figure) => figure.kind === target.kind });
  if (target.kind === 'plane') {
    if (p.curvedBoundary) {
      clues.push({ text: 'Mon contour est entièrement courbe.', matches: (figure) => figure.properties.curvedBoundary === true });
    } else if (p.straightSides !== undefined) {
      clues.push({ text: `Mon contour possède ${p.straightSides} côtés droits.`, matches: (figure) => figure.kind === 'plane' && figure.properties.straightSides === p.straightSides });
    }
    if (p.vertices !== undefined) clues.push({ text: `Je possède ${p.vertices} sommet${p.vertices > 1 ? 's' : ''}.`, matches: (figure) => figure.kind === 'plane' && figure.properties.vertices === p.vertices });
    if (p.rightAngles !== undefined) clues.push({ text: p.rightAngles === 0 ? 'Je ne possède aucun angle droit.' : `Je possède ${p.rightAngles} angle${p.rightAngles > 1 ? 's' : ''} droit${p.rightAngles > 1 ? 's' : ''}.`, matches: (figure) => figure.kind === 'plane' && figure.properties.rightAngles === p.rightAngles });
    if (p.equalSidePattern !== undefined) {
      const texts = {
        none: 'Aucun de mes côtés n’a la même longueur qu’un autre.',
        'all-different': 'Mes trois côtés ont des longueurs différentes.',
        'one-pair': 'Je possède exactement un couple de côtés égaux dans cette catégorie.',
        'opposite-pairs': 'Mes côtés opposés sont égaux deux à deux.',
        'adjacent-pairs': 'Je possède deux couples de côtés voisins égaux.',
        all: 'Tous mes côtés ont la même longueur.'
      } as const;
      clues.push({ text: texts[p.equalSidePattern], matches: (figure) => figure.kind === 'plane' && figure.properties.equalSidePattern === p.equalSidePattern });
    }
    if (p.parallelPairs !== undefined) clues.push({ text: p.parallelPairs === 0 ? 'Je ne possède aucune paire de côtés parallèles.' : `Je possède ${p.parallelPairs} paire${p.parallelPairs > 1 ? 's' : ''} de côtés parallèles.`, matches: (figure) => figure.kind === 'plane' && figure.properties.parallelPairs === p.parallelPairs });
    if (p.symmetryAxes !== undefined) clues.push({ text: p.symmetryAxes === Infinity ? 'Je possède une infinité d’axes de symétrie.' : p.symmetryAxes === 0 ? 'Je ne possède aucun axe de symétrie.' : `Je possède ${p.symmetryAxes} axe${p.symmetryAxes > 1 ? 's' : ''} de symétrie.`, matches: (figure) => figure.kind === 'plane' && figure.properties.symmetryAxes === p.symmetryAxes });
    if (p.isConvex !== undefined) clues.push({ text: p.isConvex ? 'Je suis convexe.' : 'Je suis concave.', matches: (figure) => figure.kind === 'plane' && figure.properties.isConvex === p.isConvex });
  } else {
    if (p.faces !== undefined) clues.push({ text: `Je possède ${p.faces} faces.`, matches: (figure) => figure.kind === 'solid' && figure.properties.faces === p.faces });
    if (p.edges !== undefined) clues.push({ text: `Je possède ${p.edges} arêtes.`, matches: (figure) => figure.kind === 'solid' && figure.properties.edges === p.edges });
    if (p.vertices !== undefined) clues.push({ text: `Je possède ${p.vertices} sommets.`, matches: (figure) => figure.kind === 'solid' && figure.properties.vertices === p.vertices });
    if (p.allFacesSameShape !== undefined) clues.push({ text: p.allFacesSameShape ? 'Toutes mes faces ont la même forme.' : 'Toutes mes faces n’ont pas la même forme.', matches: (figure) => figure.kind === 'solid' && figure.properties.allFacesSameShape === p.allFacesSameShape });
    if (p.triangularFaces !== undefined) clues.push({ text: `Je possède ${p.triangularFaces} face${p.triangularFaces > 1 ? 's' : ''} triangulaire${p.triangularFaces > 1 ? 's' : ''}.`, matches: (figure) => figure.kind === 'solid' && figure.properties.triangularFaces === p.triangularFaces });
  }
  return clues.filter((clue) => clue.matches(target));
}

/** Trouve le plus petit ensemble d'indices qui distingue la cible des options. */
function findDiscriminatingClues(target: GeometryFigure, others: GeometryFigure[]): Clue[] {
  const clues = buildClues(target);
  // D'abord un seul indice, puis deux, puis trois. Les combinaisons sont courtes.
  for (let size = 1; size <= Math.min(3, clues.length); size += 1) {
    const search = (start: number, picked: Clue[]): Clue[] | null => {
      if (picked.length === size) {
        const uniquelyIdentifiesTarget = others.every((other) => !picked.every((clue) => clue.matches(other)));
        return uniquelyIdentifiesTarget ? [...picked] : null;
      }
      for (let i = start; i < clues.length; i += 1) {
        const found = search(i + 1, [...picked, clues[i]]);
        if (found) return found;
      }
      return null;
    };
    const found = search(0, []);
    if (found) return found;
  }
  return [];
}

function buildModeA(pool: GeometryFigure[], random: () => number): Question {
  // Recommence les tirages si les propriétés choisies ne distinguent pas la cible.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const target = choose(pool, random);
    const otherFigures = shuffle(pool.filter((figure) => figure.id !== target.id), random);
    const selected = [target, ...otherFigures.slice(0, Math.min(3, pool.length - 1))];
    const clueSet = findDiscriminatingClues(target, selected.filter((figure) => figure.id !== target.id));
    if (selected.length >= 3 && clueSet.length > 0) {
      const ordered = shuffle(selected, random);
      const allHints = clueSet.map((clue) => clue.text);
      return {
        mode: 'A',
        text: 'Identifie la figure qui correspond aux indices géométriques.',
        type: 'single',
        options: optionsFor(ordered),
        correctIds: [target.id],
        explanation: `${target.name} : ${target.definition}`,
        progressiveHints: allHints,
        // Au moins le premier indice est montré. Les autres sont facultatifs.
        initialHintCount: 1
      };
    }
  }
  // Dernier recours sûr : question descriptive avec options qui diffèrent par dimension.
  const target = choose(pool, random);
  const others = shuffle(pool.filter((figure) => figure.id !== target.id && figure.kind !== target.kind), random);
  const fallbackOptions = [target, ...others.slice(0, 3)];
  if (fallbackOptions.length >= 2) {
    return {
      mode: 'A', text: 'La figure recherchée appartient à la catégorie indiquée par son dessin.', type: 'single',
      options: optionsFor(shuffle(fallbackOptions, random)), correctIds: [target.id],
      explanation: `${target.name} : ${target.definition}`,
      progressiveHints: [target.kind === 'plane' ? 'Observe une figure plane, sans volume.' : 'Observe un solide en trois dimensions.'],
      initialHintCount: 1
    };
  }
  throw new Error('La banque ne contient pas assez de figures pour construire une question.');
}

type Criterion = {
  id: string;
  label: string;
  check: (figure: GeometryFigure) => boolean;
  explanation: string;
};

function criteriaFor(pool: GeometryFigure[]): Criterion[] {
  const candidates: Criterion[] = [
    { id: 'plane', label: 'figure plane', check: (figure) => figure.kind === 'plane', explanation: 'Une figure plane se représente en deux dimensions : elle ne possède pas de volume.' },
    { id: 'solid', label: 'solide', check: (figure) => figure.kind === 'solid', explanation: 'Un solide est un objet géométrique en trois dimensions.' },
    { id: 'triangle', label: 'triangle', check: (figure) => figure.kind === 'plane' && figure.isTriangle, explanation: 'Un triangle est un polygone qui possède trois côtés et trois sommets.' },
    { id: 'quadrilateral', label: 'quadrilatère', check: (figure) => figure.kind === 'plane' && figure.properties.straightSides === 4, explanation: 'Un quadrilatère est un polygone qui possède quatre côtés.' },
    { id: 'right-angle', label: 'au moins un angle droit', check: (figure) => figure.kind === 'plane' && (figure.properties.rightAngles ?? 0) > 0, explanation: 'Un angle droit mesure 90 degrés.' },
    { id: 'parallel-pair', label: 'au moins une paire de côtés parallèles', check: (figure) => figure.kind === 'plane' && (figure.properties.parallelPairs ?? 0) > 0, explanation: 'Des droites parallèles gardent toujours le même écart et ne se rencontrent pas.' },
    { id: 'all-equal', label: 'tous les côtés égaux', check: (figure) => figure.kind === 'plane' && figure.properties.equalSidePattern === 'all', explanation: 'Tous les côtés égaux ont la même longueur. Cette seule propriété ne suffit pas toujours à nommer la figure.' },
    { id: 'symmetric', label: 'au moins un axe de symétrie', check: (figure) => figure.kind === 'plane' && (figure.properties.symmetryAxes ?? 0) > 0, explanation: 'Un axe de symétrie partage une figure en deux parties qui se superposent par pliage.' },
    { id: 'concave', label: 'figure concave', check: (figure) => figure.kind === 'plane' && figure.properties.isConvex === false, explanation: 'Une figure concave présente au moins un angle rentrant.' }
  ];
  // Ne conserve que les critères capables de créer un groupe de trois et un intrus.
  return candidates.filter((criterion) => {
    const matches = pool.filter(criterion.check).length;
    const misses = pool.length - matches;
    return matches >= 3 && misses >= 1;
  });
}

function buildModeB(pool: GeometryFigure[], random: () => number): Question {
  const criteria = criteriaFor(pool);
  if (criteria.length === 0) {
    // Ce cas est signalé clairement au lieu d'accéder à un tableau vide.
    return buildModeC(pool, random);
  }
  const criterion = choose(criteria, random);
  const matching = shuffle(pool.filter(criterion.check), random);
  const nonMatching = shuffle(pool.filter((figure) => !criterion.check(figure)), random);
  const group = matching.slice(0, 3);
  const intruder = choose(nonMatching, random);
  const figures = shuffle([...group, intruder], random);
  return {
    mode: 'B',
    text: `Trois figures partagent la propriété « ${criterion.label} ». Trouve l'intrus.`,
    type: 'single', options: optionsFor(figures), correctIds: [intruder.id],
    explanation: `${intruder.name} est l'intrus : il ne vérifie pas le critère « ${criterion.label} ». ${criterion.explanation}`,
    progressiveHints: ['Compare chaque figure au critère annoncé.', 'Vérifie la propriété une figure après l’autre, sans te fier uniquement à son apparence.'],
    initialHintCount: 1, criterionId: criterion.id, criterionLabel: criterion.label
  };
}

function buildModeC(pool: GeometryFigure[], random: () => number): Question {
  const target = choose(pool, random);
  return {
    mode: 'C',
    text: 'Observe le dessin, puis classe-le.',
    type: 'single',
    options: [
      { id: 'plane', label: 'Figure plane (2D)' },
      { id: 'solid', label: 'Solide (3D)' }
    ],
    correctIds: [target.kind],
    explanation: `${target.name} : ${target.definition}`,
    progressiveHints: ['Regarde si le dessin représente une forme plane ou un objet en trois dimensions.'],
    initialHintCount: 1,
    focusFigure: target
  };
}

function buildModeD(pool: GeometryFigure[], random: () => number): Question {
  const criteria = criteriaFor(pool).filter((criterion) => {
    const matches = pool.filter(criterion.check).length;
    return matches >= 2 && matches < pool.length;
  });
  if (criteria.length === 0) return buildModeA(pool, random);
  const criterion = choose(criteria, random);
  const matching = shuffle(pool.filter(criterion.check), random);
  const nonMatching = shuffle(pool.filter((figure) => !criterion.check(figure)), random);
  const selectedMatches = matching.slice(0, Math.min(3, matching.length));
  const selectedNonMatches = nonMatching.slice(0, Math.min(3, nonMatching.length));
  const selected = shuffle([...selectedMatches, ...selectedNonMatches], random);
  const correctIds = selected.filter(criterion.check).map((figure) => figure.id);
  return {
    mode: 'D',
    text: `Parmi ces propositions, sélectionne toutes les figures qui vérifient : « ${criterion.label} ».`,
    type: 'multiple', options: optionsFor(selected), correctIds,
    explanation: `${criterion.explanation} Dans cette question, les réponses correspondantes sont : ${selected.filter(criterion.check).map((figure) => figure.name).join(', ')}.`,
    progressiveHints: ['Lis le critère jusqu’au bout.', 'Vérifie chaque proposition séparément : plusieurs réponses sont attendues.'],
    initialHintCount: 1, criterionId: criterion.id, criterionLabel: criterion.label
  };
}

/** Point d'entrée unique du moteur : valide le niveau, le mode et le résultat. */
export function generateQuestion(level: Level, requestedMode: Mode, random: () => number = Math.random): Question {
  const pool = getFiguresForLevel(level);
  if (pool.length < 4) throw new Error(`La banque de figures du niveau ${level} est trop petite (minimum : 4).`);
  const chosenMode: PlayMode = requestedMode === 'Mixte'
    ? choose<PlayMode>(['A', 'B', 'C', 'D'], random)
    : requestedMode;

  // Un mode est retenté si sa génération produit une question invalide.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    let question: Question;
    switch (chosenMode) {
      case 'A': question = buildModeA(pool, random); break;
      case 'B': question = buildModeB(pool, random); break;
      case 'C': question = buildModeC(pool, random); break;
      case 'D': question = buildModeD(pool, random); break;
    }
    if (validateQuestion(question)) return question;
  }

  // Ce repli ne révèle jamais le nom de la réponse dans la consigne.
  const fallback = buildModeC(pool, random);
  if (validateQuestion(fallback)) return fallback;
  throw new Error(`Le moteur n'a pas réussi à créer une question valide pour ${level} / ${chosenMode}.`);
}
