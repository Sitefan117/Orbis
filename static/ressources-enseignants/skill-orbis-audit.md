---
name: orbis-audit
description: Auditer une activité ou une intégration du portail Orbis, notamment catalogue, navigation, sauvegarde, suivi pédagogique, déploiement statique et tests.
---

# Auditer Orbis

Identifier le jeu, la route ou le service demandé dans le dépôt courant. Adapter l’étendue de l’audit à la question. Un audit autorise les inspections et contrôles locaux pertinents ; implémenter une correction seulement si la demande l’inclut.

## Collecter les preuves utiles

Lire les instructions locales et `git status --short`, puis chercher avec `rg` les points d’entrée du domaine. Inspecter le code actuel et ses tests avant les documents historiques.

Choisir les axes concernés :

- **Catalogue et navigation** : comparer la route réelle avec les catalogues de jeux et de cours, les chemins de cours et les ressources `static/`. Lire le module de navigation pour les retours avec vue, filtres, position et élève. Tester le préfixe lu dans `svelte.config.js`, pas uniquement la racine en développement.
- **Sauvegarde** : suivre lecture, écriture, clé, version, portée élève, migration et état repris. Vérifier le cas sans profil et l’indisponibilité du stockage. Ne pas effacer de données réelles pour tester.
- **Suivi** : vérifier les contrats de suivi, la cohérence entre questions et réussites, l’absence de métriques inventées, la gestion des erreurs et la distinction entre bilan et sauvegarde. Le prénom n’authentifie pas un élève.
- **Publication** : GitHub Pages sert le build statique ; les API SvelteKit et SQLite locales ne sont pas exécutées sur GitHub Pages. La présence de code Supabase ne prouve pas qu’un service distant est configuré.
- **Pédagogie** : inspecter curriculum, génération, validation et progression propres au jeu. Vérifier des exemples reproductibles, les bornes et les réponses acceptées.
- **Interface** : examiner rendu, consignes, feedback, tactile, clavier et retour au portail dans un environnement disponible ; signaler ce qui n’a pas été observé.

## Vérifier et rendre compte

Choisir les tests à partir de `package.json` et `tests/README-TESTS.md`. Un test structurel ne prouve pas à lui seul un comportement navigateur.

Présenter les problèmes actionnables par impact. Pour chacun, indiquer le fichier, le déclencheur, la conséquence et la preuve ou reproduction. Séparer les défauts démontrés des hypothèses à vérifier. S’il n’y a aucun défaut établi, le dire et préciser les limites du contrôle.
