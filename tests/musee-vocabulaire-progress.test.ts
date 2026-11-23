import assert from 'node:assert/strict';
import {
  gradeEncounter, masterySummary, normalizeWordProgress, prioritizeAdaptive, reviewableWordIds,
  updateWordProgress, type WordEncounter, type WordProgress
} from '../src/lib/games/musee-vocabulaire/progress';

const encounter = (overrides: Partial<WordEncounter> = {}): WordEncounter => ({
  correct: true,
  errors: 0,
  hints: 0,
  mode: 'letters',
  sessionId: 'session-a',
  strength: 'recall',
  ...overrides
});

assert.equal(gradeEncounter(encounter()), 'good');
assert.equal(gradeEncounter(encounter({ errors: 1 })), 'hard');
assert.equal(gradeEncounter(encounter({ correct: false })), 'again');
assert.equal(gradeEncounter(encounter({ easy: true })), 'easy');

const day1 = new Date('2026-01-01T10:00:00Z');
const day2 = new Date('2026-01-02T10:00:00Z');
const day3 = new Date('2026-01-03T10:00:00Z');
let spaced: WordProgress | undefined;
spaced = updateWordProgress(spaced, encounter(), day1);
spaced = updateWordProgress(spaced, encounter({ sessionId: 'session-b', strength: 'recognition' }), day2);
spaced = updateWordProgress(spaced, encounter({ sessionId: 'session-c' }), day3);
assert.equal(spaced.status, 'solide', 'trois rappels réussis sur plusieurs séances et 48 h rendent le mot solide');

let massed: WordProgress | undefined;
massed = updateWordProgress(massed, encounter(), day1);
massed = updateWordProgress(massed, encounter(), new Date(day1.getTime() + 60_000));
massed = updateWordProgress(massed, encounter(), new Date(day1.getTime() + 120_000));
assert.equal(massed.status, 'a-consolider', 'trois répétitions immédiates ne prouvent pas la mémorisation');

let unknown: WordProgress | undefined;
for (let index = 0; index < 3; index++) {
  unknown = updateWordProgress(unknown, encounter({ correct: false }), new Date(day1.getTime() + index * 60_000));
}
assert.equal(unknown!.status, 'pas-encore');
assert.equal(unknown!.lapses, 3);
assert.equal(unknown!.errors, 3);

let fragile: WordProgress | undefined;
fragile = updateWordProgress(fragile, encounter(), day1);
fragile = updateWordProgress(fragile, encounter({ correct: false }), day2);
fragile = updateWordProgress(fragile, encounter({ correct: false }), day3);
assert.equal(fragile.status, 'fragile');

let consolidating: WordProgress | undefined;
consolidating = updateWordProgress(consolidating, encounter(), day1);
consolidating = updateWordProgress(consolidating, encounter({ correct: false }), day2);
consolidating = updateWordProgress(consolidating, encounter({ sessionId: 'session-c' }), day3);
assert.equal(consolidating.status, 'a-consolider');

const migrated = normalizeWordProgress({ status: 'acquis', attempts: 3, correct: 3, errors: 0, hints: 0 });
assert.equal(migrated.status, 'solide');
const retained = updateWordProgress(migrated, encounter(), day1);
assert.equal(retained.status, 'solide', 'une ancienne maîtrise acquise ne redevient pas nouvelle après une réussite');
const legacyEvidence = normalizeWordProgress({
  status: 'fragile',
  evidence: [{ result: 1, grade: 'good', at: day1.toISOString(), sessionId: 'old', mode: 'letters', strength: 'recall' }] as never
});
assert.deepEqual(legacyEvidence.evidence, [[1, day1.toISOString(), 'old', 'recall']]);

assert.deepEqual(reviewableWordIds({ weak: unknown! }, new Date('2026-01-04T10:00:00Z')), ['weak']);
const ordered = prioritizeAdaptive(
  [{ id: 'solid' }, { id: 'weak' }, { id: 'new' }],
  { solid: spaced!, weak: unknown! },
  [],
  new Date('2026-01-04T10:00:00Z'),
  () => 0
);
assert.equal(ordered[0].id, 'weak');
assert.deepEqual(masterySummary({ solid: spaced!, weak: unknown!, fragile: fragile! }, new Date('2026-01-04T10:00:00Z')), {
  total: 3, new: 0, unknown: 1, fragile: 1, consolidating: 0, due: 2, acquired: 1
});

const fullSave = {
  formatVersion: 2,
  vocabularyProgress: Object.fromEntries(Array.from({ length: 950 }, (_, index) => [`word-${index}`, spaced]))
};
assert.ok(Buffer.byteLength(JSON.stringify(fullSave)) < 500_000, 'la sauvegarde complète reste sous la limite Supabase de 500 Ko');

console.log('Progression adaptative : preuves espacées, erreurs, migration, échéances et priorité validées.');
