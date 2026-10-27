# Audit des fichiers longs

Audit mis à jour le 27 octobre 2026. La longueur n’est pas un défaut en soi : un fichier est découpé seulement lorsqu’une responsabilité peut être nommée, réutilisée ou comprise séparément.

## Résultat

| Fichier | Lignes | Constat | Décision |
|---|---:|---|---|
| `src/routes/mesurovia/+page.svelte` | 1404 | L’écran orchestre beaucoup d’états, de modes et de styles, alors que les données et plusieurs moteurs sont déjà séparés. | Découper ensuite par écran visible (carte, activité, bilan), sans créer un moteur universel. Priorité haute mais refonte risquée. |
| `src/routes/race/+page.svelte` | 1344 | Le moteur de questions est séparé, mais la course, le HUD et les styles restent réunis. | Extraire d’abord le HUD et l’écran de résultat. Garder la boucle de course près de la page tant qu’elle n’a qu’un consommateur. |
| `IntroCourse.svelte` | 1182 | Cours, illustrations et styles de neuf étages sont concentrés dans un composant. | Extraire les contenus par étage dans des données/composants pédagogiques ; conserver le lecteur commun. |
| `ExerciseGenerator.ts` | 1101 | Les générateurs des neuf étages partagent un point d’entrée mais pas toujours les mêmes règles. | Séparer les banques par étage derrière le point d’entrée existant. Ne pas uniformiser artificiellement les exercices. |
| `src/routes/shift/+page.svelte` | 1064 | Question-engine séparé ; interface, session et styles encore réunis. | Extraire le panneau de session et le bilan lorsque Shift sera retravaillé. Priorité moyenne. |
| `fractionstower2/play/+page.svelte` | 929 | La page assemble carte, commandes, audio, transitions et activités. | Extraire les commandes/HUD ; laisser l’orchestration du monde dans la page. |
| `src/routes/numeria/+page.svelte` | 912 | Programme, questions et sauvegarde sont déjà dans des modules propres ; la page contient plusieurs écrans. | Extraire progressivement accueil, carte et mission. Le branchement Orbis n’a pas nécessité ce remaniement. |
| `src/routes/conju_lab/+page.svelte` | 910 | Le moteur et les verbes sont séparés ; la page porte encore toutes les vues du combat. | Extraire HUD et résultat lors d’une prochaine évolution visuelle. Priorité moyenne. |

## Découpage réalisé pendant le chantier de suivi

- Le stockage local, la session distante, la traduction Supabase et la synchronisation sont quatre modules distincts sous `src/lib/orbis/persistence/`.
- Le tableau local enseignant est isolé dans `src/lib/orbis/teacher/LocalTrackingPanel.svelte` au lieu d’allonger encore la route `/teacher`.
- Numéria et Fractions Tower gardent leurs gestionnaires de sauvegarde. Une copie facultative est envoyée au service commun après leur propre sauvegarde.

## Ce qui n’a volontairement pas été fait

- Aucun gros écran de jeu n’a été découpé uniquement pour réduire son nombre de lignes.
- Aucun moteur pédagogique n’a été déplacé dans Orbis.
- Aucun ancien format ni aucune clé de sauvegarde n’a été supprimé.

La prochaine optimisation de code doit viser un seul jeu à la fois, avec une vérification visuelle de ses écrans avant et après le déplacement.
