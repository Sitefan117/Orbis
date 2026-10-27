# mesurovia

**Rôle du dossier :** moteur, adaptateur, sauvegardes et illustrations propres à Mesurovia.

## Fichiers

- **[`engine-legacy.js](./engine-legacy.js)** — Ancien moteur conservé pour compatibilité.  
  Dépend de : aucun import direct détecté.
- **[`engine-v3-adapter.ts](./engine-v3-adapter.ts)** — Adapte Mesurovia V3 à l’interface TypeScript actuelle.  
  Dépend de : `src/lib/games/mesurovia/engine-legacy.js`.
- **[`memory-game.ts`](./memory-game.ts)** — Crée les associations et mélange les cartes du mini-jeu de mémoire.  
  Dépend de : `engine-v3-adapter.ts` ; utilisé par `src/routes/mesurovia/+page.svelte`.
- **[`progress.ts`](./progress.ts)** — Types et normalisation des profils Mesurovia, y compris les anciennes sauvegardes.  
  Utilisé par : `src/routes/mesurovia/+page.svelte`.
- **[`ActivityIllustration.svelte`](./ActivityIllustration.svelte)** — Neuf petites illustrations vectorielles animées pour les cartes d’activités.  
  Utilisé par : `src/routes/mesurovia/+page.svelte` ; les animations respectent la réduction de mouvement du jeu et du navigateur.
- **[`GameObjectArt.svelte`](./GameObjectArt.svelte)** — Dessins vectoriels animés du gardien, du renard, du coffre, de l’enquêtrice, de l’horloge et des briques.  
  Utilisé par : `src/routes/mesurovia/+page.svelte` pendant les mini-jeux ; les animations respectent aussi la réduction de mouvement du jeu et du navigateur.
