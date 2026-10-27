/* Smoke test du moteur : transpile le TypeScript avec le compilateur global installé sur la machine. */
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sourceFiles = ['types.ts', 'curriculum.ts', 'question-engine.ts'].map((name) => path.join(root, 'src/lib/games/numeria', name));
const tempDir = path.join(__dirname, '.compiled');
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  fs.writeFileSync(path.join(tempDir, path.basename(file).replace(/\.ts$/, '.js')), out);
}
// Adapte les chemins des imports transpilés à ce dossier isolé, sans modifier les sources.
const currPath = path.join(tempDir, 'curriculum.js');
const enginePath = path.join(tempDir, 'question-engine.js');
const { REALMS } = require(currPath);
const { generateQuestions, answersEqual } = require(enginePath);
let tested = 0;
for (const realm of REALMS) {
  for (const mode of ['training', 'guardian']) {
    for (let i = 0; i < 1000; i++) {
      // Seed déterministe : utile pour rejouer le test et trouver une combinaison fautive.
      let seed = (i + 1) * 7919 + realm.id.length * 97 + (mode === 'guardian' ? 31 : 0);
      const rng = () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
      const questions = generateQuestions(realm.grade, realm.id, mode, rng);
      if (questions.length !== (mode === 'training' ? 5 : 7)) throw new Error(`Nombre d'exercices incorrect : ${realm.id} / ${mode}`);
      for (const q of questions) {
        if (!q.prompt || !q.hint || !q.explanation || !q.expected) throw new Error(`Question incomplète : ${q.id}`);
        if ((q.kind === 'choice' || q.kind === 'numberline') && !q.options?.some((option) => option === q.expected)) throw new Error(`Bonne réponse absente des choix : ${JSON.stringify(q)}`);
        if (q.options && new Set(q.options).size !== q.options.length) throw new Error(`Options dupliquées : ${q.id}`);
        if (q.options) {
          const semanticallyCorrect = q.options.filter((option) => answersEqual(option, q.expected));
          if (semanticallyCorrect.length !== 1) throw new Error(`La question doit avoir une seule option juste : ${JSON.stringify({ id: q.id, expected: q.expected, options: q.options, semanticallyCorrect })}`);
        }
        if (!answersEqual(q.expected, q.expected)) throw new Error(`Réponse attendue non validée : ${q.id}`);
        tested++;
      }
    }
  }
}
if (!answersEqual('1\u202f234', '1234')) throw new Error('Séparateur de milliers suisse non normalisé');
if (!answersEqual('0,007', '0.007')) throw new Error('Virgule décimale française non acceptée');
if (!answersEqual('6/8', '3/4')) throw new Error('Fractions équivalentes non acceptées dans les réponses saisies');
if (answersEqual('2/0', '2/0')) throw new Error('Division par zéro doit rester invalide');
console.log(`OK — ${tested} questions générées et vérifiées (${REALMS.length} royaumes × entraînement/gardien × 1’000 générations).`);
fs.rmSync(tempDir, { recursive: true, force: true });
