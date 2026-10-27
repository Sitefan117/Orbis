# conju-lab

**Rôle du dossier :** Contenu et moteur de conjugaison.

## Fichiers

- **[`curriculum.ts](./curriculum.ts)** — Temps verbaux disponibles selon les niveaux.  
  Dépend de : `src/lib/games/conju-lab/types.ts`.
- **[`question-engine.ts](./question-engine.ts)** — Conjugue, génère les questions et analyse les réponses.  
  Dépend de : `src/lib/games/conju-lab/curriculum.ts`, `src/lib/games/conju-lab/verbs.ts`, `src/lib/games/conju-lab/types.ts`.
- **[`types.ts](./types.ts)** — Types partagés par les données et le moteur.  
  Dépend de : aucun import direct détecté.
- **[`verbs.ts](./verbs.ts)** — Banque de verbes et de formes conjuguées.  
  Dépend de : `src/lib/games/conju-lab/types.ts`.
