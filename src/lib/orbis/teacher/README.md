# teacher

**Rôle du dossier :** composants du suivi enseignant commun à Orbis.

- `LocalTrackingPanel.svelte` lit uniquement les bilans conservés dans le navigateur courant, calcule un résumé et permet un export CSV.
- Il dépend de `persistence/local-store.ts` pour les données et de `catalog/games.ts` pour les noms lisibles des jeux.
- Il ne remplace pas encore un véritable compte enseignant : Supabase sera nécessaire pour réunir plusieurs appareils.
