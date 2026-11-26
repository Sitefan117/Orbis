import assert from 'node:assert/strict';

const baseUrl = process.env.ORBIS_TEST_URL ?? 'http://127.0.0.1:5174';
const tests = [];
let teacherCookie = '';
let portalMission;
let gameMission;

function test(name, run) {
  tests.push({ name, run });
}

async function request(path, options = {}, authenticated = false) {
  const headers = new Headers(options.headers);
  if (authenticated && teacherCookie) headers.set('cookie', teacherCookie);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

const validConfiguration = {
  schemaVersion: 1,
  selectedNotions: ['livrets', 'complements10', 'complements100'],
  selectedTables: [4],
  practiceLevel: 'guided',
  gameMode: 'training',
  questionCount: 12
};

test('session anonyme refusée', async () => {
  const { response, body } = await request('/api/teacher/session');
  assert.equal(response.status, 200);
  assert.equal(body.authenticated, false);
});

test('mauvais mot de passe refusé', async () => {
  const { response } = await request('/api/teacher/session', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'incorrect' })
  });
  assert.equal(response.status, 401);
});

test('bon mot de passe accepté', async () => {
  const { response, body } = await request('/api/teacher/session', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test' })
  });
  assert.equal(response.status, 200);
  assert.equal(body.authenticated, true);
  teacherCookie = response.headers.get('set-cookie')?.split(';')[0] ?? '';
  assert.match(teacherCookie, /^classroom_teacher_session=/);
});

test('session authentifiée reconnue', async () => {
  const { body } = await request('/api/teacher/session', {}, true);
  assert.equal(body.authenticated, true);
});

test('liste des missions protégée', async () => {
  const { response } = await request('/api/teacher/learning-missions');
  assert.equal(response.status, 401);
});

test('liste des missions accessible à l’enseignant', async () => {
  const { response, body } = await request('/api/teacher/learning-missions', {}, true);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.missions));
});

test('type de code invalide refusé', async () => {
  const { response } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'wrong', game: 'race', configuration: validConfiguration })
  }, true);
  assert.equal(response.status, 400);
});

test('jeu inconnu refusé', async () => {
  const { response } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'game', game: 'inconnu', configuration: validConfiguration })
  }, true);
  assert.equal(response.status, 400);
});

test('mission sans compétence refusée', async () => {
  const { response } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'game', game: 'race', configuration: { ...validConfiguration, selectedNotions: [] } })
  }, true);
  assert.equal(response.status, 400);
});

test('livrets sans table refusés', async () => {
  const { response } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'game', game: 'race', configuration: { ...validConfiguration, selectedTables: [] } })
  }, true);
  assert.equal(response.status, 400);
});

test('nombre de questions hors limite refusé', async () => {
  const { response } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'game', game: 'race', configuration: { ...validConfiguration, questionCount: 5 } })
  }, true);
  assert.equal(response.status, 400);
});

test('création d’un code portail', async () => {
  const { response, body } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'portal', game: 'race', configuration: validConfiguration })
  }, true);
  assert.equal(response.status, 201);
  portalMission = body.mission;
});

test('format du code portail correct', async () => {
  assert.match(portalMission.code, /^[2-9A-HJ-NP-Z]{6}$/);
  assert.equal(portalMission.scope, 'portal');
  assert.equal(portalMission.portalCode, portalMission.code);
  assert.equal(portalMission.gameCode, `RACE-${portalMission.code}`);
});

test('lecture publique de la configuration', async () => {
  const { response, body } = await request(`/api/learning-missions/${portalMission.code}`);
  assert.equal(response.status, 200);
  assert.deepEqual(body.mission.configuration.selectedTables, [4]);
  assert.ok(body.mission.summary.includes('Table de 4'));
});

test('code accepté en minuscules', async () => {
  const { response, body } = await request(`/api/learning-missions/${portalMission.code.toLowerCase()}`);
  assert.equal(response.status, 200);
  assert.equal(body.mission.id, portalMission.id);
});

test('code inconnu refusé clairement', async () => {
  const { response, body } = await request('/api/learning-missions/ZZZZZZ');
  assert.equal(response.status, 404);
  assert.equal(body.valid, false);
});

test('création d’un code Math Racer', async () => {
  const { response, body } = await request('/api/teacher/learning-missions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: 'game', game: 'race', configuration: validConfiguration })
  }, true);
  assert.equal(response.status, 201);
  gameMission = body.mission;
});

test('format du code Math Racer correct', async () => {
  assert.match(gameMission.code, /^RACE-[2-9A-HJ-NP-Z]{6}$/);
  assert.equal(gameMission.scope, 'game');
  assert.equal(gameMission.id, portalMission.id);
  assert.equal(gameMission.code, portalMission.gameCode);
});

test('résultat Math Racer enregistré avec la mission', async () => {
  const { response, body } = await request('/api/activity-results', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      studentName: 'Élève Test E2E', world: 'race', mission: `Mission ${portalMission.code}`,
      missionId: portalMission.id, score: 10, total: 12, errorCount: 2,
      errorFamilies: ['complements100'], metadata: { selectedTables: [4] }
    })
  });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test('résultat visible dans le tableau enseignant', async () => {
  const { response, body } = await request('/api/teacher/dashboard', {}, true);
  assert.equal(response.status, 200);
  const result = body.results.find((item) => item.studentName === 'Élève Test E2E');
  assert.equal(result.world, 'race');
  assert.equal(result.score, 10);
  assert.equal(result.total, 12);
});

let passed = 0;
for (const [index, item] of tests.entries()) {
  try {
    await item.run();
    passed += 1;
    console.log(`✓ ${String(index + 1).padStart(2, '0')}/20 ${item.name}`);
  } catch (error) {
    console.error(`✗ ${String(index + 1).padStart(2, '0')}/20 ${item.name}`);
    console.error(error);
  }
}

console.log(`\nRésultat : ${passed}/${tests.length} tests réussis.`);
if (passed !== tests.length) process.exitCode = 1;
