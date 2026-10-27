# tracking

**Rôle du dossier :** point d’entrée commun utilisé par les jeux pour communiquer avec Orbis.

- `recordGameActivity(...)` enregistre un bilan avec les mêmes champs pour tous les jeux.
- `recordGameProgress(...)` dépose une copie reprenable de l’état propre au jeu.
- Les champs pédagogiques non mesurables restent absents ; ils ne sont jamais inventés.
- Le dossier délègue le stockage et la synchronisation à `persistence/` et ne contient aucune règle de jeu.

Les anciens modules `results/` et `progress/` restent en place comme implémentation interne et pour préserver la compatibilité.
