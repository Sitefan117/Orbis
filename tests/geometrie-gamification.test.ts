import assert from 'node:assert/strict';
import { GEOMETRY_MISSIONS, badgesForMission, challengeUnlocked, dailyMission, dailyQuestionRandom, masteryPercent, updateMastery } from '../src/lib/games/geometrie/gamification';
import { generateFocusedQuestion, generateQuestion, validateQuestion } from '../src/lib/games/geometrie/question-engine';

const mission = GEOMETRY_MISSIONS[0];
const first = updateMastery({}, mission.id, 7, 10, 6, new Date('2026-11-16T10:00:00Z'));
const second = updateMastery(first, mission.id, 9, 10, 8, new Date('2026-11-17T10:00:00Z'));
assert.equal(masteryPercent(first[mission.id]), 70);
assert.equal(masteryPercent(second[mission.id]), 90);
assert.equal(second[mission.id]?.attempts, 2);
assert.equal(second[mission.id]?.bestScore, 9);
assert.equal(challengeUnlocked(first[mission.id]), true);
assert.equal(challengeUnlocked(updateMastery({}, mission.id, 3, 5, 3)[mission.id]), false);

const badges = badgesForMission([], mission.id, 10, 10, 8, true, new Date('2026-11-16T10:00:00Z'));
assert(badges.some((badge) => badge.id === 'geometry-ace'));
assert(badges.some((badge) => badge.id === 'persistence'));
assert(badges.some((badge) => badge.id === 'mission-proprietes'));
assert.equal(dailyMission(new Date('2026-11-16T12:00:00Z')).key, '2026-11-16');
for (let index = 1; index <= 5; index += 1) {
  const today = dailyMission(new Date('2026-11-16T12:00:00Z'));
  const makeQuestion = () => today.mission.id === 'triangles' || today.mission.id === 'solides'
    ? generateFocusedQuestion(today.level, today.mission.id, dailyQuestionRandom(today.key, index))
    : generateQuestion(today.level, today.mission.mode, dailyQuestionRandom(today.key, index));
  assert.deepEqual(makeQuestion(), makeQuestion());
}
for (const level of ['6H', '7H', '8H'] as const) {
  for (const focus of ['triangles', 'solides'] as const) {
    for (let index = 0; index < 100; index += 1) {
      const question = generateFocusedQuestion(level, focus);
      assert(validateQuestion(question));
      assert(question.focusFigure);
      assert.equal(focus === 'triangles' ? question.focusFigure.isTriangle : question.focusFigure.kind === 'solid', true);
    }
  }
}
console.log('Nexus gamification: maîtrise, badges et défi quotidien validés.');
