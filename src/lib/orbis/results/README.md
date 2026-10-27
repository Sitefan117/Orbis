# results

**Rôle du dossier :** Contrat et envoi des bilans d’activité.

## Fichiers

- **[`client.ts`](./client.ts)** — Enregistre chaque bilan localement, puis demande une synchronisation facultative.
  Dépend de : `contract.ts` et `src/lib/orbis/persistence/`.
- **[`contract.ts](./contract.ts)** — Format partagé des bilans de jeu.
  Dépend de : `src/lib/orbis/catalog/games.ts` — autre dossier.

Un jeu peut fournir seulement l’élève, le jeu, l’activité, le score et le nombre de questions. La notion, la durée, les aides et les familles d’erreurs restent facultatives tant que le jeu ne sait pas les mesurer correctement.
