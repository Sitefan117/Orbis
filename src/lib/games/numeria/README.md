# numeria

**Rôle du dossier :** Progression, sauvegarde et questions de Numéria.

## Fichiers

- **[`curriculum.ts](./curriculum.ts)** — Décrit les royaumes et missions.  
  Dépend de : `src/lib/games/numeria/types.ts`.
- **[`progress.ts](./progress.ts)** — Sauvegarde et migration locale de la progression.  
  Dépend de : `src/lib/games/numeria/types.ts`, `src/lib/games/numeria/curriculum.ts`.
- **[`question-engine.ts](./question-engine.ts)** — Génère les exercices et vérifie les réponses.  
  Dépend de : `src/lib/games/numeria/types.ts`, `src/lib/games/numeria/curriculum.ts`.
- **[`types.ts](./types.ts)** — Types partagés par le contenu et le moteur.  
  Dépend de : aucun import direct détecté.
