# race

**Rôle du dossier :** Questions et progression de Racer.

## Fichiers

- **[`audio.ts`](./audio.ts)** — Musique et effets sonores synthétisés par Racer.  
  Utilisé par : `src/routes/race/+page.svelte`, qui lui transmet les réglages sonores.
- **[`scene-tools.ts`](./scene-tools.ts)** — Construit la voiture et les panneaux de réponse Three.js.  
  Dépend de : `engine.ts` pour le type d’option ; le module Three.js lui est transmis au lancement du jeu.
- **[`engine.ts](./engine.ts)** — Génère les questions et choix de Racer.  
  Dépend de : aucun import direct détecté.
- **[`progress.ts](./progress.ts)** — Suit les réussites pour reproposer les notions fragiles.  
  Dépend de : `src/lib/games/race/engine.ts`.
