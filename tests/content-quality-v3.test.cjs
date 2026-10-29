// Audit dynamique du moteur Mesurovia : cohérence mathématique et contenus retirés.
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../src/lib/games/mesurovia/engine-legacy.js');
const E = global.MesuEngine;

assert.equal(E.VILLAGES.length, 5, 'cinq villages');
assert.equal(E.VILLAGES.reduce((total, village) => total + E.listHouses(village.id).length, 0), 20, 'vingt maisons');
assert.deepEqual(Object.keys(E.FAMILIES.mass.units).sort(), ['cg','dag','dg','g','hg','kg','mg'].sort(), 'masses sans tonne et avec les unités intermédiaires');

const numericLabel = (label) => {
  const match = String(label).trim().match(/^([0-9][0-9 '’]*(?:[.,][0-9]+)?)\s*([a-z²³]+)$/i);
  return match ? { value: Number(match[1].replace(/[\s'’]/g, '').replace(',', '.')), unit: match[2] } : null;
};
function valueInBaseUnit(family, label) {
  const parsed = numericLabel(label);
  if (parsed && parsed.unit in E.FAMILIES[family].units) return parsed.value * E.FAMILIES[family].units[parsed.unit];
  if (family === 'duration') {
    const pattern = /([0-9]+(?:[.,][0-9]+)?)\s*(h|min|s)\b/gi;
    let total = 0;
    let found = false;
    let match;
    while ((match = pattern.exec(String(label))) !== null) {
      found = true;
      total += Number(match[1].replace(',', '.')) * E.FAMILIES.duration.units[match[2].toLowerCase()];
    }
    if (found) return total;
  }
  return null;
}

let checkedPairs = 0;
for (const family of Object.keys(E.FAMILIES)) {
  for (let i = 0; i < 100; i += 1) {
    const question = E.makeQuestion(family, 1 + (i % 4), { format: 'match' });
    for (const left of question.leftItems) {
      const right = question.rightItems.find((item) => item.id === question.answer[left.id]);
      assert.ok(right, `${family}: carte associée présente`);
      const leftValue = valueInBaseUnit(family, left.label);
      const rightValue = valueInBaseUnit(family, right.label);
      assert.ok(leftValue !== null && rightValue !== null, `${family}: mesures lisibles`);
      assert.ok(Math.abs(leftValue - rightValue) <= Math.max(0.0001, Math.abs(rightValue) * 0.0001), `${left.label} et ${right.label} doivent être équivalents`);
      checkedPairs += 1;
    }
  }
}

const page = fs.readFileSync('src/routes/mesurovia/+page.svelte', 'utf8');
assert.ok(page.includes('courseForHouse(currentVillageId, h.id)'), 'les maisons utilisent les cours dédiés');
assert.ok(page.includes('Je réussis si…'), 'les critères de réussite sont visibles');
assert.ok(page.includes('interactive lockUnits'), 'le tableau des exercices est manipulable');
assert.ok(!page.includes('engine.lessonForHouse'), 'aucun ancien cours générique utilisé');
assert.ok(!/target:\s*\['(?:sentiers-moulin|clairieres-compas|canaux-artisans|hautes-terres)'/.test(page), 'aucun ancien identifiant utilisé comme destination');

console.log(`Mesurovia content audit: OK — 5 villages, 20 maisons et ${checkedPairs} associations simulées.`);
