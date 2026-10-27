# Pilote Supabase gratuit Orbis

Ce dossier contient une **première proposition de schéma SQL**, pas une base déjà créée ou reliée au site. Elle ne crée aucun compte et ne contient aucune donnée réelle.

## Données prévues

- Un enseignant peut posséder plusieurs classes.
- Une classe contient plusieurs profils élèves.
- Chaque jeu garde son propre format de sauvegarde dans un petit objet JSON.
- Les résultats sont conservés comme des événements séparés : activité, date, score, nombre d'erreurs et, si le jeu sait les fournir, familles d'erreurs.
- Les réponses détaillées, les CV et les lettres de motivation ne sont pas enregistrés par ce schéma.

## Protections prévues

- L'élève ne peut lire et modifier que ses propres sauvegardes.
- L'élève peut ajouter ses résultats, mais ne peut ni les modifier ni les supprimer depuis le navigateur.
- L'enseignant ne peut lire que les élèves inscrits à ses classes.
- La création des comptes élèves, des profils et des inscriptions doit passer par une fonction serveur sécurisée. La clé administrateur Supabase ne doit jamais apparaître dans le site GitHub Pages.
- Un identifiant d'événement généré par le jeu rend possible une synchronisation répétée sans doubler le même résultat.

## Limites et étape de validation

Le SQL doit être appliqué à un projet de test vide et vérifié avec au minimum deux comptes élèves, deux enseignants et des classes séparées avant toute donnée réelle. Aucun service Supabase n'a encore été configuré. La connexion par identifiant court et code personnel ainsi que les fonctions de création/réinitialisation des comptes restent à implémenter.

Le plan gratuit est la seule cible prévue. Le site doit continuer à fonctionner localement quand le réseau est absent ou quand le service gratuit est en pause. Les sauvegardes distantes devront pouvoir être exportées manuellement.

## Mise en place future

1. Créer un projet de test Supabase Free, sans y mettre de noms complets ni de travaux d'élèves.
2. Appliquer la migration `migrations/202610250001_orbis_free_pilot.sql`.
3. Tester les règles d'accès avec les identités de test décrites ci-dessus.
4. Ajouter ensuite les fonctions sécurisées pour que l'enseignant crée et réinitialise des comptes élèves.
5. Brancher un seul jeu pilote, puis vérifier la reprise locale et la synchronisation avant d'intégrer les autres jeux.


## Carte du dossier

- [`migrations/`](./migrations/README.md) contient le SQL proposé pour un pilote futur.
- Cette proposition n’est pas configurée ni appelée par l’application.
