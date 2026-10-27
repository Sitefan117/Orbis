# Données du suivi pédagogique

Version minimale retenue le 27 octobre 2026. Le principe est de conserver uniquement une information utile à une décision pédagogique, et seulement lorsqu’un jeu sait la produire correctement.

## Données indispensables

| Information | Utilité pour l’enseignant | Source |
|---|---|---|
| Élève | Savoir à qui appartient le bilan | profil local, puis compte élève |
| Jeu et activité | Comprendre le contexte du résultat | jeu |
| Date | Repérer la dernière activité et l’évolution | Orbis |
| Questions et réussites | Calculer le taux de réussite sans perdre la taille de l’exercice | jeu |
| Nombre d’erreurs | Repérer une activité difficile | jeu |
| Dernière sauvegarde | Permettre à l’élève de reprendre | format propre au jeu |

## Données facultatives mais utiles

- notion ou compétence travaillée ;
- familles d’erreurs, avec des noms compréhensibles ;
- nombre d’aides réellement ouvertes ;
- durée active de la session, si les pauses peuvent être distinguées ;
- progression atteinte dans le jeu.

Une valeur inconnue reste vide : elle n’est jamais inventée ni remplacée par zéro. Les textes saisis librement et les réponses détaillées ne sont pas nécessaires pour le premier pilote.

## Ce que montre le premier tableau local

Le panneau `/teacher` présente le nombre d’élèves, d’activités et de questions, le taux global, les bilans détaillés et leur état de synchronisation. Il exporte les mêmes informations en CSV. Les bilans proviennent actuellement de Calculs, ConjuLab, Géométrie, Livrets, Numéria et PCP. Numéria et Fractions Tower y ajoutent leur dernière sauvegarde avec un résumé de progression.

Limite normale du pilote : `localStorage` appartient à un navigateur précis. Les données d’un iPad élève ne peuvent apparaître sur le Mac enseignant qu’après mise en place des comptes et de Supabase.
