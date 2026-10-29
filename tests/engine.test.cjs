// Tests des fonctions mathématiques et d'adaptation, sans navigateur ni dépendances.
const assert = require('node:assert/strict');
require('../src/lib/games/mesurovia/engine-legacy.js');
const E = global.MesuEngine;

assert.equal(E.convert(2, 'length', 'm', 'cm'), 200, '2 m = 200 cm');
assert.equal(E.convert(350, 'mass', 'g', 'kg'), 0.35, '350 g = 0,35 kg');
assert.equal(E.convert(1.5, 'capacity', 'L', 'mL'), 1500, '1,5 L = 1500 mL');
assert.equal(E.convert(2.5, 'duration', 'h', 'min'), 150, '2,5 h = 150 min');
assert.equal(E.convert(1, 'area', 'm²', 'dm²'), 100, '1 m² = 100 dm²');
assert.equal(E.convert(1, 'volume', 'm³', 'dm³'), 1000, '1 m³ = 1000 dm³');

assert.equal(E.checkAnswer({type:'number',answer:200}, '200'), true);
assert.equal(E.checkAnswer({type:'number',answer:0.35}, '0,35'), true, 'virgule décimale acceptée');
assert.equal(E.checkAnswer({type:'choice',answer:'200 cm'}, '200 cm'), true);
assert.equal(E.checkAnswer({type:'choice',answer:'200 cm'}, '20 cm'), false);

let a = E.createAdaptiveState();
assert.equal(E.createAdaptiveState(3).difficulty, 3, 'un profil peut commencer à un niveau adapté');
a = E.updateAdaptive(a, true, false);
a = E.updateAdaptive(a, true, false);
a = E.updateAdaptive(a, true, false);
assert.equal(a.difficulty, 2, 'trois réussites autonomes augmentent la difficulté');
a = E.updateAdaptive(a, true, false);
assert.equal(a.lastChange, undefined, 'le changement de difficulté ne doit pas rester actif après son événement');
a = E.updateAdaptive(a, false, false);
a = E.updateAdaptive(a, false, false);
assert.equal(a.difficulty, 1, 'deux erreurs consécutives abaissent la difficulté');
a = E.updateAdaptive(a, true, true);
assert.equal(a.correctStreak, 0, 'une réussite guidée ne gonfle pas la série autonome');

for (const v of E.VILLAGES) {
  assert.equal(v.stage, undefined, 'le degré scolaire ne doit pas se glisser dans les données affichables du jeu');
  const houses = E.listHouses(v.id);
  assert.equal(houses.length, 4, `${v.id} doit avoir quatre maisons`);
  for (const h of houses) {
    assert.ok(h.title && h.families.length, `maison complète: ${h.id}`);
    for (const family of h.families) assert.ok(E.FAMILIES[family], `${family} est une famille reconnue`);
  }
}
for (const family of Object.keys(E.FAMILIES)) {
  for (let i = 0; i < 50; i++) {
    const q = E.makeQuestion(family, 1 + (i % 4));
    assert.ok(q.prompt && q.answer !== undefined, `question valide ${family}`);
    if (q.type === 'choice') assert.ok(q.options.includes(String(q.answer)) || q.options.some(x => E.normalizeAnswer(x) === E.normalizeAnswer(q.answer)), `la bonne option est présente pour ${family}: ${JSON.stringify(q)}`);
  }
}

assert.equal(E.startingDifficulty('fondations-mesure','length'), 1);
assert.equal(E.startingDifficulty('royaume-conversions','length'), 2);
assert.equal(E.startingDifficulty('aires-perimetres','length'), 2);
assert.equal(E.startingDifficulty('volumes-capacites','length'), 3);
assert.equal(E.startingDifficulty('missions-maitrise','length'), 4);
assert.equal(E.startingDifficulty('volumes-capacites','length',{byFamily:{length:{correct:0,total:2}}}), 2, 'un besoin en longueur baisse le départ de cette compétence');
assert.equal(E.startingDifficulty('volumes-capacites','mass',{byFamily:{mass:{correct:2,total:2}}}), 4, 'une compétence maîtrisée peut commencer plus haut');

const rec = E.pretestRecommendation({total:12,correct:10,byFamily:{length:{correct:2,total:2},mass:{correct:2,total:2}}});
assert.ok(E.VILLAGES.some(v => v.id === rec.villageId), 'le prétest recommande une région existante');
console.log('Mesurovia engine tests: OK — conversions, réponses, adaptation, cinq villages, 20 maisons, générateur de questions et recommandation.');
