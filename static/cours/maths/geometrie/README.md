# Géométrie

**Rôle du dossier :** supports HTML complémentaires aux jeux de géométrie.

| Fichier | Rôle et dépendances |
|---|---|
| `carnet.html` | Carnet complet de géométrie, modules 1 à 5 ; document autonome. Le catalogue l’associe à `coursePaths.geometry.notebook`. |
| `croquis.html` | Module autonome pour construire un croquis ; le catalogue l’associe à `coursePaths.geometry.sketch`. |
| `aide-memoire.html` | Fiche imprimable 6H–8H avec vocabulaire, figures, solides et méthode de justification ; `coursePaths.geometry.aideMemoire`. |
| `aide-memoire-6H.pdf`, `aide-memoire-7H-8H.pdf` | Versions A4 prêtes à distribuer, générées avec `scripts/build-nexus-memory-pdf.py`. |

Les deux chemins de catalogue sont définis dans `src/lib/orbis/catalog/course-paths.ts` et les fiches visibles dans `src/lib/orbis/catalog/courses.ts`.
