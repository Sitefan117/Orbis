import type { Level } from './types';

export type GridPoint = { x: number; y: number };
export type ConstructionTask = {
  id: string;
  title: string;
  instruction: string;
  explanation: string;
  clue: string;
  anchor: GridPoint;
  answer: readonly GridPoint[];
};

export const GRID_COLUMNS = 5;
export const GRID_ROWS = 4;

const TASKS: Record<Level, ConstructionTask> = {
  '6H': {
    id: 'rectangle-3x2', title: 'Construis un rectangle',
    instruction: 'Le sommet A est déjà placé. Un côté avance de 3 cases vers la droite depuis A. L’autre descend de 2 cases depuis A. Choisis les trois autres coins du rectangle.',
    clue: 'Cherche le coin en haut à droite, celui en bas à gauche et celui en bas à droite.',
    explanation: 'Les côtés horizontaux mesurent 3 intervalles, les côtés verticaux 2. Les quatre angles sont droits.',
    anchor: { x: 0, y: 0 }, answer: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 0, y: 2 }]
  },
  '7H': {
    id: 'square-2x2', title: 'Construis un carré',
    instruction: 'Le sommet A est déjà placé. Un côté avance de 2 cases vers la droite depuis A. L’autre descend de 2 cases depuis A. Choisis les trois autres coins du carré.',
    clue: 'Les deux côtés issus de A ont la même longueur et forment un angle droit.',
    explanation: 'Les quatre côtés mesurent 2 intervalles et les quatre angles sont droits.',
    anchor: { x: 0, y: 0 }, answer: [{ x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }]
  },
  '8H': {
    id: 'parallelogram-3-1x2', title: 'Construis un parallélogramme',
    instruction: 'Le sommet A est déjà placé. Un côté avance de 3 cases à droite depuis A. L’autre avance de 1 case à droite puis descend de 2 cases. Choisis les trois autres coins du parallélogramme.',
    clue: 'Reporte le même déplacement de 1 case à droite et 2 vers le bas depuis le sommet du haut à droite.',
    explanation: 'Les côtés opposés ont le même déplacement : 3 cases à droite, puis 1 case à droite et 2 vers le bas.',
    anchor: { x: 0, y: 0 }, answer: [{ x: 3, y: 0 }, { x: 4, y: 2 }, { x: 1, y: 2 }]
  }
};

export function constructionTask(level: Level): ConstructionTask {
  return TASKS[level];
}

export function sameGridPoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

export function evaluateConstruction(task: ConstructionTask, selected: readonly GridPoint[]): { correct: boolean; correctPoints: number } {
  if (selected.length !== 3 || new Set(selected.map((point) => `${point.x},${point.y}`)).size !== 3) {
    return { correct: false, correctPoints: 0 };
  }
  const valid = selected.every((point) => Number.isInteger(point.x) && Number.isInteger(point.y)
    && point.x >= 0 && point.x < GRID_COLUMNS && point.y >= 0 && point.y < GRID_ROWS
    && !sameGridPoint(point, task.anchor));
  if (!valid) return { correct: false, correctPoints: 0 };
  const correctPoints = selected.filter((point) => task.answer.some((answer) => sameGridPoint(point, answer))).length;
  return { correct: correctPoints === 3, correctPoints };
}
