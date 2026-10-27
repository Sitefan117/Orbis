/* Test de la sauvegarde locale avec un localStorage simulé : aucune donnée réelle n'est touchée. */
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tempDir = path.join(__dirname, '.compiled-progress');
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
for (const name of ['types.ts', 'curriculum.ts', 'progress.ts']) {
  const file = path.join(root, 'src/lib/games/numeria', name);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  fs.writeFileSync(path.join(tempDir, name.replace(/\.ts$/, '.js')), code);
}
const data = new Map();
global.localStorage = {
  getItem: (key) => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key)
};
const { createEmptySave, loadSave, saveProgress, clearProgress, studentStorageKey } = require(path.join(tempDir, 'progress.js'));
let alice = createEmptySave('Alice', '6H');
alice.xp = 125;
alice.completedRealms.push('6h-collections');
alice.realms['6h-collections'].guardianWon = true;
alice.activeMission = {
  realmId: '6h-collections',
  grade: '6H',
  mode: 'training',
  questions: [{ id: 'q1', realmId: '6h-collections', grade: '6H', kind: 'choice', prompt: 'Combien ?', expected: '100', hint: 'Compte.', explanation: '100 unités.', options: ['10', '100'], errorFamily: 'place-value' }],
  questionIndex: 0,
  answer: '100',
  attemptsForQuestion: 0,
  showHint: false,
  feedback: 'none',
  feedbackText: '',
  questionFinished: false,
  outcomes: [{ solved: false, firstTry: false, mistakes: 0 }],
  savedAt: new Date().toISOString()
};
saveProgress(alice);
const loadedAlice = loadSave('Alice', '7H');
if (loadedAlice.xp !== 125 || loadedAlice.grade !== '6H' || !loadedAlice.completedRealms.includes('6h-collections')) throw new Error('La sauvegarde d’Alice ne se recharge pas correctement.');
if (loadedAlice.schemaVersion !== 3 || loadedAlice.activeMission?.answer !== '100') throw new Error('La mission active ne se recharge pas exactement.');
const bob = loadSave('Bob', '7H');
if (bob.xp !== 0 || bob.grade !== '7H' || bob.completedRealms.length !== 0) throw new Error('Les données d’Alice contaminent le profil de Bob.');
clearProgress('Alice');
if (data.has(studentStorageKey('Alice'))) throw new Error('La suppression locale ne retire pas la clé élève.');
if (loadSave('Alice', '6H').xp !== 0) throw new Error('Une progression supprimée réapparaît.');
// Migration minimale d'une sauvegarde v1 dont le profil correspond au nom fourni.
data.set('numeria_save_sveltekit_v1', JSON.stringify({ playerName: 'Camille', selectedGrade: '8H', xp: 90 }));
const camille = loadSave('Camille', '6H');
if (camille.xp !== 90 || camille.grade !== '8H') throw new Error('La migration de base v1 ne fonctionne pas.');
clearProgress('Camille');
if (data.has('numeria_save_sveltekit_v1')) throw new Error('La sauvegarde v1 effacée est réimportée.');
console.log('OK — sauvegardes séparées par élève, reprise d’une mission, effacement et migration v1.');
fs.rmSync(tempDir, { recursive: true, force: true });
