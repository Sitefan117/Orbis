# game

**Rôle du dossier :** État, déplacements, collisions et interactions.

## Fichiers

- **[`CollisionEngine.ts](./CollisionEngine.ts)** — Détecte les collisions du joueur.  
  Dépend de : `src/lib/games/fractionstower2/types/world.ts` — autre dossier.
- **[`FloorManager.ts](./FloorManager.ts)** — Fournit les limites, accès et positions propres à chaque étage.  
  Dépend de : `src/lib/games/fractionstower2/types/world.ts` — autre dossier, `src/lib/games/fractionstower2/data/curriculum.ts` — autre dossier.
- **[`GameState.svelte.ts](./GameState.svelte.ts)** — Stocke l’état réactif de la partie.  
  Dépend de : `src/lib/games/fractionstower2/types/world.ts` — autre dossier, `src/lib/games/fractionstower2/game/FloorManager.ts`.
- **[`InteractionEngine.ts](./InteractionEngine.ts)** — Détecte les zones interactives proches.  
  Dépend de : `src/lib/games/fractionstower2/types/world.ts` — autre dossier.
