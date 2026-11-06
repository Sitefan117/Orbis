import assert from 'node:assert/strict';
import { CATEGORY_LABELS, GRAMMAR_LEVELS } from '../src/lib/games/grammaire-lab/curriculum';
import {
  completeLevel,
  createInitialProgress,
  isAutonomousSuccess,
  levelMastered,
  matchesRepair,
  pickChallenges,
  sameSelection,
  sanitizeProgress,
  starsForLevel,
  transformedSentence,
  validNextBlocks,
  validateCurriculum
} from '../src/lib/games/grammaire-lab/engine';

assert.equal(GRAMMAR_LEVELS.length, 14, 'Le parcours doit contenir 14 niveaux.');
assert.deepEqual(GRAMMAR_LEVELS.map((level) => level.id), Array.from({ length: 14 }, (_, index) => index + 1));
assert.ok(GRAMMAR_LEVELS.every((level) => level.challenges.length >= 11), 'Chaque niveau doit proposer une banque variée.');
assert.ok(GRAMMAR_LEVELS.every((level) => level.prerequisite && level.theory && level.notions.length > 0));
assert.ok(GRAMMAR_LEVELS.every((level) => new Set(level.challenges.map((challenge) => challenge.prompt)).size === level.challenges.length), 'Les consignes ne doivent pas se répéter dans un niveau.');
assert.ok(GRAMMAR_LEVELS.every((level) => new Set(level.challenges.map((challenge) => challenge.task ?? challenge.kind)).size >= 2), 'Chaque niveau doit varier les types de question.');
assert.ok(GRAMMAR_LEVELS.every((level) => level.challenges.some((challenge) => challenge.solution.length > 1)), 'Chaque niveau doit proposer au moins une question à réponses multiples ou à blocs ordonnés.');

const challenges = GRAMMAR_LEVELS.flatMap((level) => level.challenges);
assert.equal(challenges.length, 171);
for (const levelId of [1, 2, 4]) {
  const kinds = new Set(GRAMMAR_LEVELS[levelId - 1].challenges.map((challenge) => challenge.kind));
  assert.ok(kinds.has('highlight') && kinds.has('repair'), `niveau ${levelId}: surlignage et réparation`);
}
assert.ok(GRAMMAR_LEVELS[3].challenges.some((challenge) => challenge.kind === 'move'));
for (const challenge of challenges) {
  for (const block of challenge.blocks) {
    if ((block.category === 'place' || block.category === 'time' || block.category === 'manner') && block.group) {
      assert.notEqual(block.group, 'gv', `${challenge.id}: une indication de phrase ne doit pas être soudée au GV`);
    }
  }
}
assert.equal(CATEGORY_LABELS.complement, 'COMPLÉMENT DE VERBE (CV)');
assert.equal(CATEGORY_LABELS.place, 'INDICATION DE LIEU');
assert.ok(GRAMMAR_LEVELS[13].notions.includes('complément de verbe indirect (CVI)'));
const directComplement = challenges.find((challenge) => challenge.id === 'p14-i')!;
const indirectComplement = challenges.find((challenge) => challenge.id === 'p14-j')!;
assert.match(directComplement.blocks[2].label ?? '', /DIRECT \(CVD\)/);
assert.match(indirectComplement.blocks[2].label ?? '', /INDIRECT \(CVI\)/);
assert.deepEqual(validateCurriculum(challenges), []);
for (const challenge of challenges) {
  assert.equal(sameSelection(challenge, challenge.solution), true, `${challenge.id}: la solution doit être reconnue.`);
  if (challenge.solution.length > 1) {
    const reversed = [...challenge.solution].reverse();
    assert.equal(sameSelection(challenge, reversed), challenge.kind !== 'order', `${challenge.id}: l’ordre doit compter seulement pour la construction.`);
  }
}
const finalLevel = GRAMMAR_LEVELS[13];
for (let seed = 0; seed < 100; seed++) {
  let state = seed + 1;
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  const first = pickChallenges(finalLevel, 6, [], random);
  const second = pickChallenges(finalLevel, 4, first.map((challenge) => challenge.id), random);
  for (const series of [first, second]) {
    for (const family of finalLevel.requiredErrorFamilies ?? []) {
      assert.ok(series.some((challenge) => challenge.errorFamily === family), `série ${seed}: ${family} absent`);
    }
  }
  assert.ok(second.every((challenge) => !first.some((previous) => previous.id === challenge.id)));
}
assert.equal(matchesRepair(challenges.find((challenge) => challenge.id === 'i4-b')!, '  ABOIENT  '), true);
assert.equal(matchesRepair(challenges.find((challenge) => challenge.id === 'i4-b')!, 'aboie'), false);
const moveToFront = challenges.find((challenge) => challenge.id === 'i9-b')!;
assert.equal(transformedSentence(moveToFront, moveToFront.solution[0]), 'Le soir, Nora lit un livre.');
assert.equal(transformedSentence(moveToFront, ''), moveToFront.context);
assert.equal(isAutonomousSuccess(1, false), true);
assert.equal(isAutonomousSuccess(1, true), false);
assert.equal(isAutonomousSuccess(2, false), false);

for (const level of GRAMMAR_LEVELS) {
  const first = pickChallenges(level, 6, [], () => 0.37);
  assert.equal(first.length, 6, `niveau ${level.id}: six défis dans une série`);
  assert.equal(new Set(first.map((challenge) => challenge.id)).size, 6, `niveau ${level.id}: aucun doublon`);
  const second = pickChallenges(level, 4, first.map((challenge) => challenge.id), () => 0.63);
  assert.ok(second.every((challenge) => !first.some((previous) => previous.id === challenge.id)), `niveau ${level.id}: consolidation nouvelle`);
  for (const challenge of first) assert.equal(sameSelection(challenge, challenge.solution), true, `${challenge.id}: la réponse reste correcte après mélange des blocs`);
}

const alternative = challenges.find((challenge) => challenge.id === 'l14-a')!;
assert.equal(sameSelection(alternative, alternative.acceptedSolutions![0]), true, 'Un complément mobile doit être accepté.');
assert.ok(validNextBlocks(alternative, alternative.solution.slice(0, 2)).length >= 2, 'Tetris doit accepter plusieurs suites valables.');
const negation = challenges.find((challenge) => challenge.id === 'l14-c')!;
assert.equal(negation.acceptedSolutions?.length ?? 0, 0, 'La variante peu naturelle avec « jamais » après le complément est retirée.');
const multiple = challenges.find((challenge) => challenge.id === 'l2-a')!;
assert.equal(sameSelection(multiple, [multiple.solution[0], multiple.solution[0]]), false, 'Une réponse répétée ne vaut pas deux réponses.');
assert.equal(levelMastered(0, 6), false);
assert.equal(levelMastered(4, 6), false);
assert.equal(levelMastered(5, 6), true);
const testedUpperLevel = completeLevel(createInitialProgress(), 14, 3, 6, 0);
assert.equal(testedUpperLevel.unlockedLevel, 1, 'Tester un niveau supérieur ne saute pas le parcours commun.');
assert.deepEqual(testedUpperLevel.completedLevels, [14]);

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
assert.equal(repaired.unlockedLevel, 2);
assert.deepEqual(repaired.completedLevels, [1, 4]);
assert.deepEqual(repaired.starsByLevel, { 1: 3, 4: 2 });
assert.equal(repaired.totalCorrect, 0);
assert.equal(repaired.totalErrors, 7);

console.log(`Grammaire Lab : ${GRAMMAR_LEVELS.length} niveaux et ${challenges.length} défis validés.`);
