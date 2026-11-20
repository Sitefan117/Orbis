# Pilote Supabase gratuit Orbis

Ce dossier versionne le schéma SQL et l’Edge Function du pilote Orbis. Le client
utilise un projet Supabase lorsqu’une URL, une clé publiable et une session
élève sont disponibles. Le dépôt ne crée pas de projet ou de compte distant.

## Données prévues

- Un enseignant peut posséder plusieurs classes.
- Une classe contient plusieurs profils élèves.
- Chaque jeu garde son propre format de sauvegarde dans un petit objet JSON.
- Les résultats sont conservés comme des événements séparés : activité, date, score, nombre d'erreurs et, si le jeu sait les fournir, familles d'erreurs.
- La migration `202611130003_orbis_details_and_pcp.sql` ajoute des traces structurées de réponses (question, réponse, attendu, juste/faux, essais) et une table séparée pour les brouillons CV/lettre PCP.

## Protections du schéma versionné

- L'élève ne peut lire et modifier que ses propres sauvegardes.
- L'élève peut ajouter ses résultats, mais ne peut ni les modifier ni les supprimer depuis le navigateur.
- L'enseignant ne peut lire que les élèves inscrits à ses classes.
- La création des comptes élèves, des profils et des inscriptions doit passer par une fonction serveur sécurisée. La clé administrateur Supabase ne doit jamais apparaître dans le site GitHub Pages.
- Un identifiant d'événement généré par le jeu rend possible une synchronisation répétée sans doubler le même résultat.

## Validation du pilote

Le SQL et les fonctions ont été utilisés sur un projet de test. La connexion
par identifiant court, la création d’élèves et la réinitialisation des mots de
passe sont implémentées. Les tests locaux couvrent plusieurs profils, mais ne
vérifient pas les politiques RLS déployées. L’isolation entre deux enseignants
et deux classes distincts reste obligatoire avant toute donnée réelle.

Le plan gratuit est la seule cible prévue. Le site doit continuer à fonctionner localement quand le réseau est absent ou quand le service gratuit est en pause. Les sauvegardes distantes devront pouvoir être exportées manuellement.

## Mise en place

1. Créer un projet de test Supabase Free, sans y mettre de noms complets ni de travaux d'élèves.
2. Appliquer **dans l’ordre** les fichiers de `migrations/`, y compris
   `202611200001_orbis_private_rls_helpers.sql`. Cette dernière migration
   déplace les aides RLS dans `orbis_private` et fixe le chemin de recherche des
   fonctions privilégiées. Elle n’est pas appliquée automatiquement au projet distant.
3. Tester les règles d'accès avec deux enseignants et deux classes fictifs.
4. Déployer `functions/orbis-admin/index.ts` pour créer les élèves, réinitialiser leur mot de passe et copier volontairement une sauvegarde entre deux élèves du même enseignant.
5. Configurer les deux variables publiques décrites dans `docs/ORBiS_SUPABASE_INSTALLATION.md`.
6. Vérifier la reprise locale, la synchronisation distante et les conflits avec les comptes fictifs avant toute utilisation en classe.
7. Vérifier que les migrations réellement appliquées correspondent aux fichiers
   versionnés avant d’activer une fonctionnalité qui en dépend.


## Carte du dossier

- [`migrations/`](./migrations/README.md) décrit le schéma versionné et son ordre d’application.
- [`../docs/ORBiS_SUPABASE_INSTALLATION.md`](../docs/ORBiS_SUPABASE_INSTALLATION.md) explique les opérations restantes sans vocabulaire serveur inutile.
