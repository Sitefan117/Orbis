# play

**Rôle du dossier :** Écran jouable de Fraction Tower.

## Fichiers

Les arrière-plans des neuf étages sont chargés depuis [`static/fractionstower2/floors/`](../../../../static/fractionstower2/floors/README.md), et les personnages depuis [`static/fractionstower2/characters/`](../../../../static/fractionstower2/characters/README.md). Les positions des personnages et des accès suivent les décors ; les sauvegardes gardent le même format. Le héros alterne ses deux poses uniquement pendant la marche. Les quatre personnages ont chacun une alcôve identifiée ; l’escalier nord reste bloqué jusqu’à la victoire contre le boss, et le piédestal au parchemin permet de saisir le code d’un des neuf étages.

- **[`+page.svelte](./+page.svelte)** — Écran principal de la partie Fraction Tower.  
  Dépend de : `src/lib/games/fractionstower2/game/GameState.svelte.ts` — autre dossier, `src/lib/games/fractionstower2/game/CollisionEngine.ts` — autre dossier, `src/lib/games/fractionstower2/game/InteractionEngine.ts` — autre dossier, `src/lib/games/fractionstower2/game/FloorManager.ts` — autre dossier, `src/lib/games/fractionstower2/components/exercises/ActivityModal.svelte` — autre dossier, `src/lib/games/fractionstower2/components/exercises/BossBattle.svelte` — autre dossier, `src/lib/games/fractionstower2/components/exercises/BossFloor1.svelte` — autre dossier, `src/lib/games/fractionstower2/components/course/CourseViewer.svelte` — autre dossier, `src/lib/games/fractionstower2/persistence/LanguageManager.ts` — autre dossier, `src/lib/games/fractionstower2/persistence/SaveManager.ts` — autre dossier, `src/lib/games/fractionstower2/audio/AudioManager.ts` — autre dossier, `src/lib/games/fractionstower2/persistence/ProgressManager.ts` — autre dossier, `svelte` (dépendance npm).
