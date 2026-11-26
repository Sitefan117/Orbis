import assert from 'node:assert/strict';

const baseUrl = process.env.ORBIS_TEST_URL ?? 'http://127.0.0.1:5174';
let teacherCookie = '';
const tests = [];
const created = new Map();
const games = [
  ['race', 'RACE', { schemaVersion: 1, selectedNotions: ['livrets', 'complements10'], selectedTables: [4], practiceLevel: 'guided', gameMode: 'training', questionCount: 12 }],
  ['livrets', 'LIV', { schemaVersion: 1, selectedTables: [3, 6], questionCount: 8 }],
  ['mathhunt', 'HUNT', { schemaVersion: 1, selectedTables: [5, 7], difficulty: 'ACCRUE', movementOn: false }],
  ['calculs', 'CALC', { schemaVersion: 1, activeLevels: [2, 3], operations: ['-'], questionCount: 9 }],
  ['conju_lab', 'CONJ', { schemaVersion: 1, grade: '7H', playPath: 'libre', focus: 'conjuguer', answerStyle: 'saisie', selectedTenses: ['present', 'conditionnelPresent'], selectedGroups: [1, 3] }],
  ['shift', 'SHIFT', { schemaVersion: 1, missionId: 'measure', difficulty: 'decimal', playStyle: 'challenge' }]
];

function test(name, run) { tests.push({ name, run }); }
async function request(path, options = {}, authenticated = false) {
  const headers = new Headers(options.headers);
  if (authenticated && teacherCookie) headers.set('cookie', teacherCookie);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

test('connexion enseignant', async () => {
  const { response, body } = await request('/api/teacher/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test' }) });
  assert.equal(response.status, 200); assert.equal(body.authenticated, true);
  teacherCookie = response.headers.get('set-cookie')?.split(';')[0] ?? '';
});

test('création non authentifiée refusée', async () => {
  const { response } = await request('/api/teacher/learning-missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'portal', game: games[0][0], configuration: games[0][2] }) });
  assert.equal(response.status, 401);
});

for (const [game, prefix, configuration] of games) {
  test(`création ${game}`, async () => {
    const { response, body } = await request('/api/teacher/learning-missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'portal', game, configuration }) }, true);
    assert.equal(response.status, 201); assert.equal(body.mission.game, game); assert.match(body.mission.portalCode, /^[2-9A-HJ-NP-Z]{6}$/); assert.equal(body.mission.gameCode, `${prefix}-${body.mission.portalCode}`); created.set(game, body.mission);
  });
  test(`lecture directe ${game}`, async () => {
    const mission = created.get(game);
    const { response, body } = await request(`/api/learning-missions/${mission.gameCode}`);
    assert.equal(response.status, 200); assert.equal(body.mission.id, mission.id); assert.equal(body.mission.scope, 'game'); assert.deepEqual(body.mission.configuration, configuration);
  });
}

test('tous les jetons sont uniques entre jeux', async () => {
  const tokens = [...created.values()].map((mission) => mission.portalCode);
  assert.equal(new Set(tokens).size, games.length);
});

test('mauvais préfixe refusé', async () => {
  const mission = created.get('livrets');
  const { response } = await request(`/api/learning-missions/RACE-${mission.portalCode}`);
  assert.equal(response.status, 404);
});

test('même configuration renvoie la mission canonique', async () => {
  const [game, , configuration] = games[2];
  const first = created.get(game);
  const { response, body } = await request('/api/teacher/learning-missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'game', game, configuration }) }, true);
  assert.equal(response.status, 201); assert.equal(body.mission.id, first.id); assert.equal(body.mission.gameCode, first.gameCode);
});

test('configuration invalide refusée', async () => {
  const { response } = await request('/api/teacher/learning-missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'game', game: 'shift', configuration: { schemaVersion: 1, missionId: 'unknown', difficulty: 'starter', playStyle: 'practice' } }) }, true);
  assert.equal(response.status, 400);
});

test('liste enseignant contient les six jeux', async () => {
  const { response, body } = await request('/api/teacher/learning-missions', {}, true);
  assert.equal(response.status, 200);
  for (const [game] of games) assert.ok(body.missions.some((mission) => mission.game === game));
});

test('les six pages de jeu répondent', async () => {
  for (const route of ['/race', '/livrets', '/mathhunt', '/calculs', '/conju_lab', '/shift']) {
    const response = await fetch(`${baseUrl}${route}`); assert.equal(response.status, 200, route);
  }
});

let passed = 0;
for (const [index, item] of tests.entries()) {
  try { await item.run(); passed += 1; console.log(`✓ ${String(index + 1).padStart(2, '0')}/${tests.length} ${item.name}`); }
  catch (error) { console.error(`✗ ${String(index + 1).padStart(2, '0')}/${tests.length} ${item.name}`); console.error(error); }
}
console.log(`\nRésultat multi-jeux : ${passed}/${tests.length} tests réussis.`);
if (passed !== tests.length) process.exitCode = 1;
