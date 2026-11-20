import { GEOMETRY_FIGURES, getFiguresForLevel } from './figures';
import type { GeometryFigure, Level } from './types';

export type GridPoint = { x: number; y: number };
export type GridEdge = readonly [number, number];
export type ConstructionTask = {
  figureId: string;
  title: string;
  kind: GeometryFigure['kind'] | 'circle';
  points: readonly GridPoint[];
  edges: readonly GridEdge[];
  instruction: string;
  clue: string;
  explanation: string;
};

export const GRID_COLUMNS = 6;
export const GRID_ROWS = 6;
const P = (x: number, y: number): GridPoint => ({ x, y });
const E = (count: number): GridEdge[] => Array.from({ length: count }, (_, index) => [index, (index + 1) % count]);
const polygon = (figureId: string, points: GridPoint[], clue: string, explanation: string): ConstructionTask => ({
  figureId, title: `Reproduis cette figure : ${GEOMETRY_FIGURES.find((figure) => figure.id === figureId)?.name ?? figureId}`,
  kind: 'plane', points, edges: E(points.length),
  instruction: 'Observe le modèle à gauche. Le sommet A est déjà placé sur la grille. Touche les cases des autres sommets pour reproduire ce croquis.',
  clue, explanation
});
const solid = (figureId: string, points: GridPoint[], edges: GridEdge[], clue: string): ConstructionTask => ({
  figureId, title: `Trace cette vue : ${GEOMETRY_FIGURES.find((figure) => figure.id === figureId)?.name ?? figureId}`,
  kind: 'solid', points, edges,
  instruction: 'Observe la vue modèle. Place les sommets manquants, puis trace chaque arête dessinée en touchant ses deux extrémités.',
  clue, explanation: 'La vue est reconstituée : les sommets et les arêtes correspondent au modèle.'
});

const TASKS: Record<string, ConstructionTask> = {
  tri_scalene: polygon('tri_scalene', [P(0, 1), P(5, 2), P(1, 5)], 'Cherche les trois coins du triangle.', 'Ce croquis montre un triangle sans angle droit et avec trois côtés de longueurs différentes.'),
  tri_rectangle: polygon('tri_rectangle', [P(0, 0), P(4, 0), P(0, 3)], 'Les deux côtés issus de A suivent une ligne et une colonne.', 'Les côtés issus de A forment un angle droit.'),
  carre: polygon('carre', [P(1, 1), P(4, 1), P(4, 4), P(1, 4)], 'Les côtés parcourent chacun trois intervalles de grille.', 'Les quatre côtés sont égaux et les quatre angles sont droits.'),
  rectangle: polygon('rectangle', [P(0, 1), P(5, 1), P(5, 4), P(0, 4)], 'Compte cinq intervalles horizontalement et trois verticalement.', 'Les côtés opposés sont de même longueur et les quatre angles sont droits.'),
  cercle: {
    figureId: 'cercle', title: 'Trace un cercle', kind: 'circle', points: [P(2, 2), P(4, 2)], edges: [],
    instruction: 'Le centre A est déjà placé. Observe le modèle et choisis le point B à droite du centre : il fixe le rayon du cercle.',
    clue: 'Le point B est sur la même ligne que A, deux cases à droite.',
    explanation: 'Le cercle est tracé autour du centre A avec un rayon de deux intervalles.'
  },
  tri_isocele: polygon('tri_isocele', [P(2, 0), P(0, 4), P(4, 4)], 'Le sommet du haut est au milieu de la base.', 'Les deux côtés inclinés ont la même longueur dans ce croquis.'),
  tri_equilateral: polygon('tri_equilateral', [P(2, 0), P(0, 3), P(4, 3)], 'Le sommet du haut est au milieu de la base.', 'Le modèle est un croquis de triangle équilatéral ; la grille carrée ne permet pas de vérifier exactement ses trois longueurs.'),
  tri_isocele_rectangle: polygon('tri_isocele_rectangle', [P(0, 0), P(4, 0), P(0, 4)], 'Les deux côtés issus de A suivent une ligne et une colonne sur la même distance.', 'Les deux côtés issus de l’angle droit sont égaux.'),
  losange: polygon('losange', [P(2, 0), P(4, 2), P(2, 4), P(0, 2)], 'Les sommets haut, droite, bas et gauche sont symétriques.', 'Les quatre côtés du losange sont égaux.'),
  parallelogramme: polygon('parallelogramme', [P(1, 1), P(4, 1), P(5, 4), P(2, 4)], 'Les côtés du haut et du bas sont parallèles.', 'Les deux paires de côtés opposés sont parallèles.'),
  trapeze_quelconque: polygon('trapeze_quelconque', [P(1, 1), P(3, 1), P(5, 4), P(0, 4)], 'Le haut et le bas sont horizontaux ; les côtés obliques sont différents.', 'Une seule paire de côtés opposés est parallèle dans ce croquis.'),
  cerf_volant: polygon('cerf_volant', [P(2, 0), P(4, 2), P(2, 5), P(0, 2)], 'Le sommet du haut et celui du bas sont sur la même colonne.', 'Les côtés voisins sont égaux deux à deux.'),
  fer_de_lance: polygon('fer_de_lance', [P(2, 0), P(4, 5), P(2, 3), P(0, 5)], 'Un sommet rentre à l’intérieur de la figure.', 'Cette figure est concave : un angle est rentrant.'),
  trapeze_rectangle: polygon('trapeze_rectangle', [P(0, 1), P(3, 1), P(5, 4), P(0, 4)], 'Le côté gauche est vertical et les bases sont horizontales.', 'Le côté gauche forme deux angles droits.'),
  trapeze_isocele: polygon('trapeze_isocele', [P(1, 1), P(4, 1), P(5, 4), P(0, 4)], 'Les deux côtés obliques sont symétriques.', 'Les côtés non parallèles ont la même longueur.'),
  cube: solid('cube', [P(1, 2), P(4, 2), P(4, 5), P(1, 5), P(2, 1), P(5, 1), P(5, 4), P(2, 4)], [[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,1],[5,6],[6,2]], 'Observe la face avant, la face du haut et la face droite.'),
  pave_droit: solid('pave_droit', [P(0, 2), P(4, 2), P(4, 4), P(0, 4), P(1, 1), P(5, 1), P(5, 3), P(1, 3)], [[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,1],[5,6],[6,2]], 'La face avant est plus large que haute.'),
  pyramide_carree: solid('pyramide_carree', [P(2, 0), P(0, 4), P(2, 3), P(5, 4), P(3, 5)], [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1]], 'Cherche le sommet du haut et les quatre coins de la base.'),
  tetraedre: solid('tetraedre', [P(2, 0), P(0, 4), P(4, 4), P(2, 5)], [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]], 'Cette vue possède quatre sommets et six arêtes.'),
};

export function constructionTask(figureId: string): ConstructionTask {
  const task = TASKS[figureId];
  if (!task) throw new Error(`Figure sans atelier de construction : ${figureId}`);
  return task;
}

export function constructionTasksForLevel(level: Level): ConstructionTask[] {
  return getFiguresForLevel(level).map((figure) => constructionTask(figure.id));
}

export function sameGridPoint(a: GridPoint, b: GridPoint): boolean { return a.x === b.x && a.y === b.y; }
export function gridEdgeKey(a: number, b: number): string { return `${Math.min(a,b)}-${Math.max(a,b)}`; }

export function evaluateConstruction(task: ConstructionTask, selected: readonly GridPoint[]): { correct: boolean; correctPoints: number } {
  const expected = task.points.slice(1);
  if (selected.length !== expected.length || new Set(selected.map((point) => `${point.x},${point.y}`)).size !== expected.length) return { correct: false, correctPoints: 0 };
  if (!selected.every((point) => Number.isInteger(point.x) && Number.isInteger(point.y) && point.x >= 0 && point.x < GRID_COLUMNS && point.y >= 0 && point.y < GRID_ROWS && !sameGridPoint(point, task.points[0]))) return { correct: false, correctPoints: 0 };
  const correctPoints = selected.filter((point) => expected.some((answer) => sameGridPoint(point, answer))).length;
  return { correct: correctPoints === expected.length, correctPoints };
}

export function evaluateEdges(task: ConstructionTask, selected: readonly string[]): { correct: boolean; correctEdges: number } {
  const expected = new Set(task.edges.map(([a,b]) => gridEdgeKey(a,b)));
  const actual = new Set(selected);
  const valid = selected.length === actual.size && selected.every((key) => /^\d+-\d+$/.test(key));
  const correctEdges = selected.filter((key) => expected.has(key)).length;
  return { correct: valid && selected.length === expected.size && correctEdges === expected.size, correctEdges };
}

export function dailyConstructionTask(level: Level, date = new Date()): ConstructionTask {
  const tasks = constructionTasksForLevel(level);
  const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const hash = [...key].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619), 2166136261);
  return tasks[(hash >>> 0) % tasks.length];
}

export const CONSTRUCTION_TASK_COUNT = GEOMETRY_FIGURES.length;
