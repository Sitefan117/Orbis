# shift

**Rôle du dossier :** Calculs de numération de Shift.

## Fichiers

- **[`config.ts`](./config.ts)** — Niveaux, missions et unités affichés par le jeu.
  Utilisé par : `src/routes/shift/+page.svelte`.
- **[`number-engine.ts`](./number-engine.ts)** — Décompose et formate les nombres selon leurs rangs, y compris la relation affichée pour chaque rang.
  Dépend de : aucun import direct détecté.
- **[`task-generator.ts`](./task-generator.ts)** — Génère les tâches des huit missions à partir de la mission, de la difficulté et de la borne numérique ; dépend de `number-engine.ts` et `config.ts`, sans état d'interface. La page conserve la séance en cours et appelle le générateur à chaque nouvelle question.

Vérifier le générateur avec `node --import tsx tests/shift-task-generator.test.ts`.
