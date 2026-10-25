# Tests Mesurovia V3

À exécuter depuis la racine de l'archive :

```bash
node tests/engine.test.cjs
node tests/engine-v3.test.cjs
node tests/content-quality-v3.test.cjs
python3 tests/orbis-route-structure.py
```

## Ce que vérifient les tests

- `engine.test.cjs` : conversions, correction des réponses, adaptation, quatre régions, vingt maisons et différences de progression.
- `engine-v3.test.cjs` : formats générés, réponses exactes/fausses, propositions distinctes et plausibles à l'intérieur de leur famille, réponses décimales, classement, associations, multi-sélection et conversions temporelles. Il échantillonne 150 questions par combinaison disponible de famille/format avec variation du niveau, soit 6 750 cas, puis 1 000 questions supplémentaires.
- `content-quality-v3.test.cjs` : 80 étapes de leçon, 240 options statiques, recherche de réponses recopiées dans les consignes ou le contenu montré avant la question, et cohérence de 1 440 associations générées.
- `orbis-route-structure.py` : présence des modes de jeu, animations, clavier intégré, options d'accessibilité et mécanismes de sauvegarde.

Un contrôle supplémentaire externe au dépôt de livraison a analysé la syntaxe TypeScript, la syntaxe CSS via PostCSS et l'équilibre des blocs `{#if}` / `{#each}` Svelte. Il ne constitue pas une compilation Svelte réelle. Aucun serveur ORBIS complet ni navigateur iPad n'était disponible : les tests automatiques ne remplacent pas le build et le test manuel dans ce projet.
