# Orbis

Orbis est un portail pédagogique construit avec SvelteKit, Svelte et TypeScript. Il regroupe des jeux indépendants et des ressources de cours. Les jeux gardent leurs propres règles et moteurs.

## Où le site est hébergé

Le dépôt publie un site statique sur GitHub Pages. Le workflow `.github/workflows/main.yml` installe les dépendances, exécute les contrôles et tests, construit le site, puis publie le dossier `build/`. Aucun serveur ne tourne sur le Mac de l’enseignant.

Le dépôt contient aussi d’anciennes routes API SvelteKit et un stockage SQLite côté serveur. GitHub Pages ne peut pas les exécuter. Les bilans passent donc par un stockage local compatible avec GitHub Pages puis, pour les comptes connectés, par le projet Supabase Orbis. L’Edge Function `orbis-admin` réalise les opérations privilégiées sans exposer de clé secrète au navigateur.

## Démarrer en local

Prérequis : Node.js 20 ou plus récent et npm.

```sh
npm install
npm run dev
```

Pour vérifier les types et composants Svelte :

```sh
npm run check
```

Pour générer la version statique :

```sh
npm run build
```

Pour afficher ce build localement :

```sh
npm run preview
```

Le serveur de développement SvelteKit peut exécuter les routes serveur en local. La base SQLite locale est créée dans `data/classroom.sqlite` au premier accès à ces routes. Ce fonctionnement local n’est pas le backend du site publié sur GitHub Pages.

## Parcours et pages

- `/` : portail Arcade et Cours, alimenté par les catalogues dans `src/lib/orbis/catalog/`.
- `/livrets`, `/geometrie`, `/calculs`, `/numeria`, `/mesurovia`, `/fractionstower2`, `/race`, `/mathhunt`, `/shift`, `/conju_lab` et `/pcp` : jeux et activités autonomes.
- `/teacher` : tableau enseignant connecté aux classes, résultats, sauvegardes et documents PCP Supabase ; il conserve aussi l’import historique des fichiers `.fracsave`.
- `/confidentialite` : notice lisible décrivant les données du pilote et les droits d’export ou de suppression.
- `static/cours/maths/` : cours HTML classés par thème et publiés comme fichiers statiques.

Les anciennes adresses des cours déplacés contiennent de petites redirections vers les nouveaux fichiers.

## Sauvegardes et résultats actuels

Les jeux n’utilisent pas tous le même format de sauvegarde :

- Numéria conserve une progression locale séparée par prénom, sait migrer un ancien format et reprend maintenant la mission active après rechargement sur le même appareil.
- Mesurovia conserve plusieurs profils locaux.
- Race conserve certaines statistiques dans `localStorage`.
- Fraction Tower conserve une progression locale et propose un export/import `.fracsave`.
- PCP conserve localement le CV et la lettre de motivation et les synchronise pour un compte élève connecté ; ces contenus peuvent inclure des renseignements personnels.
- Les treize jeux déposent un bilan local-first. Les jeux compatibles synchronisent également leur sauvegarde et le détail des réponses avec Supabase.

Les clés et formats locaux restent préservés pendant la transition. Le schéma, les politiques RLS et l’Edge Function du pilote sont versionnés dans `supabase/`. L’isolation entre deux enseignants réels reste à valider avant l’usage avec des données réelles.

## Organisation du dépôt

- `src/routes/` : pages et routes API SvelteKit ; les URLs publiques sont conservées.
- `src/lib/orbis/` : catalogue du portail, profil local temporaire et contrats des services communs.
- `src/lib/games/<jeu>/` : moteurs, types, données et sauvegardes propres à chaque jeu. Les sous-dossiers varient selon les besoins du jeu.
- `src/lib/server/` : code Node/SQLite et services serveur locaux.
- `static/` : images, sons, cours et autres fichiers servis tels quels.
- `archives/` : fichiers de jeux conservés comme références, non publiés avec le site.
- `tests/` : contrôles automatisés des moteurs, contenus et structure des routes.
- `docs/` : cartographie, décisions, guide développeur et plan d’évolution.
- `supabase/` : migrations et Edge Function du pilote gratuit connecté.

### Exemples de séparation du code des jeux

Les pages restent responsables de l’affichage et de la séance en cours. Les fichiers de `src/lib/games/` isolent les parties qui peuvent être comprises ou modifiées indépendamment :

- **Shift** : `config.ts` contient les missions, niveaux et unités ; `number-engine.ts` contient les calculs et formats de nombres. La page orchestre l’interface.
- **Racer** : `engine.ts` garde la création des questions ; `progress.ts` suit les faits travaillés ; `audio.ts` gère les sons ; `scene-tools.ts` construit la voiture et les panneaux Three.js.
- **Mesurovia** : `engine-v3-adapter.ts` conserve l’accès au moteur du jeu ; `memory-game.ts` prépare les cartes ; `progress.ts` normalise les profils et anciennes sauvegardes. La page garde le déroulement des parties et l’interface.

Ces modules restent propres à leur jeu. Ils ne créent pas un moteur pédagogique commun. Les détails et dépendances de chaque dossier sont documentés dans son `README.md`.

### Classement des cours

Les cours suivent le chemin court `static/cours/<matiere>/<theme>/<nom>.html` :

- `maths/fractions/complet.html` pour le cahier complet ; `etape-1.html` à `etape-9.html` pour les étapes et `etapes.html` pour les choisir.
- `maths/mesures/reference.html` pour le cours de référence et `maths/mesures/mesurovia/` pour les quatre cahiers.
- `maths/mesures/mesurovia/enseignant/` pour les corrigés, séparés des ressources élèves.
- `maths/geometrie/` pour le carnet et le croquis de solides.

Pour ajouter un document, créer un fichier dans le bon dossier, déclarer son chemin dans `src/lib/orbis/catalog/course-paths.ts`, puis l’inscrire dans `src/lib/orbis/catalog/courses.ts`. Les jeux utilisent la même liste de chemins pour ouvrir leurs cahiers.

## Scripts npm

- `npm run dev` : serveur de développement local.
- `npm run check` : vérification Svelte et TypeScript.
- `npm test` : tests automatiques des moteurs, contenus, routes et sauvegardes locales.
- `npm run build` : build statique publié sur GitHub Pages.
- `npm run preview` : aperçu local du build.
- `npm run db:migrate` : initialise le schéma SQLite local.
- `npm run teacher:hash` : utilitaire de génération de hash de mot de passe enseignant.

Les deux derniers scripts appartiennent au code serveur local ; ils ne créent pas de base ni de comptes sur GitHub Pages.

## Tests

Les commandes `npm run check`, `npm test` et `npm run build` sont décrites dans `tests/README-TESTS.md`. Le workflow GitHub les exécute avant la publication. Voir `docs/ORBiS_ARCHITECTURE.md` pour les limites encore connues.
