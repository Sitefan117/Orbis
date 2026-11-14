# teacher

**Rôle du dossier :** composants du suivi enseignant commun à Orbis.

- `LocalTrackingPanel.svelte` lit uniquement les bilans conservés dans le navigateur courant, calcule un résumé et permet un export CSV.
- Il dépend de `persistence/local-store.ts` pour les données et de `catalog/games.ts` pour les noms lisibles des jeux.
- `RemoteTeacherDashboard.svelte` lit les classes, résultats, sauvegardes et documents autorisés par les politiques RLS Supabase.
- Les opérations sensibles d’export, suppression, réinitialisation et copie passent par `orbis-admin`.
