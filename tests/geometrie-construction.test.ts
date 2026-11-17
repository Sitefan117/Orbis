import assert from 'node:assert/strict';
import { constructionTask, evaluateConstruction, GRID_COLUMNS, GRID_ROWS, type GridPoint } from '../src/lib/games/geometrie/construction';

const points: GridPoint[] = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({ x: index % GRID_COLUMNS, y: Math.floor(index / GRID_COLUMNS) }));
for (const level of ['6H', '7H', '8H'] as const) {
  const task = constructionTask(level);
  assert.equal(evaluateConstruction(task, task.answer).correct, true, `${level}: bonne construction refusée`);
  assert.equal(evaluateConstruction(task, [...task.answer].reverse()).correct, true, `${level}: ordre des clics imposé`);
  assert.equal(evaluateConstruction(task, [task.answer[1], task.answer[2], task.answer[0]]).correct, true);
  assert.equal(evaluateConstruction(task, [task.answer[0], task.answer[0], task.answer[1]]).correct, false);
  assert.equal(evaluateConstruction(task, [task.answer[0], task.answer[1]]).correct, false);
  assert.equal(evaluateConstruction(task, [task.answer[0], task.answer[1], { x: -1, y: 2 }]).correct, false);
  assert.equal(evaluateConstruction(task, [task.answer[0], task.answer[1], task.anchor]).correct, false);
  let accepted = 0;
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      for (let third = second + 1; third < points.length; third += 1) {
        if (evaluateConstruction(task, [points[first], points[second], points[third]]).correct) accepted += 1;
      }
    }
  }
  assert.equal(accepted, 1, `${level}: il doit exister une seule combinaison correcte`);
}
console.log('Nexus construction : une seule réponse valide par niveau, erreurs et ordre des clics vérifiés.');
