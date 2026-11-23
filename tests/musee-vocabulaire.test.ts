import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readLexique, makeGrid, gridSize, gridWord, letterChoices, matchRounds, normalize, prioritizeRecent, spriteStyle } from '../src/lib/games/musee-vocabulaire/lexique';
import { conversations } from '../src/lib/games/musee-vocabulaire/context-content';

const bank = readLexique(readFileSync('static/vocabulaire/lexique.csv', 'utf8'));
const englishBank = readLexique(readFileSync('static/vocabulaire/english-lab.csv', 'utf8'));
assert.equal(englishBank.length, bank.length + 10);
const englishThemes = new Set(englishBank.map((entry) => entry.theme));
for (const theme of new Set(bank.map((entry) => entry.theme))) assert.ok(englishThemes.has(theme));
assert.ok(englishThemes.has('computing'));
assert.ok(englishThemes.has('computer-actions'));
assert.equal(englishBank.filter((entry) => entry.sentence).length, bank.filter((entry) => entry.sentence).length);
assert.ok(englishBank.every((entry) => entry.definition));
const prioritised = prioritizeRecent(englishBank.slice(0, 20), englishBank.slice(0, 8).map((entry) => entry.id));
assert.ok(prioritised.slice(0, 12).every((entry) => !englishBank.slice(0, 8).some((recent) => recent.id === entry.id)));
assert.deepEqual(new Set(prioritised.map((entry) => entry.id)), new Set(englishBank.slice(0, 20).map((entry) => entry.id)));
assert.ok(englishBank.filter((entry) => entry.syllables.length >= 2).length >= 500);
assert.ok(englishBank.filter((entry) => entry.variants).length >= 30);
const englishById = new Map(englishBank.map((entry) => [entry.id, entry]));
for (const [id, expected] of Object.entries({
  'ecole-tableau': 'board', 'ecole-regle': 'ruler', 'ecole-feuille': 'sheet of paper',
  'budget-recu': 'receipt', 'budget-especes': 'cash', 'coiffeuse-salon': 'hair salon',
  'coiffeuse-tondeuse': 'hair clippers', 'environnement-emission': 'emissions',
  'carrossiere-rayure': 'scratch', 'logement-compteur': 'meter', 'sports-ballon': 'ball',
  'actions-porter': 'carry', 'coiffeuse-coupe': 'haircut', 'logement-concierge': 'caretaker',
  'citoyennete-s-engager': 'get involved', 'travail-serieux': 'conscientious',
  'hygiene-intime': 'personal', 'pharmacie-guerir': 'recover', 'formation-diplome': 'diploma'
})) assert.equal(englishById.get(id)?.word, expected, `Traduction anglaise incorrecte : ${id}`);
const englishByThemeAndWord = new Map<string, string>();
for (const entry of englishBank) {
  const key = `${entry.theme}:${normalize(entry.word)}`;
  assert.ok(!englishByThemeAndWord.has(key) || englishByThemeAndWord.get(key) === entry.definition,
    `Deux notions du même thème partagent la réponse « ${entry.word} » : ${englishByThemeAndWord.get(key)} / ${entry.definition}`);
  englishByThemeAndWord.set(key, entry.definition);
}
for (const [id, expected] of Object.entries({
  'actions-fermer': 'Remember to ___ the window before you leave.',
  'nature-piscine': 'We are going to the ___, so take your swimsuit.',
  'formation-respecter-un-delai': 'The work must be finished before Friday. You need to ___.',
  'numerique-telecharger': 'I will ___ the document to my phone.'
})) assert.equal(englishById.get(id)?.sentence, expected, `Phrase anglaise incorrecte : ${id}`);
assert.equal(new Set(englishBank.filter((entry) => entry.sprite).map((entry) => entry.sprite)).size,
  englishBank.filter((entry) => entry.sprite).length, 'Deux mots anglais partagent la même image');
assert.equal(englishById.get('ecole-tableau')?.sprite, 'ecole-sprites-v1:2', 'Le tableau doit garder son image scolaire');
assert.equal(englishById.get('coiffeuse-salon')?.sprite, 'metiers:0', 'Le salon de coiffure doit utiliser son image métier');
for (const entry of englishBank) {
  const path = `static/audio/english-lab/${entry.id}-piper.wav`;
  assert.ok(existsSync(path), `Audio anglais manquant : ${entry.id}`);
  const audio = readFileSync(path);
  assert.ok(audio.length > 1_000, `Audio anglais vide ou tronqué : ${entry.id}`);
  assert.equal(audio.subarray(0, 4).toString('ascii'), 'RIFF', `En-tête WAV invalide : ${entry.id}`);
  assert.equal(audio.subarray(8, 12).toString('ascii'), 'WAVE', `Format WAV invalide : ${entry.id}`);
}
const audioManifest = JSON.parse(readFileSync('static/audio/english-lab/manifest.json', 'utf8')) as { voices: string[]; words: string[] };
assert.deepEqual(audioManifest.voices, ['piper-en-GB-alan']);
assert.deepEqual(new Set(audioManifest.words), new Set(englishBank.map((entry) => entry.id)));
const compoundChoices = letterChoices('rendez-vous');
assert.equal(compoundChoices.length, new Set(gridWord('rendez-vous')).size * 2);
assert.ok([...new Set(gridWord('rendez-vous'))].every((letter) => compoundChoices.includes(letter)));
assert.ok(bank.length >= 940);
const themes = new Set(bank.map((entry) => entry.theme));
assert.ok(themes.size >= 31);
assert.ok(bank.filter((entry) => entry.sentence).length >= 220);
for (const theme of themes) assert.ok(bank.filter((entry) => entry.theme === theme && entry.sentence).length >= 5);
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
for (const entry of englishBank.filter((word) => word.sprite)) {
  const sheet = entry.sprite.split(':')[0];
  const folder = sheet.startsWith('english-lab-') ? 'english-lab' : 'musee-vocabulaire';
  assert.ok(existsSync(`static/images/${folder}/${sheet}.png`), `Image anglaise manquante : ${sheet}`);
}
const header = 'id,theme,intitule,parcours,mot,definition,phrase_a_trou,syllabes_ecrites,sprite';
assert.equal(readLexique('id;theme;intitule;parcours;mot;definition\r\na;ecole;École;base;stylo;"Objet; encre"')[0].definition, 'Objet; encre');
assert.equal(readLexique(header + '\na,t,Thème,base,test,Définition,,,nouvelle-planche:0:4:3')[0].sprite, 'nouvelle-planche:0:4:3');
assert.throws(() => readLexique(header + '\na,t,T,base,test,Définition,,,../autre:0:4:3'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,Définition,,fa-ux,'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,"guillemet'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,D,,,\na,t,T,base,test,D,,,'));
assert.throws(() => readLexique(header + '\na,t,T,base,test,D,trop ___ de ___ trous,,'));
console.log(`Musée du vocabulaire et English Lab — ${englishBank.length} entrées, ${englishThemes.size} thèmes, ${englishBank.filter((entry) => entry.sentence).length} phrases et audios validés.`);
