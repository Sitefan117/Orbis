#!/usr/bin/env node
/*
 * Test de fumée du moteur NEXUS sans ajouter de dépendance npm.
 * Il compile les trois modules TypeScript dans un dossier temporaire, puis
 * génère des milliers de questions et vérifie les réponses et les critères.
 * À lancer depuis la racine d'Orbis après avoir copié les fichiers livrés :
 *   node tests/geometry-engine-smoke.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tempOutput = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-geometry-build-'));
const localTsc = path.join(root, 'node_modules', '.bin', 'tsc');
const compiler = fs.existsSync(localTsc) ? localTsc : 'tsc';
const compile = spawnSync(compiler, [
  '--outDir', tempOutput,
  '--target', 'ES2022',
  '--module', 'commonjs',
  '--moduleResolution', 'node',
  '--strict',
  '--skipLibCheck',
  'src/lib/games/geometrie/types.ts',
  'src/lib/games/geometrie/figures.ts',
  'src/lib/games/geometrie/question-engine.ts'
], { cwd: root, encoding: 'utf8' });

if (compile.status !== 0) {
  process.stderr.write(compile.stdout || '');
  process.stderr.write(compile.stderr || '');
  fs.rmSync(tempOutput, { recursive: true, force: true });
  process.exit(1);
}

const { generateQuestion, validateQuestion } = require(path.join(tempOutput, 'question-engine.js'));
const { getFiguresForLevel } = require(path.join(tempOutput, 'figures.js'));
const levels = ['6H', '7H', '8H'];
const modes = ['A', 'B', 'C', 'D', 'Mixte'];
const iterations = Math.max(1, Number(process.env.GEOMETRY_TEST_ITERATIONS || 1000));
let generated = 0;
let assertionCount = 0;

function assert(condition, message) {
  assertionCount += 1;
  if (!condition) throw new Error(message);
}

function criterionMatches(criterionId, figure) {
  const p = figure.properties;
  switch (criterionId) {
    case 'plane': return figure.kind === 'plane';
    case 'solid': return figure.kind === 'solid';
    case 'triangle': return figure.kind === 'plane' && figure.isTriangle;
    case 'quadrilateral': return figure.kind === 'plane' && p.straightSides === 4;
    case 'right-angle': return figure.kind === 'plane' && (p.rightAngles || 0) > 0;
    case 'parallel-pair': return figure.kind === 'plane' && (p.parallelPairs || 0) > 0;
    case 'all-equal': return figure.kind === 'plane' && p.equalSidePattern === 'all';
    case 'symmetric': return figure.kind === 'plane' && (p.symmetryAxes || 0) > 0;
    case 'concave': return figure.kind === 'plane' && p.isConvex === false;
    default: throw new Error(`Critère de test inconnu : ${criterionId}`);
  }
}

// Les textes des indices sont contrôlés contre les données, pour éviter les
// messages inexacts du type « 0 côté droit » ou des propriétés mal formulées.
function clueMatches(text, figure) {
  const p = figure.properties;
  if (text === 'Je suis une figure plane (2D).') return figure.kind === 'plane';
  if (text === 'Je suis un solide (3D).') return figure.kind === 'solid';
  if (text === 'Mon contour est entièrement courbe.') return figure.kind === 'plane' && p.curvedBoundary === true;
  let match;
  if ((match = text.match(/^Mon contour possède (\d+) côtés droits\.$/))) return figure.kind === 'plane' && p.straightSides === Number(match[1]);
  if ((match = text.match(/^Je possède (\d+) sommets?\.$/))) return p.vertices === Number(match[1]);
  if (text === 'Je ne possède aucun angle droit.') return figure.kind === 'plane' && p.rightAngles === 0;
  if ((match = text.match(/^Je possède (\d+) angles? droits?\.$/))) return figure.kind === 'plane' && p.rightAngles === Number(match[1]);
  if (text === 'Mes trois côtés ont des longueurs différentes.') return figure.kind === 'plane' && p.equalSidePattern === 'all-different';
  if (text === 'Aucun de mes côtés n’a la même longueur qu’un autre.') return figure.kind === 'plane' && p.equalSidePattern === 'none';
  if (text === 'Je possède exactement un couple de côtés égaux dans cette catégorie.') return figure.kind === 'plane' && p.equalSidePattern === 'one-pair';
  if (text === 'Mes côtés opposés sont égaux deux à deux.') return figure.kind === 'plane' && p.equalSidePattern === 'opposite-pairs';
  if (text === 'Je possède deux couples de côtés voisins égaux.') return figure.kind === 'plane' && p.equalSidePattern === 'adjacent-pairs';
  if (text === 'Tous mes côtés ont la même longueur.') return figure.kind === 'plane' && p.equalSidePattern === 'all';
  if (text === 'Je ne possède aucune paire de côtés parallèles.') return figure.kind === 'plane' && p.parallelPairs === 0;
  if ((match = text.match(/^Je possède (\d+) paires? de côtés parallèles\.$/))) return figure.kind === 'plane' && p.parallelPairs === Number(match[1]);
  if (text === 'Je possède une infinité d’axes de symétrie.') return figure.kind === 'plane' && p.symmetryAxes === Infinity;
  if (text === 'Je ne possède aucun axe de symétrie.') return figure.kind === 'plane' && p.symmetryAxes === 0;
  if ((match = text.match(/^Je possède (\d+) axes? de symétrie\.$/))) return figure.kind === 'plane' && p.symmetryAxes === Number(match[1]);
  if (text === 'Je suis convexe.') return figure.kind === 'plane' && p.isConvex === true;
  if (text === 'Je suis concave.') return figure.kind === 'plane' && p.isConvex === false;
  if ((match = text.match(/^Je possède (\d+) faces?\.$/))) return figure.kind === 'solid' && p.faces === Number(match[1]);
  if ((match = text.match(/^Je possède (\d+) arêtes?\.$/))) return figure.kind === 'solid' && p.edges === Number(match[1]);
  if (text === 'Toutes mes faces ont la même forme.') return figure.kind === 'solid' && p.allFacesSameShape === true;
  if (text === 'Toutes mes faces n’ont pas la même forme.') return figure.kind === 'solid' && p.allFacesSameShape === false;
  if ((match = text.match(/^Je possède (\d+) faces? triangulaires?\.$/))) return figure.kind === 'solid' && p.triangularFaces === Number(match[1]);
  throw new Error(`Indice sans règle de vérification : ${text}`);
}

try {
  for (const level of levels) {
    const pool = getFiguresForLevel(level);
    assert(pool.length >= 4, `${level}: la banque contient moins de 4 figures.`);
    assert(pool.some((figure) => figure.kind === 'plane'), `${level}: aucune figure plane.`);
    assert(pool.some((figure) => figure.kind === 'solid'), `${level}: aucun solide.`);

    for (const mode of modes) {
      for (let n = 0; n < iterations; n += 1) {
        const question = generateQuestion(level, mode);
        generated += 1;
        assert(validateQuestion(question), `${level}/${mode}: question invalide n°${n}.`);
        assert(new Set(question.options.map((option) => option.id)).size === question.options.length, `${level}/${mode}: options dupliquées.`);
        assert(question.correctIds.every((id) => question.options.some((option) => option.id === id)), `${level}/${mode}: réponse absente des options.`);

        if (mode !== 'Mixte') assert(question.mode === mode, `${level}/${mode}: mauvais mode renvoyé (${question.mode}).`);
        if (question.mode === 'A') {
          const targets = question.options.filter((option) => question.correctIds.includes(option.id));
          assert(targets.length === 1, `${level}/A: nombre de cibles incorrect.`);
          const allHints = question.progressiveHints;
          assert(allHints.length > 0, `${level}/A: aucun indice.`);
          for (const hint of allHints) {
            for (const option of question.options) {
              assert(typeof clueMatches(hint, option.figure) === 'boolean', `${level}/A: indice invérifiable.`);
            }
          }
          assert(allHints.every((hint) => clueMatches(hint, targets[0].figure)), `${level}/A: un indice ne décrit pas la cible.`);
          assert(question.options.filter((option) => allHints.every((hint) => clueMatches(hint, option.figure))).length === 1, `${level}/A: les indices n'identifient pas une seule réponse.`);
        }
        if (question.mode === 'B') {
          assert(question.options.length === 4, `${level}/B: il n'y a pas exactement 4 options.`);
          assert(question.criterionId, `${level}/B: critère manquant.`);
          const matching = question.options.filter((option) => criterionMatches(question.criterionId, option.figure));
          const nonMatching = question.options.filter((option) => !criterionMatches(question.criterionId, option.figure));
          assert(matching.length === 3 && nonMatching.length === 1, `${level}/B: il faut exactement trois figures conformes et un intrus.`);
          assert(question.correctIds[0] === nonMatching[0].id, `${level}/B: l'intrus attendu ne correspond pas au critère.`);
        }
        if (question.mode === 'C') {
          assert(question.focusFigure, `${level}/C: dessin à classer absent.`);
          assert(question.correctIds[0] === question.focusFigure.kind, `${level}/C: réponse 2D/3D incorrecte.`);
        }
        if (question.mode === 'D') {
          assert(question.type === 'multiple', `${level}/D: le QCM multiple est remplacé par un autre type.`);
          const expected = question.options.filter((option) => criterionMatches(question.criterionId, option.figure)).map((option) => option.id).sort();
          assert([...question.correctIds].sort().join('|') === expected.join('|'), `${level}/D: les réponses correctes ne suivent pas le critère.`);
        }
      }
    }
  }
  console.log(`PASS — ${generated.toLocaleString('fr-CH')} questions générées et validées sur 3 niveaux × 5 modes.`);
  console.log(`PASS — ${assertionCount.toLocaleString('fr-CH')} assertions, dont la vérification des indices et des intrus.`);
} catch (error) {
  console.error('ÉCHEC DU TEST GÉOMÉTRIE :', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  fs.rmSync(tempOutput, { recursive: true, force: true });
}
