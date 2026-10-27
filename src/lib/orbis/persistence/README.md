# persistence

**Rôle du dossier :** stockage local commun et synchronisation distante facultative.

- `local-store.ts` conserve les bilans et sauvegardes dans le navigateur, sans dépendre du réseau.
- `game-services.ts` fournit le contrat minimal de sauvegarde à un jeu sans connaître son moteur.
- `remote-session.ts` conserve temporairement la session distante ouverte par le futur écran de connexion.
- `supabase-rest.ts` traduit les objets Orbis vers les tables Supabase sans exposer la logique aux jeux.
- `sync.ts` vide la file locale lorsque Supabase est configuré, que l’élève est connecté et que le réseau répond.

Les variables publiques attendues sont `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. L’ancienne `PUBLIC_SUPABASE_ANON_KEY` reste acceptée pendant la transition. La clé publiable est visible par conception ; les droits réels sont imposés par l’authentification et les règles RLS. Aucune clé `sb_secret_...` ou `service_role` ne doit être ajoutée au site.

## État de l’intégration

- Sans configuration, tout fonctionne localement sur GitHub Pages.
- Avec une configuration mais sans session élève, les éléments restent dans la file locale.
- Avec une session authentifiée, les événements et la dernière sauvegarde peuvent être transmis aux tables du brouillon SQL dans `supabase/migrations/`.
- Le service sait relire une sauvegarde distante et signale un conflit au lieu de choisir silencieusement entre deux appareils.
- L’écran de connexion par code de classe et code individuel reste à construire : aucune clé secrète ni faux compte n’est embarqué dans le navigateur.

## Exemple pour un jeu existant

```ts
queueGameProgressSnapshot(studentName, 'numeria', existingSave, 1);
```

Cette ligne s’ajoute après la sauvegarde historique du jeu. Elle ne change ni son moteur, ni son format, ni sa capacité à fonctionner hors ligne.
