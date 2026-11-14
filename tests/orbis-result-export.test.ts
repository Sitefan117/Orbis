import assert from 'node:assert/strict';
import { resultRowsToCsv, resultRowsToPdf, safeExportPart } from '../src/lib/orbis/teacher/result-export';

const rows = [{
  student: 'Panda "Rigolo"', classroom: 'Classe 6H', game: 'Calculs', activity: 'Décimaux', skill: 'Addition',
  correct: 8, questions: 10, errors: 2, hints: null, durationSeconds: null, occurredAt: '2026-11-14T10:00:00Z'
}];
const csv = resultRowsToCsv(rows);

assert.ok(csv.startsWith('"Élève";"Classe";'));
assert.ok(csv.includes('"Panda ""Rigolo"""'), 'Les guillemets doivent rester valides dans Excel.');
assert.ok(csv.includes('"80"'), 'Le taux de réussite doit être calculé.');
assert.ok(csv.includes('"";"";"2026-11-14T10:00:00Z"'), 'Une mesure inconnue doit rester vide, jamais devenir zéro.');
assert.equal(safeExportPart('Classe test 6H — Élèves'), 'classe-test-6h-eleves');
const pdf = await resultRowsToPdf(rows, { filters: 'Classe test 6H', generatedAt: new Date('2026-11-14T12:00:00Z'), totalCorrect: 8, totalQuestions: 10 });
assert.equal(new TextDecoder().decode(pdf.slice(0, 5)), '%PDF-', 'Le générateur doit produire un véritable fichier PDF.');
assert.ok(pdf.byteLength > 1_000, 'Le PDF ne doit pas être vide.');

console.log('✓ Exports Orbis : CSV Excel et véritable PDF, taux calculé, valeurs inconnues vides et nom de fichier sûr');
