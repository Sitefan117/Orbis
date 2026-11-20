import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readLexique, makeGrid, gridSize, gridWord, letterChoices, matchRounds, spriteStyle } from '../src/lib/games/musee-vocabulaire/lexique';
import { conversations } from '../src/lib/games/musee-vocabulaire/context-content';

const bank = readLexique(readFileSync('static/vocabulaire/lexique.csv', 'utf8'));
const compoundChoices = letterChoices('rendez-vous');
assert.equal(compoundChoices.length, new Set(gridWord('rendez-vous')).size * 2);
assert.ok([...new Set(gridWord('rendez-vous'))].every((letter) => compoundChoices.includes(letter)));
assert.ok(bank.length >= 940);
const themes = new Set(bank.map((entry) => entry.theme));
assert.ok(themes.size >= 31);
assert.ok(bank.filter((entry) => entry.sentence).length >= 220);
for (const theme of themes) {
  assert.ok(bank.filter((entry) => entry.theme === theme && entry.sentence).length >= 5);
  assert.ok(existsSync(`static/images/musee-vocabulaire/context/${theme}.jpg`), `Planche de situations manquante pour ${theme}`);
}
const conversationThemes = new Set(conversations.flatMap((conversation) => conversation.themes));
for (const theme of themes) assert.ok(conversationThemes.has(theme), `Discussion manquante pour ${theme}`);
for (const conversation of conversations) assert.ok(conversation.lines.length >= 4);

const illustrated = bank.filter((entry) => entry.sprite);
const uniqueImages = illustrated.slice(0, 20);
for (let count = 2; count <= uniqueImages.length; count++) {
  const pool = uniqueImages.slice(0, count);
  const rounds = matchRounds([...pool, ...pool, bank.find((entry) => !entry.sprite)!]);
  assert.deepEqual(rounds.flat().map((word) => word.id), pool.map((word) => word.id));
  assert.ok(rounds.every((round) => round.length >= 2 && round.length <= 6));
}
assert.deepEqual(matchRounds(uniqueImages.slice(0, 1)), []);
const [firstImage, secondImage] = uniqueImages;
assert.deepEqual(matchRounds([
  firstImage,
  { ...firstImage, id: 'duplicate-sprite', word: 'Autre nom' },
  { ...firstImage, id: 'duplicate-word', word: firstImage.word.toUpperCase(), sprite: 'other:1:3:3' },
  secondImage
]), [[firstImage, secondImage]]);
for (const theme of themes) {
  const entries = bank.filter((entry) => entry.theme === theme);
  assert.ok(entries.length >= 30);
  for (let i = 0; i < 100; i++) {
    const { cells, targets } = makeGrid(entries);
    assert.equal(cells.length, gridSize ** 2);
    assert.equal(targets.length, 6);
    for (const { entry, paths } of targets) {
      assert.ok(paths.length);
      for (const path of paths) {
        assert.equal(path.map((index) => cells[index]).join(''), gridWord(entry.word));
        assert.ok(path.every((cell, index) => index === 0 || cell - path[index - 1] === gridSize ||
          (cell - path[index - 1] === 1 && Math.floor(cell / gridSize) === Math.floor(path[index - 1] / gridSize))));
      }
    }
  }
}
for (const entry of bank.filter((word) => word.sprite)) {
  assert.ok(existsSync('static/images/musee-vocabulaire/' + entry.sprite.split(':')[0] + '.png'));
  assert.match(spriteStyle('/Orbis', entry.sprite), /Orbis/);
  assert.doesNotMatch(spriteStyle('/Orbis', entry.sprite), /NaN|Infinity/);
}
const header = 'id,theme,intitule,parcours,mot,definition,phrase_a_trou,syllabes_ecrites,sprite';
assert.equal(readLexique('id;theme;intitule;parcours;mot;definition\r\na;ecole;École;base;stylo;"Objet; encre"')[0].definition, 'Objet; encre');
assert.equal(readLexique(header + '\na,t,Thème,base,test,Définition,,,nouvelle-planche:0:4:3')[0].sprite, 'nouvelle-planche:0:4:3');
assert.throws(() => readLexique(header + '\na,t,T,base,test,Définition,,,../autre:0:4:3'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,Définition,,fa-ux,'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,"guillemet'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,D,,,\na,t,T,base,test,D,,,'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,D,trop ___ de ___ trous,,'));
console.log('Musée du vocabulaire — 940 entrées, 31 thèmes, 220 phrases, 155 contextes illustrés et discussions validés.');
