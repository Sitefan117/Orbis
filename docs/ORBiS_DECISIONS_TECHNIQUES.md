# Décisions techniques Orbis

Ce journal sépare les décisions validées des propositions encore à confirmer.

## D-001 — Jeux relativement indépendants

- **État : validé par l’enseignant, 25 octobre 2026.**
- **Problème :** les jeux ont des moteurs, règles, données et besoins pédagogiques différents.
- **Décision :** chaque jeu garde son organisation interne et son moteur pédagogique. Orbis peut exposer des services transversaux facultatifs pour identité, sauvegarde, synchronisation, résultats et suivi.
- **Alternatives considérées :** imposer un moteur et un modèle de progression universels ; créer une bibliothèque partagée avant d’avoir des besoins récurrents.
- **Raison :** centraliser les services utiles sans rendre identiques les mécaniques des jeux.
- **Conséquences :** le contrat commun transporte des données de progression opaques et des résultats structurés ; les types pédagogiques restent propres aux jeux.
- **Limite :** le contrat ne doit être étendu qu’avec des besoins concrets démontrés par plusieurs jeux.

## D-002 — GitHub Pages reste l’hébergement du site

- **État : validé par l’enseignant, 25 octobre 2026.**
- **Problème :** l’enseignant ne souhaite pas laisser son Mac allumé pour héberger Orbis.
- **Décision :** le site reste publié sur GitHub Pages ; tout backend nécessaire doit être hébergé séparément.
- **Constat :** `.github/workflows/main.yml` publie `build/`, tandis que le dépôt contient des routes API et une base SQLite serveur qui ne sont pas exécutées par GitHub Pages.
- **Conséquence :** choisir un fournisseur distant et migrer les fonctions réellement nécessaires avant de compter sur le suivi en ligne. Les jeux locaux doivent rester utilisables hors réseau autant que possible.

## D-003 — Gestion des comptes par l’enseignant

- **État :** exigence fonctionnelle validée ; mécanisme encore à définir.
- **Décision :** l’enseignant gère les comptes. Les jeux reçoivent un identifiant opaque stable, pas un prénom comme identifiant sécurisé.
- **Proposition pour le prototype :** l’enseignant crée les classes et les comptes ; chaque élève reçoit un identifiant de classe et un code individuel généré, réinitialisable par l’enseignant. Aucun courriel personnel d’élève n’est requis.
- **À prototyper avant validation technique :** format exact de connexion, protection contre les essais répétés, remise des codes, changement de classe et déconnexion sur appareils partagés. La clé d’administration Supabase ne doit jamais être mise dans le site.

## D-004 — Fournisseur de persistance

- **État : Supabase validé par l’enseignant pour un pilote gratuit, 25 octobre 2026 ; aucun projet distant créé. L’enseignant prévoit de rester sur l’offre gratuite et ne peut pas engager 25 USD/mois.**
- **Choix : Supabase.** Il combine authentification, PostgreSQL, règles RLS et API utilisable par un frontend statique. Le modèle relationnel convient aux relations élève-classe-jeu-résultat et est proche des tables déjà présentes dans SQLite.
- **Prix vérifié le 25 octobre 2026 sur la page officielle :** Free à 0 USD/mois, deux projets actifs, base de 500 MB, 5 GB de trafic sortant et jusqu’à 50 000 utilisateurs actifs mensuels ; Pro à partir de 25 USD/mois. Un projet Free peut être mis en pause après une semaine de faible activité. L’offre Free ne comprend pas les sauvegardes automatiques téléchargeables. Le pilote doit rester dans Free, garder les jeux jouables localement en cas de pause et prévoir un export manuel régulier. Voir [les tarifs Supabase](https://supabase.com/pricing) et [la règle de mise en pause](https://supabase.com/docs/guides/platform/free-project-pausing).
- **Pourquoi pas Firebase comme premier choix :** bon forfait gratuit, mais modèle orienté documents et plus de logique spécifique ; dépasser le quota gratuit coupe le produit concerné pour le reste de la période sur Spark. L’administration sécurisée des comptes demande du code serveur.
- **Pourquoi pas Cloudflare D1 comme premier choix :** coûts très bas et bon fonctionnement avec un frontend statique, mais il faut construire davantage de fonctions serveur, d’authentification et de règles d’accès ; plus difficile à maintenir seul.
- **Pourquoi pas Appwrite comme premier choix :** offre complète, mais l’offre Cloud gratuite peut aussi être mise en pause après une semaine et l’offre payante commence autour de 25 USD/mois.
- **À prototyper :** parcours d’identifiant/code élève, provisionnement sécurisé et remise/réinitialisation. Ne pas dépasser l’offre Free sans nouvelle décision explicite.

## D-005 — Modèle pédagogique et données à suivre

- **État : proposition de méthode, contenu encore à définir.**
- **Problème :** l’enseignant veut reprendre les parties et consulter erreurs, résultats et évolution, mais les indicateurs exacts ne sont pas encore déterminés.
- **Décision de méthode :** inventorier les données existantes jeu par jeu ; convenir ensuite des données minimales avant de modifier la persistance.
- **Proposition :** séparer (1) la dernière sauvegarde reprenable, propre au jeu, et (2) les événements de résultats destinés au tableau enseignant.
- **Limite :** ne pas collecter toutes les réponses brutes et toutes les interactions par défaut. Ajouter chaque donnée de suivi seulement si son usage pédagogique est clair.

## D-006 — Première liste de données enseignant

- **État : proposition de départ, à ajuster sur un exemple de tableau.**
- **À enregistrer :** identifiant élève interne, classe, sauvegarde reprenable par jeu, activité, date, score/nombre de questions, nombre d’erreurs, familles d’erreurs quand le jeu sait les classer.
- **À calculer :** taux de réussite à partir du score et du total, en gardant le contexte activité/période pour que les comparaisons restent compréhensibles.
- **À ne pas collecter par défaut :** réponses libres, historique détaillé de chaque clic, documents PCP, durée et aides avant de confirmer qu’ils sont utiles.
- **Raison :** permettre à l’enseignant de voir où en est l’élève et de reprendre une partie sans imposer aux jeux de mêmes règles internes ni recueillir des données superflues.

