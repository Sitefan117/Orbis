# Classe Numérique locale

Application SvelteKit pour une classe. Les élèves ouvrent le QG, choisissent leur prénom, puis explorent cinq mondes de travail. Les résultats sont enregistrés dans une base SQLite locale. L'enseignant suit la progression depuis un tableau protégé par une session serveur. Tout fonctionne sur une seule machine, sans service externe.

## Prérequis

* Node.js 20 ou plus récent
* npm

## Démarrage rapide

```bash
npm install
TEACHER_PASSWORD="test" npm run dev
```

L'application est disponible sur `http://localhost:5173`. Le serveur de développement écoute aussi sur le réseau local.

Le mode local utilise SvelteKit côté serveur et SQLite. Le déploiement statique historique peut encore être construit avec `ORBIS_DEPLOY_TARGET=static`, mais les codes de mission et le tableau enseignant nécessitent le serveur local ou un futur service distant.

## Pages

1. `/` : QG de la classe, choix du prénom et accès aux mondes
2. `/livrets` : L'Atelier des Livrets, défis de tables de multiplication avec aides visuelles
3. `/geometrie` : Le Défi des Formes, identification, intrus visuels et tri 2D/3D
4. `/calculs` : Le Calcul Décimal, opérations décimales avec ardoise tactique
5. `/numeria` : Les Royaumes de Numéria, quête de numération HarmoS, étoiles et codex
6. `/pcp` : Espace PCP / Orientation, CV, lettre de motivation et projet professionnel
7. `/teacher` : tableau enseignant protégé
8. `/race`, `/mathhunt`, `/conju_lab` et `/shift` : autres jeux compatibles avec les missions enseignant

Les anciennes adresses en `.html` (par exemple `/pcp.html`) sont redirigées automatiquement vers les nouvelles routes.

## Base de données

SQLite via Drizzle ORM. Le fichier est créé automatiquement au premier accès, par défaut ici.

```bash
data/classroom.sqlite
```

Pour choisir un autre fichier, définissez cette variable.

```bash
DATABASE_URL="file:./data/ma_classe.sqlite"
```

Le schéma est appliqué automatiquement au premier démarrage. Pour le créer ou le mettre à jour manuellement, lancez cette commande.

```bash
npm run db:migrate
```

La base utilise le mode WAL et active les clés étrangères. Tables : `students`, `activity_results`, `world_progress`, `teacher_notes`, `teacher_sessions`.

## Accès enseignant

Pour un essai local rapide, un mot de passe en clair suffit.

```bash
TEACHER_PASSWORD="test" npm run dev
```

Pour un usage de classe, générez plutôt un hash.

```bash
TEACHER_PASSWORD_INPUT="mot de passe long" npm run teacher:hash
```

Puis démarrez avec la valeur obtenue. `TEACHER_PASSWORD_HASH` a priorité sur `TEACHER_PASSWORD`.

```bash
TEACHER_PASSWORD_HASH="pbkdf2_sha256$..."
```

La session enseignant dure 8 heures et vit côté serveur dans la table `teacher_sessions`. Si aucune de ces variables n'est définie, la connexion est refusée.

## Codes mission

L'enseignant peut créer une mission depuis `/teacher` ou depuis le menu du jeu. Le code court de six caractères se saisit dans le portail Orbis ; le code direct ajoute le préfixe du jeu : `RACE-`, `LIV-`, `HUNT-`, `CALC-`, `CONJ-` ou `SHIFT-`. Une même configuration réutilise sa mission canonique, tandis que les jetons restent uniques entre les jeux.

Les codes configurent Math Racer, l'Atelier des Livrets, Math Hunt, le Calcul Décimal, Conju Lab et Shift. Ils nécessitent le serveur local : ils ne sont pas disponibles dans le déploiement GitHub Pages purement statique.

## Scripts

* `npm run dev` : serveur de développement
* `npm run check` : vérification des types Svelte et TypeScript
* `npm run build` : construction de l'application
* `npm run preview` : aperçu local du résultat du build
* `npm run db:migrate` : création ou mise à jour du schéma SQLite
* `npm run teacher:hash` : génération d'un hash de mot de passe enseignant

## Serveur construit

L'application est construite avec l'adaptateur Node de SvelteKit. Fixez `ORIGIN` avec la vraie adresse ouverte dans le navigateur : SvelteKit en a besoin pour accepter les formulaires protégés, dont la connexion enseignant.

```bash
npm run build
HOST=127.0.0.1 PORT=3000 ORIGIN=http://127.0.0.1:3000 node build
```

Sur le réseau de classe.

```bash
HOST=0.0.0.0 PORT=3000 ORIGIN=http://ordinateurclasse.local:3000 node build
```

## Variables d'environnement

* `DATABASE_URL` : chemin du fichier SQLite, défaut `file:./data/classroom.sqlite`
* `TEACHER_PASSWORD` : mot de passe enseignant en clair, pour les essais uniquement
* `TEACHER_PASSWORD_HASH` : hash du mot de passe, recommandé en classe
* `TEACHER_PASSWORD_INPUT` : entrée du script `teacher:hash`
* `HOST`, `PORT`, `ORIGIN` : configuration du serveur construit

## Structure du projet

* `src/routes` : pages des mondes, tableau enseignant et point d'API des résultats
* `src/lib/worlds.ts` : définition des cinq mondes
* `src/lib/server/db` : client, schéma et migration SQLite
* `src/lib/server/auth` : hash et vérification du mot de passe enseignant
* `src/lib/client/activity.ts` : envoi des résultats depuis les activités
* `src/hooks.server.ts` : redirection des anciennes adresses `.html`

## Données enregistrées

Chaque activité enregistre le prénom de l'élève, le monde, la mission, le score, le nombre d'erreurs et la date. Le tableau enseignant lit ces données, montre la progression par monde et permet de noter une intervention.

## Technologies

SvelteKit 2, Svelte 5, TypeScript, Vite, Drizzle ORM et SQLite.
