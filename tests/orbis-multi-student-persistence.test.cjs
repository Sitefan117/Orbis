/* Vérifie l'isolation locale de cinq comptes élèves et trois jeux sur un appareil partagé. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src/lib/orbis/persistence/local-store.ts');
const tempDir = path.join(__dirname, '.compiled-multi-student');
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));

let currentUser = '';
global.__orbisTestSession = () => currentUser ? ({ userId: currentUser, accessToken: 'test' }) : null;
const source = fs.readFileSync(sourcePath, 'utf8')
  .replace("import { studentStorageScope } from '$lib/orbis/identity/local-student';", "const studentStorageScope = (name) => name.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'explorateur';")
  .replace("import { getRemoteSession } from './remote-session';", 'const getRemoteSession = () => global.__orbisTestSession();');
const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
fs.writeFileSync(path.join(tempDir, 'local-store.js'), output);

const data = new Map();
global.localStorage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key)
};
const store = require(path.join(tempDir, 'local-store.js'));

const pupils = [
  ['student-panda', 'PandaRigolo', 2],
  ['student-loutre', 'LoutreMaline', 5],
  ['student-koala', 'KoalaZen', 8],
  ['student-renard', 'RenardFute', 4],
  ['student-dauphin', 'DauphinRieur', 7]
];
const games = ['calculs', 'livrets', 'geometrie'];
for (const [userId, name, completed] of pupils) {
  for (const game of games) {
    currentUser = userId;
    store.saveLocalGameState(name, game, { question: completed + 1 }, 1, { label: `${completed}/10`, completed, total: 10 });
    store.appendLocalActivityEvent(store.createLocalActivityEvent({ studentName: name, world: game, mission: 'test', score: completed, total: 10 }));
  }
}

for (const [userId, name, completed] of pupils) {
  for (const game of games) {
    const save = store.loadLocalGameSave(name, game);
    assert.equal(save.remoteStudentId, userId);
    assert.equal(save.record.state.question, completed + 1);
  }
}
const events = store.getPendingActivityEvents();
assert.equal(events.length, pupils.length * games.length);
for (const [userId, name] of pupils) {
  const own = events.find((event) => event.studentName === name);
  assert.equal(own.remoteStudentId, userId);
}

const pandaSave = store.loadLocalGameSave('PandaRigolo', 'calculs');
store.markGameSaveSynced(pandaSave.studentScope, 'calculs', pandaSave.record.revision, 4);
assert.equal(store.loadLocalGameSave('PandaRigolo', 'calculs').syncState, 'synced');
assert.equal(store.loadLocalGameSave('LoutreMaline', 'calculs').syncState, 'pending');
assert.equal(store.loadLocalGameSave('KoalaZen', 'calculs').syncState, 'pending');

console.log('Orbis multi-élèves : 5 comptes, 3 jeux, sauvegardes, résultats et états de synchronisation isolés.');
fs.rmSync(tempDir, { recursive: true, force: true });
