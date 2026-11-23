import assert from 'node:assert/strict';
import { BAZAR_CHALLENGES, BAZAR_THEMES, getBazarChallenges, getBazarTheme } from '../src/lib/games/bazar/curriculum';
import type { BazarLevel } from '../src/lib/games/bazar/types';

assert.equal(BAZAR_THEMES.length, 9, 'Le Bazar doit proposer exactement neuf thématiques.');
assert.equal(new Set(BAZAR_THEMES.map((theme) => theme.id)).size, 9, 'Chaque thématique doit avoir un identifiant unique.');
assert.equal(BAZAR_CHALLENGES.length, 81, 'Chaque thématique doit proposer trois défis pour chacun des trois niveaux.');
assert.equal(new Set(BAZAR_CHALLENGES.map((challenge) => challenge.id)).size, BAZAR_CHALLENGES.length, 'Les identifiants des défis doivent être uniques.');

for (const theme of BAZAR_THEMES) {
  assert.equal(getBazarTheme(theme.id), theme);
  for (const level of [6, 7, 8] as BazarLevel[]) {
    const challenges = getBazarChallenges(theme.id, level);
    assert.equal(challenges.length, 3, `${theme.id} doit contenir trois défis de ${level}H.`);
    for (const challenge of challenges) {
      assert.equal(challenge.theme, theme.id);
      assert.equal(challenge.level, level);
      assert.equal(challenge.choices.length, 3, `${challenge.id} doit proposer trois choix.`);
      assert.equal(new Set(challenge.choices).size, 3, `${challenge.id} contient des choix en double.`);
      assert(challenge.choices.includes(challenge.answer), `${challenge.id} doit inclure la réponse attendue dans ses choix.`);
      assert(challenge.hint.length > 8, `${challenge.id} doit fournir un indice utile.`);
      assert(challenge.explanation.length > 12, `${challenge.id} doit fournir une explication.`);
    }
  }
}

console.log('Le Bazar : 9 thématiques, 3 niveaux et 81 défis structurés vérifiés.');
