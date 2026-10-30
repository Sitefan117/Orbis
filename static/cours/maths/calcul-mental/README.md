# MathRacer — cours de calcul

**Rôle du dossier :** parcours pédagogique associé au jeu `/race`, centré sur les opérations avec des nombres entiers jusqu’à la 8H.

## Fichiers

- `mathracer.html` : livret élève unifié en 18 chapitres, utilisable en ligne ou imprimable, avec théorie, exercices, validation et cinq évaluations de synthèse.
- `cahier-mathracer.html` : cahier d’exercices imprimable en 18 fiches.
- `corrige-mathracer.html` : réponses, démarches possibles et critères de réussite.
- `mathracer.css` : styles partagés à l’écran et à l’impression.
- `mathracer-course.js` : correction en ligne, sauvegarde locale des réponses, progression et impression.

Le cours est déclaré dans `src/lib/orbis/catalog/course-paths.ts`, puis dans `src/lib/orbis/catalog/courses.ts`. Les liens vers le jeu utilisent un chemin relatif afin de respecter le sous-dossier de déploiement GitHub Pages.
