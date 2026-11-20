import assert from 'node:assert/strict';
import { summarizeNexusConstruction } from '../src/lib/orbis/teacher/nexus-construction-summary';
import type { RemoteActivityEvent } from '../src/lib/orbis/teacher/remote';
import { taxonomyFor } from '../src/lib/orbis/teacher/learning-taxonomy';

const event = (studentId: string, figureId: string, attempts: number, hints = 0): RemoteActivityEvent => ({
  event_id: `${studentId}-${figureId}-${attempts}`, game_id: 'geometrie', student_id: studentId,
  activity_id: `8H croquis ${figureId}`, skill_id: `geometrie.construction.${figureId}`,
  correct_count: 1, question_count: 1, error_count: attempts - 1, error_families: [],
  hints_used: hints, duration_seconds: 30, response_details: [], metadata: { figureId, totalChecks: attempts },
  activity_kind: 'game', session_id: null, occurred_at: '2026-11-17T10:00:00Z'
});
const rows = summarizeNexusConstruction([
  event('a', 'cube', 2, 1), event('b', 'cube', 1), event('a', 'cube', 3), event('a', 'carre', 1),
  { ...event('c', 'cube', 1), game_id: 'calculs' }, event('d', 'unknown', 1)
]);
const cube = rows.find((row) => row.figureId === 'cube');
assert(cube);
assert.equal(cube.sessions, 3);
assert.equal(cube.students, 2);
assert.equal(cube.attempts, 6);
assert.equal(cube.hints, 1);
assert.equal(rows.length, 2);
assert.equal(taxonomyFor('geometrie.construction.cube')?.label, 'Construction : Cube');
console.log('Nexus enseignant : figures, élèves distincts, essais et indices agrégés.');
