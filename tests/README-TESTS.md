# Vérifications du dépôt Orbis

À exécuter depuis la racine du dépôt :

```bash
npm run check
npm test
npm run build
```

`npm test` lance `tests/run-smoke.sh`, qui exécute les contrôles existants :

- les moteurs et contenus de Mesurovia ;
- la structure de routes Mesurovia et les destinations du catalogue Orbis ;
- les moteurs de Géométrie, Numéria et ConjuLab ;
- la sauvegarde, la reprise et la migration locale de Numéria.

`npm run check` vérifie TypeScript et Svelte. Le build de production est séparé. Les tests automatiques ne remplacent pas un essai manuel dans les navigateurs et sur les tablettes utilisés en classe.
