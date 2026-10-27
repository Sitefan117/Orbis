// Tests ciblés V3 : formats variés, corrections structurées, équivalences et cohérence des options.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Le test fonctionne dans l'archive complète (drop-in/) et dans le paquet de copie (src/).
const enginePath = fs.existsSync(path.join(__dirname, '../drop-in/lib/mesurovia/engine-legacy.js'))
  ? '../drop-in/lib/mesurovia/engine-legacy.js'
  : '../src/lib/games/mesurovia/engine-legacy.js';
require(enginePath);
const E = global.MesuEngine;

const families = Object.keys(E.FAMILIES);
const formats = ['choice', 'number', 'unit', 'match', 'order', 'table', 'error', 'multi'];

// Vérifie que chaque réponse générée est acceptée et qu'une réponse erronée ne passe pas.
for (const family of families) {
  for (const format of E.availableFormats(family)) {
    for (let run = 0; run < 150; run += 1) {
      const q = E.makeQuestion(family, 1 + (run % 4), { format });
      assert.ok(q.prompt && q.type && q.answer !== undefined, `${family}/${format}: structure complète`);
      assert.equal(E.checkAnswer(q, JSON.stringify(q.answer)), true, `${family}/${format}: réponse attendue reconnue`);

      if (['choice', 'unit', 'error'].includes(q.type)) {
        assert.ok(q.options.length >= 3, `${family}/${format}: au moins trois propositions`);
        assert.equal(new Set(q.options.map(E.normalizeAnswer)).size, q.options.length, `${family}/${format}: propositions distinctes`);
        assert.ok(q.options.some(option => E.normalizeAnswer(option).replace(/[^a-z0-9.²³]/g, '') === E.normalizeAnswer(q.answer).replace(/[^a-z0-9.²³]/g, '')), `${family}/${format}: la bonne réponse est proposée`);
        const wrong = q.options.find(option => E.normalizeAnswer(option) !== E.normalizeAnswer(q.answer));
        assert.equal(E.checkAnswer(q, wrong), false, `${family}/${format}: une proposition fausse n'est pas acceptée`);
      }

      if (q.type === 'number' || q.type === 'table') {
        const commaAnswer = String(q.answer).replace('.', ',');
        assert.equal(E.checkAnswer(q, commaAnswer), true, `${family}/${format}: virgule décimale acceptée`);
        assert.equal(E.checkAnswer(q, String(Number(q.answer) + Math.max(10, Math.abs(Number(q.answer)) * 0.5))), false, `${family}/${format}: résultat incorrect refusé`);
        assert.equal(E.checkAnswer(q, String(Number(q.answer) + 0.001)), false, `${family}/${format}: petit écart numérique refusé`);
        assert.equal(E.checkAnswer(q, `texte${q.answer}`), false, `${family}/${format}: texte parasite refusé dans une réponse numérique`);
      }

      // Le générateur doit calculer indépendamment la bonne conversion à partir des unités.
      if (['choice', 'number', 'table', 'error'].includes(q.type) && q.from && q.to && q.value !== undefined) {
        const expectedValue = E.convert(q.value, family, q.from, q.to);
        const expectedLabel = `${E.fmt(expectedValue)} ${q.to}`;
        const actualLabel = ['number', 'table'].includes(q.type) ? `${E.fmt(q.answer)} ${q.to}` : String(q.answer);
        assert.equal(E.normalizeAnswer(actualLabel), E.normalizeAnswer(expectedLabel), `${family}/${format}: résultat mathématique concorde avec les unités`);
      }

      if (q.type === 'match') {
        assert.equal(q.leftItems.length, 3, `${family}/${format}: trois mesures à relier`);
        assert.equal(new Set(q.leftItems.map(x => E.normalizeAnswer(x.label))).size, 3, `${family}/${format}: mesures de gauche distinctes`);
        assert.equal(new Set(q.rightItems.map(x => E.normalizeAnswer(x.label))).size, 3, `${family}/${format}: mesures de droite distinctes`);
        const ids = Object.keys(q.answer);
        const badMapping = { ...q.answer, [ids[0]]: q.answer[ids[1]] };
        assert.equal(E.checkAnswer(q, JSON.stringify(badMapping)), false, `${family}/${format}: associations incorrectes refusées`);
      }

      if (q.type === 'order') {
        assert.equal(q.items.length, 4, `${family}/${format}: quatre éléments à classer`);
        assert.equal(new Set(q.items.map(E.normalizeAnswer)).size, 4, `${family}/${format}: éléments distincts`);
        assert.equal(E.checkAnswer(q, JSON.stringify([...q.answer].reverse())), false, `${family}/${format}: ordre erroné refusé`);
        const sortedValues = q.answer.map((item) => Number(String(item).trim().split(/\s+/)[0].replace(',', '.')));
        assert.deepEqual(sortedValues, [...sortedValues].sort((a, b) => a - b), `${family}/${format}: le corrigé est bien rangé de la plus petite à la plus grande`);
      }

      if (q.type === 'multi') {
        assert.ok(q.answer.length >= 2, `${family}/${format}: plusieurs réponses correctes possibles`);
        assert.equal(E.checkAnswer(q, JSON.stringify(q.answer.slice(1))), false, `${family}/${format}: réponse incomplète refusée`);
        assert.ok(q.answer.every(answer => q.options.includes(answer)), `${family}/${format}: toutes les bonnes réponses proposées`);
        assert.equal(new Set(q.options.map(E.normalizeAnswer)).size, q.options.length, `${family}/${format}: options multiples distinctes`);
        const target = q.prompt.match(/équivalentes à ([0-9][0-9 ,.'’]*)\s*([a-z²³]+)/i);
        assert.ok(target, `${family}/${format}: mesure de départ claire dans la consigne`);
        const targetValue = Number(target[1].replace(/[\s'’]/g, '').replace(',', '.'));
        const targetUnit = target[2];
        const parseOption = (option) => {
          const match = String(option).match(/^([0-9][0-9 ,.'’]*)\s*([a-z²³]+)$/i);
          return match ? { value: Number(match[1].replace(/[\s'’]/g, '').replace(',', '.')), unit: match[2] } : null;
        };
        for (const correctOption of q.answer) {
          const option = parseOption(correctOption);
          assert.ok(option && option.unit in E.FAMILIES[family].units, `${family}/${format}: unité de réponse reconnue`);
          const expected = E.convert(targetValue, family, targetUnit, option.unit);
          assert.ok(Math.abs(expected - option.value) <= Math.max(1e-9, Number.EPSILON * Math.max(1, Math.abs(expected)) * 8), `${family}/${format}: équivalence cochable correcte (${correctOption})`);
        }
        for (const wrongOption of q.options.filter(option => !q.answer.includes(option))) {
          const option = parseOption(wrongOption);
          assert.ok(option && option.unit in E.FAMILIES[family].units, `${family}/${format}: distracteur de la bonne famille`);
          const expected = E.convert(targetValue, family, targetUnit, option.unit);
          assert.ok(Math.abs(expected - option.value) > Math.max(1e-9, Number.EPSILON * Math.max(1, Math.abs(expected)) * 8), `${family}/${format}: le distracteur ne doit pas être une autre réponse correcte (${wrongOption})`);
        }
      }

      if (q.type === 'unit') {
        const familyUnits = Object.keys(E.FAMILIES[family].units).map(E.normalizeAnswer);
        assert.ok(q.options.every(option => familyUnits.includes(E.normalizeAnswer(option))), `${family}/${format}: toutes les unités proposées appartiennent à la bonne famille`);
      }

      // Pour les formats de conversion, la consigne ne doit pas répéter le résultat exact.
      // On exige une limite après l'unité (m et m³ sont différents) pour éviter les faux positifs.
      if (['choice', 'number', 'table', 'error'].includes(q.type)) {
        const answerLabel = ['number', 'table'].includes(q.type) ? `${E.fmt(q.answer)} ${q.to}` : q.answer;
        const answer = E.normalizeAnswer(answerLabel).replace(/[\s'’]/g, '').replace(',', '.');
        const parts = answer.match(/^([0-9]+(?:\.[0-9]+)?)([a-z²³]+)$/);
        assert.ok(parts, `${family}/${format}: réponse de conversion au format nombre + unité`);
        const escapedNumber = parts[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const unitPattern = parts[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![0-9.,])${escapedNumber}(?![0-9.,])${unitPattern}(?![a-z²³])`, 'i');
        const normalizedPrompt = q.prompt.toLowerCase().replace(/[\s'’]/g, '').replace(',', '.');
        assert.equal(regex.test(normalizedPrompt), false, `${family}/${format}: résultat correct non révélé mot pour mot dans la consigne: ${q.prompt} => ${q.answer}`);
      }
    }
  }
}

// Teste aussi la génération sans format imposé : les séries peuvent être générées à la demande.
const seen = new Set();
for (let i = 0; i < 1000; i += 1) {
  const q = E.makeQuestion('length', 2);
  seen.add(`${q.type}|${q.prompt}|${JSON.stringify(q.answer)}`);
}
assert.ok(seen.size > 100, `le générateur doit produire une grande variété de questions (observé : ${seen.size})`);

// Durées : conversions propres, non décimales dans la mesure du possible.
for (let i = 0; i < 100; i += 1) {
  const q = E.makeQuestion('duration', 1 + (i % 4), { format: 'number' });
  assert.ok(Number.isFinite(q.answer), 'réponse de durée numérique');
  assert.equal(E.checkAnswer(q, String(q.answer)), true, 'conversion de durée exacte');
}

// Tableaux : seules les familles prévues disposent du format de tableau de conversion.
for (const family of ['length', 'mass', 'capacity']) assert.ok(E.availableFormats(family).includes('table'));
for (const family of ['duration', 'area', 'volume']) assert.ok(!E.availableFormats(family).includes('table'));

console.log(`Mesurovia V3 engine tests: OK — ${families.length} grandeurs, formats générés, corrections exactes, propositions distinctes, associations/classements/réponses multiples, 1 000 questions dynamiques et conversions temporelles.`);
