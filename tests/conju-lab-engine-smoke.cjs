/*
 * Test de fumée du moteur ConjuLab.
 * Le script est lancé après compilation TypeScript par run-conju-lab-smoke.sh.
 * Il vérifie des formes françaises sensibles et teste des milliers de questions
 * pour repérer les options invalides ou les réponses qui disparaissent du QCM.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const buildDir = process.env.CONJULAB_BUILD_DIR || path.join(__dirname, '.build-conju-lab');
const engine = require(path.join(buildDir, 'question-engine.js'));
const curriculum = require(path.join(buildDir, 'curriculum.js'));
const verbsModule = require(path.join(buildDir, 'verbs.js'));

const allVerbs = verbsModule.getAllVerbs();
assert.equal(new Set(allVerbs.map((verb) => verb.infinitive)).size, allVerbs.length, 'La banque ne doit pas contenir deux entrées pour un même infinitif.');
const byName = (name) => {
  const found = allVerbs.find((verb) => verb.infinitive === name);
  assert.ok(found, `Le verbe ${name} doit être présent dans la banque.`);
  return found;
};
const subject = (id, personIndex, gender = 'neutral', plural = false) => ({
  id, label: id, personIndex, gender, plural
});
const je = subject('je', 0);
const nous = subject('nous', 3, 'neutral', true);
const elle = subject('elle', 2, 'f', false);
const elles = subject('elles', 5, 'f', true);

// Contrôles linguistiques non aléatoires : ils capturent plusieurs erreurs du prototype.
assert.equal(byName('rendre').group, 3, 'Rendre appartient au 3e groupe.');
assert.equal(byName('finir').participePasse, 'fini');
assert.equal(engine.conjugateForm(byName('être'), 'present', je), 'suis');
assert.equal(engine.conjugateForm(byName('être'), 'futurSimple', je), 'serai');
assert.equal(engine.conjugateForm(byName('avoir'), 'conditionnelPresent', je), 'aurais');
assert.equal(engine.conjugateForm(byName('manger'), 'present', nous), 'mangeons');
assert.equal(engine.conjugateForm(byName('commencer'), 'present', nous), 'commençons');
assert.equal(engine.conjugateForm(byName('acheter'), 'present', nous), 'achetons');
assert.equal(engine.conjugateForm(byName('aller'), 'passeCompose', elle), 'est allée');
assert.equal(engine.conjugateForm(byName('aller'), 'passeCompose', elles), 'sont allées');
assert.equal(engine.conjugateForm(byName('être'), 'passeCompose', je), 'ai été');
assert.equal(engine.conjugateForm(byName('venir'), 'futurSimple', je), 'viendrai');
assert.equal(engine.conjugateForm(byName('falloir'), 'present', subject('il', 2, 'm', false)), 'faut');
assert.equal(engine.conjugateForm(byName('fuir'), 'present', nous), 'fuyons');
assert.equal(engine.conjugateForm(byName('fuir'), 'futurSimple', je), 'fuirai');
assert.equal(engine.conjugateForm(byName('valoir'), 'futurSimple', subject('il', 2, 'm', false)), 'vaudra');
assert.equal(engine.conjugateForm(byName('peler'), 'present', je), 'pèle');
assert.equal(engine.conjugateForm(byName('peler'), 'futurSimple', je), 'pèlerai');
assert.equal(engine.conjugateForm(byName('être'), 'subjonctifPresent', nous), 'soyons');
assert.equal(engine.conjugateForm(byName('venir'), 'passeAnterieur', elle), 'fut venue');
assert.equal(engine.conjugateForm(byName('avoir'), 'conditionnelPasse', je), 'aurais eu');
assert.ok(verbsModule.getVerbsForGrade('7H').some((verb) => verb.infinitive === 'entendre'));
assert.ok(!verbsModule.getVerbsForGrade('7H').some((verb) => verb.infinitive === 'appeler'));
assert.ok(verbsModule.getVerbsForGrade('8H').some((verb) => verb.infinitive === 'appeler'));
assert.ok(verbsModule.getVerbsForGrade('8H').some((verb) => verb.infinitive === 'craindre'));

// Une graphie alternative admise pour payer est bien reconnue.
const payerQuestion = {
  id: 'test-payer', kind: 'conjuguer', prompt: 'Test', sentence: 'Je ___ (payer)',
  verb: byName('payer'), tense: 'present', subject: je, correctAnswer: 'paie', options: ['paie', 'paye', 'pai', 'pays'],
  explanation: 'Test', hintSteps: ['Indice 1', 'Indice 2'], feedbackTag: 'forme'
};
assert.equal(engine.analyseAnswer(payerQuestion, 'paye').isCorrect, true);

// Le moteur doit produire des questions valides pour chaque niveau, focus et sélection.
let generated = 0;
let targetedGenerated = 0;
for (const grade of ['6H', '7H', '8H', '9H']) {
  const gradeTenses = curriculum.getTensesForGrade(grade).map((tense) => tense.id);
  const tenseSets = [
    gradeTenses.slice(0, 1),
    gradeTenses,
    gradeTenses.filter((tense) => ['passeAnterieur', 'subjonctifPasse', 'conditionnelPasse'].includes(tense))
  ];

  for (const focus of ['mixte', 'conjuguer', 'identifier', 'groupes', 'radicaux']) {
    for (const selectedTenses of tenseSets) {
      for (let iteration = 0; iteration < 250; iteration += 1) {
        const question = engine.generateQuestion({
          grade,
          focus,
          answerStyle: 'mixte',
          selectedTenses,
          selectedGroups: [1, 2, 3]
        });
        assert.equal(engine.validateQuestion(question), true, `${grade}/${focus}: question invalide`);
        assert.ok(question.options.length >= 2 && question.options.length <= 4);
        assert.ok(question.options.some((option) => option.trim().toLocaleLowerCase('fr') === question.correctAnswer.trim().toLocaleLowerCase('fr')),
          `${grade}/${focus}: la réponse doit figurer parmi les options.`);
        assert.equal(new Set(question.options.map((option) => option.trim().toLocaleLowerCase('fr'))).size, question.options.length,
          `${grade}/${focus}: doublon dans les options.`);
        generated += 1;
      }
    }
  }
}

// Les exercices de radicaux restent pertinents même lorsque l’élève filtre un seul groupe.
for (const selectedGroups of [[1], [2], [3], [1, 2], [2, 3]]) {
  for (let iteration = 0; iteration < 150; iteration += 1) {
    const question = engine.generateQuestion({
      grade: '8H', focus: 'radicaux', answerStyle: 'qcm', selectedTenses: ['present'], selectedGroups
    });
    assert.equal(question.kind === 'radical' || question.kind === 'terminaison', true);
    assert.equal(engine.validateQuestion(question), true);
    targetedGenerated += 1;
  }
}

// Les formes rares ont des prompts grammaticaux : impératif sans pronom sujet,
// subjonctif introduit par « que » et élision correcte devant une voyelle.
for (let iteration = 0; iteration < 500; iteration += 1) {
  const imperative = engine.generateQuestion({
    grade: '7H', focus: 'conjuguer', answerStyle: 'qcm', selectedTenses: ['imperatif'], selectedGroups: [1, 2, 3]
  });
  assert.match(imperative.sentence, /À l’impératif/);
  assert.doesNotMatch(imperative.explanation, /forme attendue est « (tu|nous|vous) /);
  targetedGenerated += 1;

  const subjunctive = engine.generateQuestion({
    grade: '8H', focus: 'conjuguer', answerStyle: 'qcm', selectedTenses: ['subjonctifPresent'], selectedGroups: [1, 2, 3]
  });
  assert.match(subjunctive.sentence, /^(que |qu’)/);
  assert.match(subjunctive.explanation, /forme attendue est « (que |qu’)/);
  targetedGenerated += 1;
}

console.log(`ConjuLab : ${(generated + targetedGenerated).toLocaleString('fr-CH')} questions générées et validées (${generated.toLocaleString('fr-CH')} tests de matrice + ${targetedGenerated.toLocaleString('fr-CH')} tests ciblés).`);
