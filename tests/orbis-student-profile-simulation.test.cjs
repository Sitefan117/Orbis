/* Simulation pédagogique : 10 élèves, 13 activités, résultats aléatoires bornés. */
const assert = require('node:assert/strict');

let seed = 20261113;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

const bands = [
  { label: 'très bon', min: 0.80, max: 0.90 },
  { label: 'très mauvais', min: 0.10, max: 0.20 },
  { label: 'bon', min: 0.60, max: 0.80 },
  { label: 'mauvais', min: 0.20, max: 0.40 },
  { label: 'moyen', min: 0.40, max: 0.60 }
];
const students = bands.flatMap((band, bandIndex) => [0, 1].map((copy) => ({
  id: `simulation-${bandIndex}-${copy}`,
  name: `${band.label}-${copy + 1}`,
  band
})));
const games = [
  'race', 'livrets', 'geometrie', 'calculs', 'numeria', 'pcp', 'mesurovia',
  'conju_lab', 'grammaire_lab', 'musee_vocabulaire', 'shift', 'fractionstower2', 'mathhunt'
];

const events = [];
const saves = new Map();
for (const student of students) {
  for (const game of games) {
    const total = 20;
    const minCorrect = Math.ceil(total * student.band.min);
    const maxCorrect = Math.floor(total * student.band.max);
    const correct = minCorrect + Math.floor(random() * (maxCorrect - minCorrect + 1));
    const outcomes = Array.from({ length: total }, (_, index) => index < correct)
      .sort(() => random() - 0.5);
    const responseDetails = outcomes.map((isCorrect, index) => ({
      questionIndex: index,
      prompt: `${game} question ${index + 1}`,
      response: isCorrect ? 'réponse attendue' : 'réponse à revoir',
      expected: 'réponse attendue',
      correct: isCorrect,
      attempts: isCorrect ? 1 : 2,
      errorFamily: isCorrect ? undefined : 'simulation-erreur'
    }));
    events.push({ studentId: student.id, studentName: student.name, game, correct, total, responseDetails });
    saves.set(`${student.id}:${game}`, { studentId: student.id, game, state: { question: correct + 1 } });
  }
}

assert.equal(events.length, 10 * games.length);
assert.equal(saves.size, events.length);
for (const student of students) {
  const ownEvents = events.filter((event) => event.studentId === student.id);
  assert.equal(ownEvents.length, games.length);
  for (const event of ownEvents) {
    const accuracy = event.correct / event.total;
    assert.ok(accuracy >= student.band.min && accuracy <= student.band.max,
      `${student.name}/${event.game}: ${accuracy} hors de ${student.band.min}-${student.band.max}`);
    assert.equal(event.responseDetails.length, event.total);
    assert.equal(event.responseDetails.filter((detail) => detail.correct).length, event.correct);
    assert.equal(saves.get(`${student.id}:${event.game}`).studentId, student.id);
  }
}

console.log(`Orbis simulation : ${students.length} élèves × ${games.length} jeux = ${events.length} résultats, 5 profils de réussite, sauvegardes isolées et détails valides.`);
