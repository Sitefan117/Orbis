# Ressources de Fraction Tower

**Rôle du dossier :** ressources publiées pour le jeu de fractions. Les personnages illustrés sont dans [`characters/`](./characters/README.md), les décors des neuf étages dans [`floors/`](./floors/README.md) et les anciens supports HTML dans [`courses/`](./courses/README.md).

## Dépendances

Les composants de jeu sont dans `src/lib/games/fractionstower2/`. L’actuel `CourseViewer.svelte` ouvre le cours complet depuis `static/cours/maths/fractions/complet.html` via `src/lib/orbis/catalog/course-paths.ts`. Les fichiers de `courses/` sont des supports historiques gardés séparément ; ils ne sont pas la cible de ce lecteur.

Les images de `characters/` et `floors/` sont locales au site. Les fonds incluent leurs propres murs et ornements ; les collisions, déplacements et interactions restent définis dans le code du jeu.
