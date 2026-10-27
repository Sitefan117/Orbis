# Architecture Orbis — état du dépôt et cible proposée

Audit initial : 25 octobre 2026 ; refactor de l’arborescence : 26 octobre 2026. Ce document décrit le dépôt inspecté et une cible à valider. Il ne signifie pas que le service distant est déjà installé.

## Résumé

Orbis est publié comme site statique sur GitHub Pages. La proposition est de conserver ce mode de publication, de laisser chaque jeu autonome et d’ajouter, si la proposition est validée, un service distant appelé depuis le navigateur pour les comptes, les résultats et les sauvegardes. Le navigateur doit conserver un mode local lorsque le réseau ou le service distant est indisponible.

Le choix du moteur pédagogique reste celui de chaque jeu. Le contrat commun décrit seulement des services facultatifs : identité transmise à une activité, sauvegarde/reprise et transmission de résultats.

## Cartographie actuelle

| Emplacement | Responsabilité observée |
| --- | --- |
| `src/routes/` | Pages SvelteKit pour l’accueil, les jeux, l’enseignant et les API. |
| `src/lib/orbis/catalog/` | Catalogues du portail : jeux de l’Arcade et cours. |
| `src/lib/orbis/identity/local-student.ts` | Nom d’élève affiché et portée locale temporaire ; ce nom n’est pas une authentification. |
| `src/lib/orbis/results/` | Contrat commun des rapports et client d’envoi actuel vers l’API locale. |
| `src/lib/orbis/progress/` | Contrat facultatif de sauvegarde, sans fournisseur distant connecté. |
| `src/lib/games/<jeu>/` | Code propre à chaque jeu. Les dossiers internes varient selon les besoins pédagogiques. |
| `src/lib/server/` | Écriture SQLite avec Drizzle, résultats et session enseignant. Ces modules supposent un environnement serveur. |
| `static/` | Images, audio et ressources HTML utilisées comme fichiers statiques. |
| `data/` | Emplacement par défaut de la base SQLite ; ignoré par Git. |
| `.github/workflows/main.yml` | Compilation et publication du dossier `build/` sur GitHub Pages après un push sur `main`. |
| `svelte.config.js` | Adaptateur statique, sortie dans `build/`, base de chemin de production `/ma-classeV3`. |

### Arborescence après refactor

```text
src/
  routes/                    URLs et écrans du site, conservés
  lib/
    orbis/
      catalog/               Catalogue Arcade et Cours
      identity/              Profil local temporaire
      results/               Contrat et envoi des bilans
      progress/              Contrat futur de sauvegarde facultative
    games/
      calculs/               Génération des exercices décimaux
      conju-lab/             Moteur et données de conjugaison
      fractionstower2/       Composants, moteur et sauvegardes autonomes
      geometrie/             Figures, types et questions
      livrets/               Génération des questions de multiplication
      mathhunt/              Moteur Canvas et questions
      mesurovia/             Adaptateur et moteur Mesurovia
      numeria/               Programme, moteur et progression
      pcp/                   Types des formulaires PCP
      race/                  Questions et progression locale de Race
      shift/                 Règles numériques de Shift
    server/                  API/SQLite locale, non exécutée par GitHub Pages
```

Les pages de `routes/` assemblent les écrans. Les jeux ne partagent que les services Orbis dont ils ont besoin et gardent leurs règles, moteurs, composants et sauvegardes propres.

### Routes principales

- `/` : portail Arcade et Cours ; les listes proviennent de `src/lib/orbis/catalog/games.ts` et `courses.ts`.
- Routes de jeux : `/livrets`, `/geometrie`, `/calculs`, `/numeria`, `/mesurovia`, `/fractionstower2`, `/race`, `/mathhunt`, `/shift`, `/conju_lab` et `/pcp`.
- `/teacher` : import local de sauvegardes `.fracsave` pour le tableau présent dans cette page.
- `/api/activity-results` : route POST SvelteKit qui écrit les rapports dans SQLite.
- `/api/chat` : route serveur de chat.

Les cours HTML sont regroupés sous `static/cours/<matiere>/<theme>/` et catalogués dans `src/lib/orbis/catalog/courses.ts`. Les anciennes adresses des fichiers déplacés restent accessibles par de petites redirections. Les corrigés Mesurovia sont rangés sous `enseignant/` et ne sont pas proposés dans le catalogue élève.

## Circulation actuelle des données

1. La page d’accueil lit le prénom d’élève depuis `sessionStorage` (clé `nomEleve`) et le transmet aux pages par le paramètre `eleve`.
2. Certaines activités appellent `src/lib/orbis/results/client.ts`, qui envoie le prénom affiché, le jeu, la mission, le score et d’autres champs à `/api/activity-results`.
3. Cette route valide les champs et appelle `recordActivityResult`; SQLite conserve élèves, résultats, agrégats de progression, notes et sessions enseignant.
4. Les jeux qui ont une reprise locale conservent leurs formats indépendants dans `localStorage`; Fraction Tower peut aussi exporter/importer des fichiers `.fracsave`.

La plupart des données locales sont propres à un jeu. La progression de Numéria est séparée par prénom, sait migrer une ancienne clé et contient désormais une sauvegarde validée de la mission active. Mesurovia conserve plusieurs profils dans une structure locale. Race utilise une clé qui dépend du profil. Fraction Tower sépare maintenant les nouvelles sauvegardes par nom si un profil est choisi ; sans nom, l’ancienne clé globale reste utilisée. PCP sépare aussi ses nouveaux brouillons par nom lorsqu’un profil est choisi. Les anciennes sauvegardes globales de ces deux jeux sont conservées sans attribution automatique, car leur propriétaire est inconnu.

### Inventaire rapide par activité

| Jeu/activité | État constaté dans le dépôt | Reprise d’une partie |
| --- | --- | --- |
| Livrets | Envoie un rapport vers l’API de résultats. | Pas de sauvegarde de session repérée. |
| Géométrie | Envoie un rapport vers l’API ; son identifiant `geometrie` est reconnu par le type `WorldId`. | Pas de sauvegarde de session repérée. |
| Calculs | Envoie un rapport vers l’API de résultats. | Pas de sauvegarde de session repérée. |
| Numéria | Sauvegarde locale par nom, migration héritée, progression et mission active ; envoie aussi un rapport. | Reprise au même royaume, à la même question, avec réponse, essais, indice et résultats intermédiaires. Reste limitée à ce navigateur jusqu’à la synchronisation distante. |
| Mesurovia | Sauvegarde locale versionnée avec profils et migration d’une ancienne clé. | Progression de jeu conservée ; état exact de session à détailler. |
| Fraction Tower | Nouvelles progressions locales séparées par nom de profil, plus export/import `.fracsave`. L’ancienne clé globale reste accessible sans profil. | Progression conservée ; les anciennes données globales ne sont pas attribuées automatiquement. |
| Race | Statistiques locales de faits mathématiques par profil. | Statistiques conservées ; reprise d’une course non repérée. |
| PCP | CV et lettre enregistrés localement et séparés par nom de profil pour les nouveaux brouillons ; anciennes clés conservées sans attribution automatique. | Brouillons conservés. Ces documents peuvent contenir des données personnelles et ne doivent pas être synchronisés par défaut sans décision explicite. |
| ConjuLab | Envoie maintenant les champs attendus par le client de résultats. Le destinataire `/api` reste indisponible sur GitHub Pages. | Aucun stockage de session déclaré dans la page. |
| Shift | Aucune sauvegarde ou transmission de résultat repérée dans la page. | Pas de reprise repérée. |
| Math Hunt | Aucune sauvegarde ou transmission de résultat repérée dans la page. | Pas de reprise repérée. |

Ces constats sont un inventaire du code, pas une décision sur les mesures qui doivent être collectées. En particulier, le temps, les réponses détaillées et les aides utilisées ne sont pas déclarés comme besoins universels.

## Constat de déploiement

GitHub Pages sert des fichiers statiques. Le workflow publie uniquement `build/`; il ne démarre pas de serveur Node et ne conserve pas une base SQLite. Les routes API et modules SQLite présents dans le dépôt ne peuvent donc pas être exécutés par GitHub Pages. Le README a été corrigé pour expliquer cette limite.

Au contrôle du 25 octobre 2026, `npm run check`, `npm test` et `npm run build` passent. Le build produit encore un avertissement de bundle JavaScript supérieur à 500 kB. Le workflow GitHub exécute maintenant ces trois commandes avant publication.

`npm test` rassemble les tests des moteurs, la structure des routes, la navigation, les illustrations et les sauvegardes locales. Les scripts Mesurovia et Numéria ont été adaptés pour lancer correctement les moteurs existants dans leur contexte navigateur/CommonJS ; aucune mécanique pédagogique n’a été changée pour cela.

La cible proposée garde GitHub Pages pour l’interface et utilise un service hébergé séparé pour les données. Aucun ordinateur personnel n’a besoin de rester allumé.

## Contrat minimal proposé

Les jeux échangent un identifiant d’élève opaque et un identifiant de jeu, jamais un prénom comme preuve d’identité. Ils peuvent enregistrer un état propre au jeu et émettre des résultats structurés. Le type de progression reste contrôlé par le jeu.

```ts
type SaveKey = { studentId: string; gameId: string };
type SaveRecord<T> = {
  state: T;
  formatVersion: number;
  updatedAt: string;
  revision: number;
};
type OrbisError = 'offline' | 'unauthorized' | 'invalid-data' | 'conflict' | 'storage-unavailable' | 'remote-unavailable';
type Result<T> = { ok: true; value: T } | { ok: false; error: OrbisError; message?: string };

type ActivityResultInput = {
  eventId: string; // créé une seule fois et réutilisé aux tentatives de synchronisation
  activityId: string;
  skillId?: string;
  correct: number;
  total: number;
  errorCount?: number;
  errorFamilies?: string[];
  hintsUsed?: number;
  durationSeconds?: number;
};

interface OrbisGameServices<TProgress> {
  loadProgress(): Promise<Result<SaveRecord<TProgress> | null>>;
  saveProgress(state: TProgress, formatVersion: number): Promise<Result<SaveRecord<TProgress>>>;
  recordResult(input: ActivityResultInput): Promise<Result<{ eventId: string }>>;
}
```

Orbis crée un service lié à l’identité de l’élève et au jeu courant ; le jeu ne passe donc ni prénom ni identifiant de destinataire. L’implémentation ajoute la date. `eventId` est généré au moment du résultat puis gardé dans la file locale jusqu’à confirmation distante : renvoyer le même résultat n’en crée pas un deuxième. Les détails pédagogiques restent facultatifs ; un jeu n’envoie que ce qu’il sait mesurer de façon fiable. `formatVersion` permet au jeu de faire évoluer sa sauvegarde sans imposer la même structure aux autres jeux.

### Modèle de données distant proposé

Le schéma ci-dessous est une proposition de travail pour le pilote Supabase gratuit ; aucune table n’a été créée dans un projet distant. Un brouillon SQL avec RLS se trouve dans `supabase/migrations/202610250001_orbis_free_pilot.sql` dans le dépôt local. Il reste à relire et tester avec des comptes fictifs avant toute donnée réelle.

- **Compte élève** : identifiant Auth stable et opaque. Profil Orbis séparé avec seulement les champs d’affichage et de classe qui sont validés.
- **Classe et inscription** : classe rattachée à un enseignant ; appartenance des comptes élèves à la classe.
- **Sauvegarde de jeu** : une ligne par élève et par jeu, avec version du format, JSON du jeu, numéro de révision et date. Le contenu JSON appartient au jeu ; le service commun ne l’interprète pas.
- **Résultat d’activité** : événement append-only avec identifiant unique, élève, jeu, activité/compétence si renseignée, date, score, total, nombre d’erreurs et familles d’erreurs si disponibles. L’identifiant unique permet de renvoyer un événement hors ligne sans créer de doublon.
- **Données à exclure par défaut** : réponses rédigées, traces complètes de clics, documents de PCP (CV et lettres), et renseignements non nécessaires à un indicateur enseignant validé.

### Première version utile du tableau enseignant

Pour commencer, le tableau afficherait seulement :

1. **Élève et classe** : nom d’affichage choisi pour la classe et identifiant interne opaque.
2. **Où en est l’élève** : jeux commencés, dernière activité et dernière sauvegarde disponible.
3. **Ce qu’il a fait** : activité, date, score et nombre de questions.
4. **Taux de réussite** : réponses correctes divisées par le nombre de questions, avec la période visible ; ce taux ne doit pas confondre différentes activités ou tentatives.
5. **Erreurs** : nombre d’erreurs et catégories d’erreurs uniquement lorsque le jeu peut les identifier clairement.
6. **Reprise** : dernière sauvegarde par jeu, distincte de l’historique des résultats.

La durée et l’usage des aides peuvent attendre. Les réponses libres, le détail de chaque réponse, les traces de clics et les CV/lettres de PCP sont exclus par défaut. Cette première liste est une proposition pratique à ajuster après avoir vu un tableau d’exemple ; elle n’oblige pas chaque jeu à produire toutes ces données.

Les données d’un élève seraient accessibles à cet élève et à l’enseignant de sa classe selon des règles RLS ; aucune page cliente ne décide seule de ces droits.

### Fonctionnement hors ligne et conflits

- Au départ, chaque jeu garde son écriture locale existante et un adaptateur facultatif peut ensuite relire/écrire son format.
- Les résultats créés hors réseau sont mis en attente localement avec un identifiant d’événement stable, puis synchronisés quand la connexion revient.
- Une sauvegarde distante porte une révision ; une divergence entre la copie locale et la copie distante doit conserver une copie de secours avant toute résolution. Aucun écrasement silencieux n’est acceptable.
- La première intégration ne migre pas automatiquement toutes les clés localStorage. Chaque jeu a une migration documentée et vérifiée, à valider séparément.

### Connexion et gestion par l’enseignant

Proposition pour le premier prototype : l’enseignant se connecte avec son propre compte ; il crée une classe et les comptes élèves, puis remet à chaque élève un identifiant de classe et un code individuel généré. L’enseignant peut réinitialiser un code. Les élèves n’ont pas besoin d’adresse électronique personnelle. Le code ne doit pas être le prénom et l’identité interne demeure stable même si le nom d’affichage change.

Le détail technique (format de connexion, règles contre les essais répétés et procédure de remise d’un code oublié) reste à tester avec Supabase Auth avant d’en faire une décision définitive. La création des comptes par le tableau enseignant exige une fonction distante sécurisée, car une clé administrateur Supabase ne doit jamais apparaître dans le JavaScript public.

Exemple d’utilisation par un jeu, sans exposer Supabase au moteur :

```ts
const orbisGame = await orbis.forGame<TowerProgress>('fractionstower2');
const saved = await orbisGame.saveProgress(towerProgress, 1);
const result = await orbisGame.recordResult({
  eventId: crypto.randomUUID(),
  activityId: 'floor-1-boss',
  skillId: 'fraction-comparison',
  correct: 14,
  total: 18,
  errorCount: 6,
  errorFamilies: ['equivalent-fractions']
});

if (!saved.ok || !result.ok) {
  // Le jeu continue avec son stockage local et indique que la synchronisation attend.
}
```

La fabrique `orbis.forGame` est un exemple de nom d’API proposé, pas encore du code du dépôt. En pratique, la file locale doit créer et conserver l’`eventId` avant l’envoi ; le jeu ne doit pas en générer un nouveau à chaque nouvel essai réseau.

### Méthodes et erreurs prévues

- `loadProgress()` : renvoie la dernière sauvegarde du jeu ou `null` si l’élève n’en a pas encore.
- `saveProgress(data)` : enregistre l’état complet fourni par le jeu et renvoie une révision.
- `recordResult(input)` : ajoute un événement de résultat ; il ne remplace pas la sauvegarde.
- `offline` : le réseau est coupé ; la donnée reste en attente localement.
- `unauthorized` : aucune session valide ou accès refusé par les règles.
- `invalid-data` : résultat ou version de sauvegarde incomplet/incompatible.
- `conflict` : la version distante et la version locale ont changé indépendamment.
- `storage-unavailable` : le navigateur ne peut pas lire ou écrire la copie locale.
- `remote-unavailable` : le service distant ne répond pas ; le jeu reste local.

## Architecture de transition proposée

- Conserver les sauvegardes locales et leurs clés existantes.
- Pilote local réalisé dans Numéria : le schéma de sauvegarde passe à la version 3 tout en lisant les anciennes sauvegardes, la clé `numeria_save_sveltekit_v2::` reste inchangée et une mission en cours est sauvegardée/restaurée.
- Définir un adaptateur de sauvegarde pour un jeu pilote ; il lit d’abord les données existantes et n’efface rien.
- Donner aux nouveaux comptes un identifiant stable, distinct du prénom affiché.
- Enregistrer les résultats sous forme d’événements et l’état reprenable sous forme d’une sauvegarde par élève et par jeu.
- Prévoir l’export et l’effacement par élève avant la mise en production.
- Synchroniser plus tard : événements avec identifiant unique pour éviter les doublons ; sauvegardes avec version et une règle de conflit explicite.
- Protéger les données distantes par utilisateur et classe. La clé publique d’un fournisseur n’est pas un secret d’autorisation ; les clés administrateur restent côté serveur/fonction sécurisée.

Supabase est retenu comme piste pour un pilote gratuit ; aucun projet distant n’est configuré. GitHub Pages pourrait appeler son API avec une clé publique et des règles RLS correctement configurées. Les opérations réservées à l’enseignant, comme la création de comptes, demanderaient une opération sécurisée côté serveur (par exemple une fonction hébergée), jamais une clé secrète dans le JavaScript public.

## Éléments à ne pas confondre

- `src/lib/games/fractionstower2/engines`, `src/lib/games/numeria/question-engine.ts`, `src/lib/games/mesurovia/engine-legacy.js` et les autres moteurs sont des responsabilités pédagogiques locales ; ils restent séparés.
- Les formats locaux existants sont des données à préserver, pas des fichiers à supprimer pendant une abstraction.
- `src/lib/server/db/` n’est pas un service utilisable depuis GitHub Pages sans hébergement serveur.
- Une sauvegarde reprenable n’est pas la même chose qu’un historique de résultats enseignant.

