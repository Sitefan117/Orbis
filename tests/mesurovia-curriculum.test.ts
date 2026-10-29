import assert from 'node:assert/strict';
import engine from '../src/lib/games/mesurovia/engine-v3-adapter';
import { houseCurriculum, villageCurriculum } from '../src/lib/games/mesurovia/curriculum';
import { coursesByVillage, courseForHouse } from '../src/lib/games/mesurovia/courses';
import { hasHouseQuestionBank, makeHouseQuestion } from '../src/lib/games/mesurovia/question-bank';
import { normalizeProfile } from '../src/lib/games/mesurovia/progress';

const villageIds = Object.keys(villageCurriculum);
assert.equal(villageIds.length, 5);
let lessonCount = 0;
const lessonSignatures = new Set<string>();

for (const villageId of villageIds) {
  const engineHouses = engine.listHouses(villageId);
  const curriculumHouses = Object.keys(houseCurriculum[villageId]);
  assert.equal(engineHouses.length, 4, `${villageId}: quatre maisons`);
  assert.deepEqual(engineHouses.map((house) => house.id), curriculumHouses, `${villageId}: moteur et cursus alignés`);
  assert.deepEqual(Object.keys(coursesByVillage[villageId]), curriculumHouses, `${villageId}: tous les cours existent`);

  for (const house of engineHouses) {
    const entry = houseCurriculum[villageId][house.id];
    assert.ok(entry.objective && entry.code && entry.per.label, `${villageId}/${house.id}: objectif, code et PER`);
    assert.equal(entry.success.length, 3, `${villageId}/${house.id}: trois critères`);
    const lessons = courseForHouse(villageId, house.id);
    assert.equal(lessons.length, 4, `${villageId}/${house.id}: quatre diapositives`);
    for (const lesson of lessons) {
      lessonCount += 1;
      assert.ok(lesson.title && lesson.body && lesson.ask && lesson.explain);
      assert.equal(lesson.options.length, 3);
      assert.equal(new Set(lesson.options.map(engine.normalizeAnswer)).size, 3, `${villageId}/${house.id}: options distinctes`);
      assert.ok(lesson.options.some((option) => engine.normalizeAnswer(option) === engine.normalizeAnswer(lesson.answer)), `${villageId}/${house.id}: réponse proposée`);
      assert.ok(!/\bangle(s)?\b/i.test(`${lesson.title} ${lesson.body} ${lesson.ask}`), `${villageId}/${house.id}: aucun angle`);
      lessonSignatures.add(`${lesson.title}|${lesson.body}|${lesson.ask}`);
    }

    if (hasHouseQuestionBank(house.id)) {
      for (let i = 0; i < 20; i += 1) {
        const question = makeHouseQuestion(engine, house.id, i);
        assert.ok(question && question.options.includes(question.answer), `${house.id}: question ciblée valide`);
        assert.equal(engine.checkAnswer(question, question.answer), true, `${house.id}: réponse acceptée`);
      }
    }
  }
}

assert.equal(lessonCount, 80, '80 diapositives au total');
assert.equal(lessonSignatures.size, 80, 'aucune diapositive copiée mot pour mot');
assert.ok(!JSON.stringify(coursesByVillage).match(/\btonne(s)?\b/i), 'aucune tonne dans les cours');

const migrated = normalizeProfile({
  name: 'Ancien profil', lastVillage: 'clairieres-compas',
  houses: { 'clairieres-compas': { masses: { theoryDone: true, trainingDone: true, examPassed: true, bestScore: 9 } } }
}, 'Ancien profil', 'hero-1', 'fondations-mesure', villageIds);
assert.equal(migrated.lastVillage, 'royaume-conversions', 'ancien village repris');
assert.equal(migrated.houses['royaume-conversions']['table-masses'].examPassed, true, 'ancien blason repris');

for (const family of Object.keys(engine.FAMILIES)) {
  for (let i = 0; i < 400; i += 1) {
    const question = engine.makeQuestion(family, 1 + (i % 4));
    assert.ok(question.prompt && question.answer !== undefined, `${family}: question générée`);
    assert.equal(engine.checkAnswer(question, JSON.stringify(question.answer)), true, `${family}: réponse acceptée`);
    if (family === 'mass') assert.ok(!/\btonne(s)?\b|(^|\s)t(\s|$)/i.test(`${question.prompt} ${question.answerLabel ?? ''}`), 'aucune tonne générée');
  }
}

console.log('Mesurovia curriculum simulation: OK — 20 maisons, 80 diapositives uniques et 2 400 questions générées.');
