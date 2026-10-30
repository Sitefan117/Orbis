import assert from 'node:assert/strict';
import { GRAMMAR_LEVELS } from '../src/lib/games/grammaire-lab/curriculum';
import {
  completeLevel,
  createInitialProgress,
  sameSelection,
  sanitizeProgress,
  starsForLevel,
  validateCurriculum
} from '../src/lib/games/grammaire-lab/engine';

assert.equal(GRAMMAR_LEVELS.length, 14, 'Le parcours doit contenir 14 niveaux.');
assert.deepEqual(GRAMMAR_LEVELS.map((level) => level.id), Array.from({ length: 14 }, (_, index) => index + 1));
assert.ok(GRAMMAR_LEVELS.every((level) => level.challenges.length >= 3), 'Chaque niveau doit proposer au moins trois défis.');
assert.ok(GRAMMAR_LEVELS.every((level) => level.prerequisite && level.theory && level.notions.length > 0));

const challenges = GRAMMAR_LEVELS.flatMap((level) => level.challenges);
assert.equal(challenges.length, 42);
assert.deepEqual(validateCurriculum(challenges), []);
for (const challenge of challenges) {
  assert.equal(sameSelection(challenge, challenge.solution), true, `${challenge.id}: la solution doit être reconnue.`);
  if (challenge.solution.length > 1) {
    const reversed = [...challenge.solution].reverse();
    assert.equal(sameSelection(challenge, reversed), challenge.kind === 'select', `${challenge.id}: l’ordre doit compter seulement pour la construction.`);
  }
}

assert.equal(starsForLevel(3, 3, 0), 3);
assert.equal(starsForLevel(3, 3, 1), 2);
assert.equal(starsForLevel(2, 3, 0), 1);
assert.equal(starsForLevel(1, 3, 0), 0);

let progress = createInitialProgress();
progress = completeLevel(progress, 1, 2, 3, 1);
assert.equal(progress.unlockedLevel, 2);
assert.deepEqual(progress.completedLevels, [1]);
assert.equal(progress.starsByLevel[1], 2);
progress = completeLevel(progress, 1, 1, 2, 2);
assert.equal(progress.starsByLevel[1], 2, 'Rejouer ne doit pas diminuer le meilleur résultat.');
assert.deepEqual(progress.completedLevels, [1], 'Un niveau ne doit pas être dupliqué.');

const repaired = sanitizeProgress({
  unlockedLevel: 99,
  completedLevels: [1, 1, 4, -2, '3'],
  starsByLevel: { 1: 9, 4: 2, 20: 3 },
  totalCorrect: -5,
  totalErrors: 7
});
assert.equal(repaired.unlockedLevel, 14);
assert.deepEqual(repaired.completedLevels, [1, 4]);
assert.deepEqual(repaired.starsByLevel, { 1: 3, 4: 2 });
assert.equal(repaired.totalCorrect, 0);
assert.equal(repaired.totalErrors, 7);

console.log(`Grammaire Lab : ${GRAMMAR_LEVELS.length} niveaux et ${challenges.length} défis validés.`);
