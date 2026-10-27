# exercises

**Rôle du dossier :** Cours, entraînements et combats de boss.

## Fichiers

- **[`ActivityModal.svelte](./ActivityModal.svelte)** — Choisit l’activité et transmet le résultat au jeu.  
  Dépend de : `src/lib/games/fractionstower2/components/exercises/IntroCourse.svelte`, `src/lib/games/fractionstower2/components/exercises/TrainingSession.svelte`, `src/lib/games/fractionstower2/components/exercises/BossBattle.svelte`, `src/lib/games/fractionstower2/persistence/ProgressManager.ts` — autre dossier, `src/lib/games/fractionstower2/audio/AudioManager.ts` — autre dossier, `svelte` (dépendance npm).
- **[`BossBattle.svelte](./BossBattle.svelte)** — Combat de boss avec questions, phases, aides après erreur et sélection multiple de schémas fractionnaires.  
  Dépend de : `src/lib/games/fractionstower2/audio/AudioManager.ts`, `src/lib/games/fractionstower2/components/fraction/FractionBar.svelte`, `VisualFractionModel.svelte` et `src/lib/games/fractionstower2/engines/ExerciseGenerator.ts` — autres dossiers.
- **[`BossFloor1.svelte](./BossFloor1.svelte)** — Combat pédagogique du premier étage.  
  Dépend de : `src/lib/games/fractionstower2/audio/AudioManager.ts`, `src/lib/games/fractionstower2/components/fraction/FractionBar.svelte`, `VisualFractionModel.svelte` et `src/lib/games/fractionstower2/engines/ExerciseGenerator.ts` — autres dossiers.
- **[`IntroCourse.svelte](./IntroCourse.svelte)** — Leçon interactive sur les fractions.  
  Dépend de : aucun import direct détecté.
- **[`TrainingSession.svelte](./TrainingSession.svelte)** — Séance d’entraînement, aides adaptées au type de question et vérification des réponses.  
  Dépend de : `src/lib/games/fractionstower2/engines/ExerciseGenerator.ts`, `src/lib/games/fractionstower2/components/fraction/VisualFractionModel.svelte` et `src/lib/games/fractionstower2/audio/AudioManager.ts` — autres dossiers.
