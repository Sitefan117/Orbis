// Audit pédagogique V3 : les 20 maisons, leurs questions de validation et les réponses proposées.
// Ce script vérifie des invariants vérifiables par code ; il ne remplace pas une relecture humaine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Le test fonctionne dans l'archive complète (drop-in/) et dans le paquet de copie (src/).
const enginePath = fs.existsSync(path.join(__dirname, '../drop-in/lib/mesurovia/engine-legacy.js'))
  ? '../drop-in/lib/mesurovia/engine-legacy.js'
  : '../src/lib/games/mesurovia/engine-legacy.js';
require(enginePath);
const E = global.MesuEngine;

const normalize = E.normalizeAnswer;
const stripMarkup = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
let checkedLessons = 0;
let checkedChoices = 0;
let checkedNoPromptLeak = 0;
let checkedNoExampleLeak = 0;
const problems = [];

// Réponse composée d'un nombre et d'une unité : contrôle exact avec une frontière d'unité.
// La frontière évite par exemple de confondre m avec m³.
function exactNumericUnitIn(text, answer) {
  const compactAnswer = normalize(answer).replace(/[\s'’]/g, '').replace(',', '.');
  const parts = compactAnswer.match(/^([0-9]+(?:\.[0-9]+)?)([a-z²³]+)$/i);
  if (!parts) return false;
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const number = escapeRegex(parts[1]);
  const unit = escapeRegex(parts[2]);
  const regex = new RegExp(`(?<![0-9.,])${number}(?![0-9.,])${unit}(?![a-z²³])`, 'i');
  return regex.test(normalize(text).replace(/,/g, '.'));
}

for (const village of E.VILLAGES) {
  const houses = E.listHouses(village.id);
  assert.equal(houses.length, 5, `${village.name}: cinq maisons prévues`);
  for (const house of houses) {
    const lessons = E.lessonForHouse(house.id, village.id);
    assert.equal(lessons.length, 4, `${village.name}/${house.title}: quatre étapes de leçon`);
    for (const lesson of lessons) {
      checkedLessons += 1;
      assert.ok(lesson.title && lesson.body && lesson.ask, `${village.name}/${house.title}: titre, explication et question présents`);
      assert.ok(Array.isArray(lesson.options) && lesson.options.length === 3, `${village.name}/${house.title}: trois réponses proposées`);
      assert.equal(new Set(lesson.options.map(normalize)).size, lesson.options.length, `${village.name}/${house.title}: aucune proposition dupliquée`);
      assert.ok(lesson.options.some((option) => normalize(option) === normalize(lesson.answer)), `${village.name}/${house.title}: réponse correcte dans les choix`);
      checkedChoices += lesson.options.length;

      // Signaux de réponses mal construites déjà repérés pendant la préparation.
      assert.ok(!lesson.options.includes('1,3 min'), `${village.name}/${house.title}: pas de proposition temporelle confuse « 1,3 min »`);
      if (lesson.title === 'Je sais ce que je mesure') {
        assert.deepEqual(lesson.options.map(normalize).sort(), ['cL', 'L', 'mL'].map(normalize).sort(), 'question de capacité : distracteurs dans la même famille d’unités');
      }

      // Le résultat chiffré complet ne doit pas se trouver dans la consigne.
      if (/\d/.test(String(lesson.answer))) {
        if (exactNumericUnitIn(lesson.ask, lesson.answer)) {
          problems.push(`${village.id}/${house.id}/${lesson.title}: réponse chiffrée reprise dans la consigne`);
        } else {
          checkedNoPromptLeak += 1;
        }
      }

      // Une réponse textuelle entière ne doit pas être recopiée telle quelle dans la consigne.
      const answerText = normalize(lesson.answer);
      if (answerText.length > 4 && !/\d/.test(answerText) && normalize(lesson.ask).includes(answerText)) {
        problems.push(`${village.id}/${house.id}/${lesson.title}: réponse textuelle reprise dans la consigne`);
      }
      // Le champ « explain » est la correction après réponse : il ne doit pas être présenté avant.
      if (exactNumericUnitIn(`${lesson.body} ${stripMarkup(lesson.visual)}`, lesson.answer)) {
        problems.push(`${village.id}/${house.id}/${lesson.title}: réponse chiffrée recopiée dans la leçon qui précède`);
      } else if (/^\s*[-+]?\d[\d\s]*(?:[.,]\d+)?\s*(?:km|hm|dam|m|dm|cm|mm|kg|g|mg|t|kL|hL|daL|L|dL|cL|mL|h|min|s|m²|dm²|cm²|km²|m³|dm³|cm³)\s*$/i.test(String(lesson.answer))) {
        checkedNoExampleLeak += 1;
      }
    }
  }
}
assert.deepEqual(problems, [], problems.join('\n'));

// Contrôle mathématique des paires d'associations : les deux étiquettes doivent vraiment être équivalentes.
const numericLabel = (label) => {
  const m = String(label).trim().match(/^([0-9][0-9 '’]*(?:[.,][0-9]+)?)\s*([a-z²³]+)$/i);
  return m ? { value: Number(m[1].replace(/[\s'’]/g, '').replace(',', '.')), unit: m[2] } : null;
};
function valueInBaseUnit(family, label) {
  const parsed = numericLabel(label);
  if (parsed && parsed.unit in E.FAMILIES[family].units) {
    return parsed.value * E.FAMILIES[family].units[parsed.unit];
  }
  // Le format composite 1 h 30 min peut apparaître dans le filet de sécurité des durées.
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
for (const family of Object.keys(E.FAMILIES)) {
  for (let i = 0; i < 80; i += 1) {
    const q = E.makeQuestion(family, 1 + (i % 4), { format: 'match' });
    for (const left of q.leftItems) {
      const rightId = q.answer[left.id];
      const right = q.rightItems.find((item) => item.id === rightId);
      assert.ok(right, `${family}: chaque carte de droite existe`);
      const leftBase = valueInBaseUnit(family, left.label);
      const rightBase = valueInBaseUnit(family, right.label);
      assert.ok(leftBase !== null && rightBase !== null, `${family}: labels de mesure reconnus : ${left.label} ↔ ${right.label}`);
      assert.ok(Math.abs(leftBase - rightBase) <= Math.max(0.0001, Math.abs(rightBase) * 0.0001), `${family}: équivalence incorrecte ${left.label} ↔ ${right.label}`);
    }
  }
}

// Vérifie que le cours ne montre/lit plus la correction avant la réponse de l'élève.
const pagePath = fs.existsSync(path.join(__dirname, '../drop-in/+page.svelte'))
  ? path.join(__dirname, '../drop-in/+page.svelte')
  : path.join(__dirname, '../src/routes/mesurovia/+page.svelte');
const page = fs.readFileSync(pagePath, 'utf8');
assert.ok(page.includes('Observe le schéma et les repères ci-dessus.'), 'le repère avant question ne doit pas afficher le corrigé');
assert.ok(!page.includes("Exemple : ${currentLesson?.explain ?? ''}"), 'la lecture vocale de la diapositive ne doit pas lire la correction avant la question');
assert.ok(page.includes("currentLesson?.explain || 'Tu as compris cette étape.'"), 'la correction reste disponible après la réponse');

console.log(`Mesurovia V3 content audit: OK — ${checkedLessons} étapes de leçon, ${checkedChoices} propositions statiques, contrôles anti-fuite, cohérence des associations dynamiques et vérification de l'affichage pré-question.`);
