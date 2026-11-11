# Lexique pour des adolescents allophones

Le fichier `lexique.csv` contient 600 entrées, réparties en 20 thèmes de 30 entrées. Il est directement lu par les huit activités du musée. Le parcours `base` regroupe dix thèmes du quotidien. Le parcours `avance` contient dix thèmes complémentaires. Cette seconde série de 300 entrées est un choix de conception pris pour conserver le format de 30 entrées par thème.

## Recherche et choix des mots

Consultation du 11 novembre 2026. La sélection constitue une proposition pédagogique pour l’autonomie d’adolescents de 15–16 ans en Suisse romande. Les définitions et les phrases à compléter ont été rédigées pour ce projet. Les sources ci-dessous ont orienté les situations et les domaines à couvrir. L’ordre des thèmes correspond à une organisation du cours.

Les thèmes de base couvrent l’école et ses consignes, la famille et les relations, le corps et la santé, l’alimentation et les courses, la maison et les vêtements, les actions quotidiennes, la ville et les transports, le temps et l’organisation, les émotions et la communication, la nature et les loisirs.

Les thèmes avancés portent sur la formation et l’emploi, les démarches, le budget et la consommation, la santé et la sécurité, le numérique et la vie privée, les médias, le logement, l’argumentation, la citoyenneté et l’environnement.

- [Eaquals, CIEP, Eurocentres et ACPLS, Inventaire linguistique des contenus clés des niveaux du CECRL](https://www.eaquals.org/wp-content/uploads/Inventaire_ONLINE_full.pdf) apporte les domaines de vocabulaire du quotidien, des relations, du travail, de la formation, des médias et de l’environnement. Les sections « Thèmes de vocabulaire » sont le point de départ du choix des thèmes.
- [France Éducation international, DELF A2 junior et scolaire, exemple d’épreuves](https://www.france-education-international.fr/document/delfa2-js-espacepro-ex1-candidatcol) donne des situations de transport, de message personnel, de courses, de loisirs et d’organisation scolaire. Les exercices du musée sont des créations originales.
- [France Éducation international, DELF B1 junior et scolaire](https://www.france-education-international.fr/en/article/delf-juniorscolaire-niveau-b1) présente notamment les compétences d’autonomie et d’expression d’un avis.
- [Éduscol, Fiches repères du français langue de scolarisation](https://eduscol.education.fr/document/21370/download) guide l’attention portée aux consignes et à la compréhension des apprentissages scolaires.
- [Lexique 3.83, New et collaborateurs, documentation et publications](https://openlexicon.fr/datasets-info/Lexique383/README-Lexique.html) a servi à contrôler la présence et la fréquence des mots simples après sélection. Corpus téléchargé depuis le lien officiel Lexique383.zip. Un appariement sur les formes écrites et les lemmes retrouve 261 des 264 mots simples du parcours de base et 233 des 234 du parcours avancé. La médiane des fréquences de lemme dans les sous-titres est respectivement 75,89 et 11,64 par million pour les mots retrouvés. Les expressions composées sont exclues de ce calcul. Les tableaux de fréquences sous licence CC BY-SA 4.0 restent dans leur publication d’origine.

Le nombre de 30 entrées par thème répond au choix de l’enseignant. Les regroupements et les repères « base » et « avance » sont des choix éditoriaux du projet. Ils peuvent être ajustés aux situations réellement rencontrées par l’élève. Les expressions utiles occupent une ligne, comme les mots simples.

## Modifier ou ajouter des entrées

Ouvrir le CSV UTF-8 dans un tableur ou un éditeur. Conserver sa ligne d’en-têtes. Chaque identifiant doit rester unique et stable.

| Colonne | Contenu |
| --- | --- |
| id | Identifiant stable, par exemple ecole-cahier |
| theme | Identifiant du thème, par exemple ecole |
| intitule | Nom du thème affiché dans le sélecteur |
| parcours | base ou avance |
| mot | Mot ou expression avec ses accents |
| definition | Définition du sens à travailler |
| phrase_a_trou | Phrase facultative avec un seul marqueur ___ |
| syllabes_ecrites | Découpage écrit facultatif, séparé par des tirets |
| sprite | Référence facultative à une case de planche |

Le découpage écrit sert à reconstruire l’orthographe. Il tient compte des lettres muettes et peut différer du nombre de syllabes prononcées. En l’absence de découpage, le jeu de syllabes passe aux autres entrées sélectionnées.

Une planche déjà intégrée peut être référencée par `maison:0`. Les cases sont comptées à partir de zéro, de gauche à droite puis de haut en bas. Pour ajouter une nouvelle grille régulière, placer son PNG dans `static/images/musee-vocabulaire/` et écrire par exemple `nouvelle-planche:5:4:3` pour sa sixième case, dans une grille de quatre colonnes et trois rangées. Aucun changement de code n’est nécessaire pour une grille régulière ainsi renseignée. Prévoir des marges autour de chaque image et contrôler son sens à la taille d’affichage.

Le CSV modifié dans le dépôt devient le lexique partagé au prochain déploiement. L’import dans « Choisir les thèmes » permet d’essayer un CSV immédiatement pendant une session. Il ajoute les nouvelles entrées et remplace celles portant le même identifiant. Le lexique importé et la collection restent limités à cette session. La sélection des thèmes est mémorisée dans le navigateur.

## Images et compatibilité des exercices

145 entrées disposent d’une illustration. Quatorze planches ont été générées avec l’outil intégré ImageGen, en plus de la planche école existante. Le fichier [generation.json](../images/musee-vocabulaire/generation.json) décrit les planches. Certains mots concrets et les sens abstraits restent proposés au moyen de définitions, de lettres et de phrases.

Les jeux Image → mot, Mot → image et association utilisent les entrées illustrées. Une sélection trop petite affiche les possibilités de changer les thèmes ou de passer au quiz. Les mots cachés utilisent des mots simples de 3 à 11 lettres, avec leurs accents, dans des grilles de 14 × 14. L’aide peut être utilisée autant de fois que nécessaire. Chaque clic retire de nouveaux mauvais choix s’il en reste. L’élève donne toujours sa réponse.

Les définitions emploient des mots courants et des exemples concrets. Elles décrivent le sens travaillé dans le thème. Les définitions servent aussi d’indices dans les jeux et sur les fiches.

Dans l’association, chaque série contient deux à six mots différents. « Nouvelle série » passe au groupe suivant. Une fois tous les groupes parcourus, le jeu revient au premier.

Le quiz et la fiche permettent de choisir entre définitions et phrases à compléter. Le lexique propose 136 phrases, dont 24 sur les trajets et 28 pour chacun des thèmes démarches et formation. La fiche tire jusqu’à dix entrées des thèmes choisis. Son corrigé reprend les mêmes entrées dans le même ordre.

Chaque jeu permet d’ouvrir la liste complète des mots sélectionnés avec leur définition simple. Le cahier de vocabulaire imprimable reprend tous les mots des thèmes choisis, avec une couverture puis une page par thème. Dans le pendu, les espaces, apostrophes et traits d’union restent visibles ; l’alphabet proposé contient les lettres utiles et autant de lettres en plus. Un second clic sur une lettre choisie l’efface.

Pour un essai de dix minutes, sélectionner « Ville et transports » et « Démarches et services publics », puis faire quelques phrases à compléter. Proposer ensuite une courte situation orale, par exemple demander un horaire à un guichet ou reporter un rendez-vous. Observer quels mots l’élève réemploie sans aide et lesquels méritent une reprise lors d’une séance suivante.

Noireau utilise la planche existante `catalogue-guide-4x2.png` et la description des poses de `static/mascotte-noireau/index.json`. Les huit poses interviennent selon l’activité, l’aide et le retour de réponse.

Pour vérifier les données et les grilles, lancer `node --import tsx tests/musee-vocabulaire.test.ts`.
