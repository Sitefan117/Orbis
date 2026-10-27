# progress

**Rôle du dossier :** Contrat de progression commun minimal.

## Fichiers

- **[`contract.ts](./contract.ts)** — Contrat minimal de progression d’un jeu.  
  Dépend de : aucun import direct détecté.

L’adaptateur concret se trouve dans `src/lib/orbis/persistence/game-services.ts`. Numéria et Fractions Tower envoient actuellement une copie de leur sauvegarde existante vers cet adaptateur ; leurs anciennes clés locales restent actives.
