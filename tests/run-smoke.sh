#!/usr/bin/env bash
# Lance les vérifications rapides qui peuvent s’exécuter sans démarrer le site.
set -euo pipefail

node tests/engine.test.cjs
node tests/engine-v3.test.cjs
node tests/content-quality-v3.test.cjs
node --import tsx tests/mesurovia-conversion-table.test.ts
node --import tsx tests/race-table-selection.test.ts
./node_modules/.bin/tsx tests/fractionstower2-generator.test.ts
python3 tests/orbis-route-structure.py
python3 tests/orbis-navigation-smoke.py
node --import tsx tests/orbis-catalog-navigation.test.ts
node --import tsx tests/orbis-local-student.test.ts
node tests/geometry-engine-smoke.cjs
node tests/numeria-engine-smoke.cjs
node tests/numeria-progress-smoke.cjs
bash tests/run-conju-lab-smoke.sh
