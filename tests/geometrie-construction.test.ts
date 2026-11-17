import assert from 'node:assert/strict';
import { GEOMETRY_FIGURES, getFiguresForLevel } from '../src/lib/games/geometrie/figures';
import { constructionTask, constructionTasksForLevel, dailyConstructionTask, evaluateConstruction, evaluateEdges, GRID_COLUMNS, GRID_ROWS, gridEdgeKey, type GridPoint } from '../src/lib/games/geometrie/construction';
import { awardConstruction, EMPTY_CONSTRUCTION_PROGRESS } from '../src/lib/games/geometrie/construction-progress';

const allIds = GEOMETRY_FIGURES.map((figure) => figure.id);
for (const level of ['6H', '7H', '8H'] as const) {
  assert.deepEqual(constructionTasksForLevel(level).map((task) => task.figureId), getFiguresForLevel(level).map((figure) => figure.id));
  assert.equal(dailyConstructionTask(level, new Date('2026-11-17T12:00:00Z')).figureId, dailyConstructionTask(level, new Date('2026-11-17T18:00:00Z')).figureId);
}

for (const figure of GEOMETRY_FIGURES) {
  const task = constructionTask(figure.id);
  assert.equal(task.kind === 'solid', figure.kind === 'solid');
  assert(task.points.length >= 2);
  assert(task.points.every((point) => Number.isInteger(point.x) && Number.isInteger(point.y) && point.x >= 0 && point.x < GRID_COLUMNS && point.y >= 0 && point.y < GRID_ROWS));
  assert.equal(new Set(task.points.map((point) => `${point.x},${point.y}`)).size, task.points.length);
  const answer = task.points.slice(1);
  assert.equal(evaluateConstruction(task, answer).correct, true, `${figure.id}: modèle refusé`);
  assert.equal(evaluateConstruction(task, [...answer].reverse()).correct, true, `${figure.id}: ordre imposé`);
  assert.equal(evaluateConstruction(task, answer.slice(1)).correct, false);
  assert.equal(evaluateConstruction(task, [task.points[0], ...answer.slice(1)]).correct, false);
  assert.equal(evaluateConstruction(task, [answer[0], answer[0], ...answer.slice(2)]).correct, false);
  const wrongPoint: GridPoint = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({ x: index % GRID_COLUMNS, y: Math.floor(index / GRID_COLUMNS) })).find((point) => !task.points.some((target) => target.x === point.x && target.y === point.y))!;
  assert.equal(evaluateConstruction(task, [wrongPoint, ...answer.slice(1)]).correct, false);
  if (task.kind === 'solid') {
    const edges = task.edges.map(([a,b]) => gridEdgeKey(a,b));
    assert.equal(new Set(edges).size, edges.length, `${figure.id}: arête dupliquée`);
    assert(task.edges.every(([a,b]) => a >= 0 && b >= 0 && a < task.points.length && b < task.points.length && a !== b));
    assert.equal(evaluateEdges(task, edges).correct, true);
    assert.equal(evaluateEdges(task, [...edges].reverse()).correct, true);
    assert.equal(evaluateEdges(task, edges.slice(1)).correct, false);
    assert.equal(evaluateEdges(task, [...edges.slice(1), '0-99']).correct, false);
  }
}

let progress = { ...EMPTY_CONSTRUCTION_PROGRESS };
const cleanSolid = awardConstruction(progress, 'cube', 2, 0, false);
assert(cleanSolid.badges.includes('careful-trace'));
assert(!cleanSolid.badges.includes('persistent-trace'));
for (const id of allIds) progress = awardConstruction(progress, id, 1, 0, false);
assert.equal(progress.completedIds.length, allIds.length);
assert(progress.badges.includes('all-figures'));
assert(progress.badges.includes('triangle-collection'));
assert(progress.badges.includes('solid-collection'));
const repeat = awardConstruction(progress, allIds[0], 2, 1, true, '2026-11-17');
assert.equal(repeat.completedIds.length, allIds.length);
assert.equal(repeat.xp, progress.xp + 10);
assert.equal(awardConstruction(repeat, allIds[0], 2, 1, true, '2026-11-17').xp, repeat.xp);
console.log(`Nexus construction : ${allIds.length} figures, vues de solides, correction et récompenses vérifiées.`);
