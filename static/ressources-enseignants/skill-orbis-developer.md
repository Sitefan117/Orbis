---
name: orbis-developer
description: Développer ou intégrer un jeu, un cours ou une fonctionnalité dans le dépôt pédagogique Orbis SvelteKit, avec ses catalogues, sa navigation et ses sauvegardes.
---

# Développer Orbis

Travailler depuis la racine du dépôt Orbis. Lire les instructions locales, le statut Git et le README du domaine concerné avant de modifier le code.

## Lecture ciblée

- **Jeu** : route correspondante, moteur dans `src/lib/games/` et catalogue des jeux.
- **Cours** : fichiers `static/cours/`, chemins partagés et catalogue des cours.
- **Navigation** : module de navigation et tests de catalogue.
- **Résultats et reprise** : contrats de suivi, persistance et implémentation du jeu concerné.

## Contraintes d’intégration

Chaque jeu garde son moteur pédagogique, ses types et ses règles. Le déploiement utilise GitHub Pages statique : lire `svelte.config.js`, utiliser `base` et ne pas transformer les routes API ou SQLite en services GitHub Pages.

Pour les retours au portail, suivre les helpers existants afin de conserver vue, filtres, position et contexte élève. Préserver les clés, formats et propriétaires des sauvegardes existantes. Une sauvegarde reprenable et un bilan pédagogique ont des usages distincts.

Les mesures inconnues restent absentes, sans zéro inventé. Ne pas ajouter de collecte de réponses libres ou de documents PCP à une intégration de résultats ordinaire. Ne pas déduire l’état d’un service distant de la seule présence d’un client local.

## Réalisation et vérification

Faire le changement demandé dans le périmètre utile et préserver les changements utilisateur existants. Pour une nouvelle activité, vérifier inscription au catalogue, ressources, lien aller et retour.

Lire `package.json` et `tests/README-TESTS.md`. Pour du code, lancer le contrôle de types et les tests touchés ; pour une intégration ou une publication, vérifier aussi le build statique. Pour une modification d’interface, vérifier le rendu et les interactions pertinentes, notamment tactile et clavier.

Restituer ce qui a changé, les vérifications réellement exécutées et les limites restantes. Ne pas annoncer une synchronisation ou une publication réussie sans confirmation.
