const assert = require('node:assert/strict');
const fs = require('node:fs');

const config = fs.readFileSync('svelte.config.js', 'utf8');
const layout = fs.readFileSync('src/routes/+layout.svelte', 'utf8');

assert.match(config, /version:\s*\{[\s\S]*pollInterval:\s*60_000/, 'Orbis doit sonder les nouvelles versions');
assert.match(layout, /updated\.check\(\)/, 'Orbis doit vérifier au retour sur un onglet');
assert.match(layout, /\{#if \$updated\}/, 'Orbis doit signaler une nouvelle version');
assert.match(layout, /window\.location\.reload\(\)/, 'Le bouton doit charger les nouveaux fichiers');

console.log('Orbis update detection: polling, focus check and reload prompt OK.');
