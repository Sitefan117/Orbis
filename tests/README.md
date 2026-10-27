# tests

**Rôle du dossier :** Vérifications ciblées des moteurs, contenus, sauvegardes et navigation.

## Fichiers

- **[`conju-lab-engine-smoke.cjs](./conju-lab-engine-smoke.cjs)** — Vérifie conjugaisons et génération de questions.  
  Dépend de : `node:assert` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`content-quality-v3.test.cjs](./content-quality-v3.test.cjs)** — Contrôle la cohérence pédagogique de Mesurovia V3.  
  Dépend de : `node:assert` (bibliothèque intégrée à Node.js), `node:fs` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`engine-v3.test.cjs](./engine-v3.test.cjs)** — Vérifie les calculs de Mesurovia V3.  
  Dépend de : `node:assert` (bibliothèque intégrée à Node.js), `node:fs` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`engine.test.cjs](./engine.test.cjs)** — Vérifie le moteur historique Mesurovia.  
  Dépend de : `src/lib/games/mesurovia/engine-legacy.js` — autre dossier, `node:assert` (bibliothèque intégrée à Node.js).
- **[`geometry-engine-smoke.cjs](./geometry-engine-smoke.cjs)** — Vérifie les questions de géométrie.  
  Dépend de : `node:fs` (bibliothèque intégrée à Node.js), `node:os` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js), `node:child_process` (bibliothèque intégrée à Node.js).
- **[`numeria-engine-smoke.cjs](./numeria-engine-smoke.cjs)** — Vérifie le moteur de questions Numéria.  
  Dépend de : `typescript` (dépendance npm ; un chemin alternatif local est prévu), `node:fs` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`numeria-progress-smoke.cjs](./numeria-progress-smoke.cjs)** — Vérifie la sauvegarde locale de Numéria.  
  Dépend de : `typescript` (dépendance npm ; un chemin alternatif local est prévu), `node:fs` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`orbis-navigation-smoke.py](./orbis-navigation-smoke.py)** — Vérifie les chemins et liens de navigation.  
  Dépend de : aucun import direct détecté.
- **[`orbis-route-structure.py](./orbis-route-structure.py)** — Vérifie la structure des routes Mesurovia.  
  Dépend de : aucun import direct détecté.
- **[`README-TESTS.md](./README-TESTS.md)** — Commandes et portée des vérifications.  
  Dépend de : aucun import direct détecté.
- **[`run-conju-lab-smoke.sh](./run-conju-lab-smoke.sh)** — Compile ConjuLab et lance sa vérification.  
  Dépend de : `tests/conju-lab-engine-smoke.cjs`, les fichiers `src/lib/games/conju-lab/` et le compilateur TypeScript.
- **[`run-smoke.sh](./run-smoke.sh)** — Lance les vérifications rapides.  
  Dépend de : scripts `*-smoke.cjs`, `engine.test.cjs`, `content-quality-v3.test.cjs`, `fractionstower2-generator.test.ts`, `orbis-route-structure.py` et `orbis-navigation-smoke.py`.
- **[`fractionstower2-generator.test.ts](./fractionstower2-generator.test.ts)** — Génère 540 sessions sur les neuf étages et vérifie les répétitions, calculs, conversions, QCM, aides visuelles et comparaisons.  
  Dépend de : `src/lib/games/fractionstower2/engines/ExerciseGenerator.ts`, `src/lib/games/fractionstower2/data/curriculum.ts` — autres dossiers, `node:assert` et `tsx`.

## Lancement

Les scripts sont regroupés par `tests/run-smoke.sh`. Voir aussi [`README-TESTS.md`](./README-TESTS.md).
