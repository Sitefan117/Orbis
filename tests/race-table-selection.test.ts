import assert from 'node:assert/strict';
import { makeQuestionBase, type Notion } from '../src/lib/games/race/engine';

const notions: Notion[] = [
  'livrets', 'doubles', 'triples', 'quadruples', 'complements10', 'complements100',
  'complements1000', 'dizaineSuivante', 'centaineSuivante', 'millierSuivant', 'trous', 'divisions'
];
const labels = Object.fromEntries(notions.map((notion) => [notion, notion])) as Record<Notion, string>;

for (const notion of ['livrets', 'trous', 'divisions'] as const) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const question = makeQuestionBase(notion, 'challenge', labels, [12]);
    const formulaFactors = question.fullFormula.match(/\d+/g)?.map(Number) ?? [];
    assert.ok(formulaFactors.includes(12), `${notion} doit rester lié au livret de 12 : ${question.fullFormula}`);
  }
}

console.log('race table selection: ok');
