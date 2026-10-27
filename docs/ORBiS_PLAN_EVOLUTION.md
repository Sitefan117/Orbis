# Plan d’évolution Orbis

Ce plan suit le dépôt audité le 25 octobre 2026. Les étapes qui touchent aux données restent conditionnées à la validation de la conception.

## 1. Audit initial

- Corriger la documentation pour refléter GitHub Pages et distinguer le code serveur local des fonctions en ligne réellement disponibles.
- Inventorier, jeu par jeu, le format local, les points de sauvegarde, les résultats envoyés et la possibilité de reprendre une partie.
- Établir une liste d’indicateurs utiles au tableau enseignant avec l’enseignant.
- Vérifier les contrôles disponibles : `npm run check`, `npm run build` et scripts existants sous `tests/`.
- Distinguer les vérifications de code de la conception de la synchronisation et des données pédagogiques.

**Fait :** README et cartographie initiale mis à jour. Supabase est retenu comme piste pour un pilote gratuit ; aucun service ni compte élève n’a été créé.

**Pilote local réalisé avant cette phase :** Numéria enregistre et reprend une mission en cours sans changer la clé existante. Il n’utilise pas encore d’authentification ni de synchronisation distante.

**Préparation :** un brouillon de schéma Supabase Free avec des règles RLS est dans `supabase/`. Il n’est pas appliqué à un projet ; il faut le relire et le tester avec des comptes fictifs avant toute donnée réelle.

## 2. Corriger les liens, images et données locales

**Fait :** les liens de cours inexistants ont été retirés du catalogue visible, les chemins existants corrigés et la page d’accueil n’essaie plus de charger des images absentes. Les nouvelles sauvegardes PCP et Fraction Tower sont séparées par nom de profil quand ce nom est fourni. Les anciennes sauvegardes restent sur l’appareil sans attribution automatique.

**Ajout :** les cours HTML sont regroupés sous `static/cours/maths/`, classés dans le catalogue commun et accessibles par thème. Les anciennes adresses restent redirigées vers les documents déplacés.

## 3. Corriger les types et regrouper les vérifications

**Fait :** `npm run check` passe sans erreur ni avertissement. `npm test` rassemble les tests automatisés des moteurs, routes, liens, ressources et sauvegardes locales. Les rapports ConjuLab utilisent maintenant les champs attendus par le client de résultats. GitHub Actions exécute check, tests et build avant publication.

## 4. Retirer les doublons inutilisés identifiés

**Fait :** suppression des composants Fraction Tower vérifiés comme non référencés, d’un adaptateur Mesurovia inutilisé et d’une feuille de style racine non importée. L’archive Convertigo a été dédoublonnée : une copie reste dans `archives/`, hors du site publié. Les deux archives ZIP étaient identiques ; le fichier TAR ne contenait que des métadonnées AppleDouble.

**Audit complémentaire :** les fichiers longs, leurs responsabilités et l’ordre conseillé de découpage sont consignés dans `ORBiS_AUDIT_FICHIERS_LONGS.md`. Le nouveau tableau enseignant a été extrait dans son propre composant. Les gros écrans de jeu seront découpés un par un, quand la séparation est utile et vérifiable.

### Refactor de l’arborescence et des moteurs

**Fait :** le code commun a été regroupé dans `src/lib/orbis/` (catalogues, profil local, contrats de résultats et de progression). Les modules des jeux sont maintenant sous `src/lib/games/<jeu>/`, avec des structures internes qui restent propres à chaque jeu. Les adresses des pages et les clés locales des sauvegardes ont été conservées.

Les pages Calculs, Livrets, Race, Shift et Math Hunt appellent maintenant des modules de jeu pour la génération des questions ou les règles numériques. Le moteur Canvas de Math Hunt et les données de suivi local de Race sont séparés de leurs pages. Cela réduit le contenu de ces pages sans modifier leur rôle d’écran.

**À faire plus tard :** découper les écrans et styles des pages encore longues, une activité à la fois, uniquement quand le découpage rendra le code plus facile à lire. Les pages restent fonctionnelles et les moteurs ne sont pas fusionnés.

## 5. Définir le contrat et les premières données à suivre

- Supabase Free est la cible du pilote, sans dépense mensuelle ; le site continue d’être publié sur GitHub Pages.
- Le contrat proposé distingue sauvegarde reprenable (propre à chaque jeu) et résultats (format commun minimal), avec date, version, révision et identifiant d’événement idempotent.
- La première liste enseignant couvre classe/élève, dernière activité et sauvegarde, scores, taux de réussite contextualisé et catégories d’erreurs disponibles.
- Le mode local reste actif si le réseau ou le service est indisponible ; prévoir export manuel, car Free peut mettre en pause les projets inactifs et ne fournit pas de sauvegardes automatiques téléchargeables.
- Proposition de connexion : l’enseignant crée les classes et comptes, remet un identifiant de classe et un code individuel, et peut réinitialiser les codes. Ce parcours doit être prototypé avant de fixer les détails techniques.
- Le contrat documente les erreurs `offline`, `unauthorized`, `invalid-data`, `conflict`, `storage-unavailable` et `remote-unavailable`.

**Résultat de l’étape :** proposition de données et contrat inscrits dans `ORBiS_ARCHITECTURE.md`, `ORBiS_DECISIONS_TECHNIQUES.md` et `ORBiS_SUIVI_PEDAGOGIQUE.md`. La création de comptes et le schéma SQL ne sont pas encore exécutés.

## 6. Préparer un pilote sans casser les jeux

- Tester le contrat avec un jeu dont la sauvegarde locale est bien identifiée.
- Garder le format local comme source de secours et prévoir une migration qui copie et vérifie les données.
- Séparer la sauvegarde d’état des résultats pédagogiques.
- Vérifier les règles d’accès avec des comptes enseignant et élève de test avant de stocker des données réelles.

**Réalisé localement :** les bilans compatibles sont conservés dans le navigateur et visibles sur `/teacher`, avec export CSV. Numéria et Fractions Tower continuent leurs sauvegardes historiques et déposent aussi une copie dans la file Orbis. Le client Supabase est prêt à vider cette file lorsqu’une vraie session sera fournie.

**Uniformisation réalisée :** les jeux intégrés n’appellent plus directement les couches de stockage. Ils utilisent tous `recordGameActivity` et, lorsqu’ils ont une sauvegarde, `recordGameProgress`. Les noms des champs sont désormais identiques d’un jeu à l’autre ; seuls les détails réellement disponibles restent facultatifs.

## 7. Intégrer progressivement tous les jeux concernés

- Adapter chaque jeu à son rythme, sans modifier son moteur pédagogique.
- Ajouter des sauvegardes à des moments de reprise utiles définis avec l’enseignant.
- Ajouter les résultats normalisés et indicateurs retenus jeu par jeu.
- Conserver un fonctionnement local si le service distant est indisponible.

## 8. Construire le suivi enseignant

- Afficher les élèves/classes, les activités, la progression et les résultats selon le besoin validé.
- Ajouter les erreurs par famille, aides ou durée uniquement si les jeux les fournissent de façon fiable et que ces mesures ont une utilité pédagogique.
- Prévoir export et suppression des données d’un élève.

## Risques à surveiller

- Le dépôt configure GitHub Pages statique, mais contient des API SvelteKit et du SQLite serveur.
- Les sauvegardes locales actuelles utilisent plusieurs formats et certaines ne sont pas séparées par compte stable.
- Une sauvegarde contenant l’état d’un jeu ne permet pas automatiquement de calculer un historique d’apprentissage.
- Une fonction de création de compte administrateur ne doit jamais recevoir une clé secrète dans le code client.

