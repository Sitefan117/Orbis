# Guide développeur Orbis

Guide provisoire mis à jour le 27 octobre 2026. Le stockage local commun et le client de synchronisation Supabase sont présents ; le projet distant et la connexion par codes ne sont pas encore configurés. Ne copie pas de clé secrète dans le code du navigateur.

## Lancer et contrôler le projet

1. Installer Node.js 20 ou plus récent et npm.
2. À la racine, exécuter `npm install` puis `npm run dev`.
3. Pour contrôler les types : `npm run check`.
4. Pour produire le site statique : `npm run build`.
5. Les tests existants sont décrits dans `tests/README-TESTS.md`. Les tests de moteur se lancent avec les commandes qui y sont indiquées.

Le workflow `.github/workflows/main.yml` publie le résultat de build sur GitHub Pages. Les routes `src/routes/api/` nécessitent un serveur et ne deviennent pas des fonctions GitHub Pages.

## Ajouter un jeu à l’Arcade

1. Créer `src/routes/<identifiant>/+page.svelte` pour la page du jeu.
2. Ajouter le moteur et ses types propres au jeu sous `src/lib/games/<jeu>/` si la logique mérite d’être séparée de l’écran. Chaque jeu choisit ses propres sous-dossiers.
3. Ajouter une entrée au catalogue `worlds` dans `src/lib/orbis/catalog/games.ts` : `id`, `title`, `subtitle`, `route`, `emoji`, `color`, `subject` et `status`.
4. Ajouter une image à `static/images/games/` si le portail l’utilise et référencer son chemin au bon endroit dans `src/routes/+page.svelte`.
5. Vérifier que le lien ouvre la page avec le préfixe de production et que le jeu reste fonctionnel sans réseau si nécessaire.

Erreurs fréquentes : oublier d’enregistrer le jeu dans `games.ts`, coder en dur l’URL racine au lieu de tenir compte de `base`, ou rendre son moteur dépendant de l’authentification.

## Ajouter un cours au catalogue Cours

1. Créer le document sous `static/cours/<matiere>/<theme>/`, par exemple `maths/fractions/complet.html` ou `maths/mesures/mesurovia/sentiers.html`.
2. Ajouter le chemin une seule fois dans `src/lib/orbis/catalog/course-paths.ts`, puis ajouter une entrée à `courses` dans `src/lib/orbis/catalog/courses.ts` avec un `id` court et stable, un `title` lisible, `subject`, `domain`, `description`, `level`, `isInteractive` et `href`.
3. Vérifier que le chemin du module existe réellement dans `static/` et que le lien fonctionne dans le build GitHub Pages.

## Ajouter une page ou un composant partagé

- Une page routée va dans `src/routes/<route>/+page.svelte`.
- Un composant d’usage général va dans `src/lib/` seulement si plusieurs pages ont un besoin réellement commun.
- Un composant ou moteur propre à un jeu reste sous `src/lib/games/<jeu>/`.
- Les styles généraux sont dans `src/app.css`; les styles propres à une page peuvent rester dans son fichier Svelte.

## Ajouter une compétence ou des exercices

1. Placer le contenu et les types auprès du jeu concerné, par exemple `src/lib/games/numeria/curriculum.ts` et `question-engine.ts`.
2. Décrire le type d’exercice et les données pédagogiques dans les types de ce jeu.
3. Garder génération, validation et progression dans le périmètre du jeu.
4. Lancer les tests pertinents du moteur dans `tests/` et `npm run check`.

Ne transforme pas une ressemblance visuelle entre deux exercices en moteur commun sans vérifier que les règles et les résultats sont aussi communs.

## Transmettre un résultat à Orbis

Le point d’entrée public est `src/lib/orbis/tracking/client.ts`. Tous les jeux intégrés utilisent `recordGameActivity` et `recordGameProgress` avec les mêmes noms de champs. L’implémentation sous `results/` et `persistence/` écrit d’abord dans le navigateur puis synchronise si Supabase, le réseau et une session authentifiée sont disponibles. GitHub Pages n’a donc pas besoin d’exécuter une route serveur.

Le prénom transmis dans l’URL reste un nom d’affichage local et non une identité sécurisée. La liste minimale des données est documentée dans `ORBiS_SUIVI_PEDAGOGIQUE.md`.

## Sauvegarder et reprendre une progression

Des exemples actuels existent dans `src/lib/games/numeria/progress.ts`, `src/lib/games/fractionstower2/persistence/ProgressManager.ts`, `SaveManager.ts`, et les modules de Mesurovia et Race. Ces formats ont des clés et règles différentes. Numéria sait reprendre une mission sans régénérer ses questions.

Avant de modifier un jeu :

1. Repérer sa clé `localStorage` ou son fichier d’export et les fonctions qui lisent/écrivent.
2. Décrire le type de données et le moment où l’élève doit pouvoir reprendre.
3. Conserver le format existant pendant la transition ; ne pas supprimer de clé.
4. Si une migration est approuvée, copier vers le nouveau format, relire et comparer les données, puis seulement documenter le traitement de l’ancien format.

L’interface de persistance commune est documentée dans `ORBiS_ARCHITECTURE.md` et implémentée sous `src/lib/orbis/persistence/`. Pour une transition sans risque, appeler `queueGameProgressSnapshot` après la sauvegarde historique plutôt que de la remplacer immédiatement.

## Préparer la future identité élève

Le portail utilise aujourd’hui un prénom stocké en `sessionStorage` et le transmet comme paramètre `eleve`. C’est un nom d’affichage, pas un identifiant de compte. Les comptes prévus seront gérés par l’enseignant ; leur méthode de connexion, la gestion des classes et la récupération d’accès restent à décider.

Ne stocke aucune clé administrateur dans `src/` ou `static/`. Les clés publiables peuvent être présentes dans un frontend si les permissions serveur/RLS sont correctement configurées ; les clés secrètes doivent rester dans un environnement serveur sécurisé.

