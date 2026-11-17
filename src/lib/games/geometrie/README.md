# geometrie

**Rôle du dossier :** Figures et questions de géométrie.

## Fichiers

- **[`ConstructionLab.svelte`](./ConstructionLab.svelte)** — Grille tactile et accessible pour construire une figure en 6H, 7H et 8H.
- **[`construction.ts`](./construction.ts)** — Consignes, réponse unique et correction exacte des trois constructions.

- **[`FigureDrawing.svelte](./FigureDrawing.svelte)** — Dessine les figures en SVG.  
  Dépend de : `src/lib/games/geometrie/types.ts`.
- **[`figures.ts](./figures.ts)** — Catalogue des figures géométriques.  
  Dépend de : `src/lib/games/geometrie/types.ts`.
- **[`question-engine.ts](./question-engine.ts)** — Génère et vérifie les questions.  
  Dépend de : `src/lib/games/geometrie/figures.ts`, `src/lib/games/geometrie/types.ts`.
- **[`types.ts](./types.ts)** — Types des figures et questions.  
  Dépend de : aucun import direct détecté.
