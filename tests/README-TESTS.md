# Vérifications du dépôt Orbis

À exécuter depuis la racine du dépôt :

```bash
npm run check
npm test
npm run build
```

`npm test` lance `tests/run-smoke.sh`. Ce script est la liste à jour des tests
exécutés : moteurs et contenus des jeux, routes et navigation, profils et
sauvegardes multi-élèves, exports enseignant et simulations pédagogiques.
Le générateur de Shift est testé pour chaque mission et chaque difficulté.
Il comprend notamment `orbis-result-export.test.ts`, qui vérifie que les
valeurs pouvant être interprétées comme des formules restent du texte en CSV.

Les politiques RLS et les fonctions SQL nécessitent en plus un essai sur un
projet Supabase de test avec deux enseignants et deux classes distinctes.
`npm test` ne se connecte pas à la base distante et ne valide pas ces droits.

`npm run check` vérifie TypeScript et Svelte. Le build de production est séparé. Les tests automatiques ne remplacent pas un essai manuel dans les navigateurs et sur les tablettes utilisés en classe.
