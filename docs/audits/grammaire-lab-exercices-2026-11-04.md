# Inventaire des exercices de L’Atelier des phrases

Audit du code local, 4 novembre 2026. 158 défis dans 14 niveaux à cette date. Depuis le 6 novembre, le jeu compte 171 défis ; les quatre priorités de cet audit ont été corrigées. Les tableaux ci-dessous restent le relevé historique du 4 novembre et ne décrivent pas les nouvelles activités de surlignage, réparation et déplacement. Chaque série Lego tire 6 défis ; la consolidation en tire 4.

**Lecture :** « action » indique ce que l’élève fait à l’écran ; « objectif » nomme la notion visée par le défi. La réponse indiquée est celle codée dans la banque ; une construction peut également accepter des ordres alternatifs explicites.

## Constats prioritaires sur le code

1. **Fonction et emboîtement peuvent se contredire.** Dans `curriculum.ts`, plusieurs indications de lieu ou de temps déplaçables portent le groupe `gv` (`l3-a`, `l4-a`, `l5-a`, `l9-a`, `l9-c`, `l14-a`). `blocksConnect()` dans `+page.svelte` fusionne visuellement deux blocs successifs qui portent le même groupe. Par exemple, « Les enfants jouent dans la cour après la classe » peut donc montrer le lieu et le temps dans le GV, alors que le cours les travaille comme compléments de phrase (CP). Il faut annoter la fonction de chaque groupe dans chaque défi et n’emboîter que les constituants réellement liés.
2. **La maîtrise ne garantit pas la couverture des notions annoncées.** `pickChallenges()` tire 6 défis au hasard et impose seulement la présence d’une construction quand le niveau en contient une. Au niveau 14, CVD et CVI apparaissent chacun dans un seul défi (`p14-i`, `p14-j`) parmi 14. Une série peut atteindre le seuil de 5/6 sans vérifier ces deux notions. Prévoir une répartition par objectif obligatoire avant le tirage aléatoire ; réserver le tirage libre aux révisions.
3. **La diversité visible reste limitée à deux interactions.** La banque comporte 107 défis `select` et 51 défis `order`. Les niveaux 1, 2 et 4 ne proposent que des choix ; le niveau 3 comporte 9 remises en ordre sur 11. Les verbes « observer », « trier », « comparer » et « compléter » changent l’intention de la consigne, mais les commandes restent sélectionner ou ordonner. Ajouter le surlignage dans une phrase, la délimitation de groupes, la réparation ciblée et le déplacement/effacement pour tester une hypothèse.
4. **Une réponse obtenue après erreur compte encore comme réussite.** `checkAnswer()` incrémente `stats.correct` dès que la solution est trouvée, même après plusieurs essais et un indice ; `finishLevel()` peut ensuite valider le niveau avec 5/6 réussites finales. Les erreurs restent enregistrées, mais le seuil ne distingue pas réponse autonome et réponse aidée. Conserver les deux mesures et utiliser la réussite autonome pour la maîtrise, tout en valorisant la correction après aide.
5. **47 questions à choix contextualisées gardent les options dans le même ordre.** `pickChallenges()` renvoie directement tout défi `select` ayant `context`. L’élève peut mémoriser la position plutôt que la notion. Mélanger les options tout en gardant le texte de la phrase affichée dans son ordre d’origine ; tester aussi l’accessibilité de cette présentation.

**Point de vigilance pédagogique :** les premiers tris qualifient des groupes nominaux comme « non-phrases » sans préciser qu’on cherche des phrases verbales autonomes dans ces exercices. Une phrase nominale ou une réponse elliptique peut être valide dans un autre contexte. Ajouter cette précision au niveau 1–2 et proposer plus tard un contre-exemple contextualisé.

## Points forts

- Parcours explicite de 14 niveaux avec prérequis, théorie, aide et explication pour chaque défi.
- Banque de 158 défis, tirage sans doublon dans une série et consolidation avec d’autres défis lorsque la banque le permet.
- Réponses multiples et quelques ordres alternatifs acceptés ; contrôle structurel des identifiants et des solutions.
- Clic et glisser-déposer, lecture orale des consignes, texte agrandi, animations réduites et Tetris sans chronomètre.
- Sauvegarde agrégée par élève et remontée des familles d’erreurs sans enregistrer les gestes détaillés.

## Niveau 1 — Reconnaître une phrase (2H–3H)

Prérequis : Comprendre une consigne orale simple. Notions : phrase, sens, message complet.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l1-a | Choisis la phrase qui raconte quelque chose. | Reconnaître une phrase | Choix unique : sélectionner | Le chat dort. |
| l1-b | Quelle proposition est une phrase ? | Reconnaître une phrase | Choix unique : sélectionner | Les oiseaux chantent. |
| l1-c | Trouve le message complet. | Reconnaître une phrase | Choix unique : sélectionner | Le soleil brille. |
| p1-a | Quel message raconte une action complète ? | Reconnaître une phrase | Choix unique : sélectionner (observer) | La pluie tombe. |
| p1-b | Choisis les deux phrases complètes. | Reconnaître une phrase | Choix multiple : sélectionner (trier) | Le train arrive. + Les enfants rient. |
| p1-c | Quelle proposition peut être dite seule ? | Reconnaître une phrase | Choix unique : sélectionner (observer) | Nina lit. |
| p1-d | Quel groupe complète « Le vélo… » pour faire une phrase ? | Compléter une phrase | Choix unique : sélectionner (completer) | roule vite. |
| p1-e | Sélectionne toutes les phrases qui ont du sens. | Vérifier le sens de la phrase | Choix multiple : sélectionner (trier) | La lune éclaire la nuit. + Mon frère chante. |
| p1-f | Quelle phrase raconte quelque chose qui se passe ? | Reconnaître une phrase | Choix unique : sélectionner (observer) | Les abeilles butinent. |
| p1-g | Quel début permet de former « … saute. » ? | Compléter une phrase | Choix unique : sélectionner (completer) | La grenouille |
| p1-h | Trouve les messages complets. | Reconnaître une phrase | Choix multiple : sélectionner (trier) | Léo peint un mur. + La porte grince. |

## Niveau 2 — Phrase ou non-phrase (2H–3H)

Prérequis : Reconnaître un message compréhensible. Notions : phrase, non-phrase, majuscule, ponctuation.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l2-a | Sélectionne toutes les phrases. | Distinguer phrase et groupe incomplet | Choix multiple : sélectionner | Mila dessine un arbre. + La cloche sonne. |
| l2-b | Sélectionne les non-phrases. | Distinguer phrase et groupe incomplet | Choix multiple : sélectionner | Dans la cour de + une jolie bille |
| l2-c | Quelles propositions sont des phrases ? | Reconnaître la ponctuation | Choix multiple : sélectionner | Il pleut! + Pourquoi ris-tu ? |
| p2-a | Quels groupes ne sont pas des phrases complètes ? | Distinguer phrase et groupe incomplet | Choix multiple : sélectionner (trier) | au fond du sac + une grande école |
| p2-b | Quelle proposition a un sens complet ? | Distinguer phrase et groupe incomplet | Choix unique : sélectionner (observer) | La tortue avance. |
| p2-c | Sélectionne les deux phrases interrogatives complètes. | Reconnaître ou former une question | Choix multiple : sélectionner (trier) | Où habites-tu ? + Qui arrive ? |
| p2-d | Quel ajout transforme « Les élèves… » en phrase ? | Compléter une phrase | Choix unique : sélectionner (completer) | travaillent. |
| p2-e | Quels messages sont incomplets ? | Distinguer phrase et groupe incomplet | Choix multiple : sélectionner (trier) | Quand la cloche + sous la table |
| p2-f | Quel exemple montre qu’un point ne suffit pas ? | Vérifier le sens de la phrase | Choix unique : sélectionner (observer) | Le chien mange dans. |
| p2-g | Choisis toutes les phrases qui racontent une action. | Distinguer phrase et groupe incomplet | Choix multiple : sélectionner (trier) | Le facteur arrive. + Maman prépare le repas. |
| p2-h | Quel début complète « … ouvre la porte. » ? | Compléter une phrase | Choix unique : sélectionner (completer) | Salomé |

## Niveau 3 — Remettre les mots dans l’ordre (3H)

Prérequis : Distinguer phrase et non-phrase. Notions : ordre des mots, début, fin.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l3-a | Remets les blocs dans l’ordre. | Ordonner une phrase | Construction : ordonner par clic ou glisser | Le renard court dans la forêt. |
| l3-b | Construis une phrase correcte. | Ordonner une phrase | Construction : ordonner par clic ou glisser | Mila observe une fleur. |
| l3-c | Remets la phrase debout. | Ordonner une phrase | Construction : ordonner par clic ou glisser | Les enfants préparent un gâteau. |
| p3-a | Construis une phrase sur le lapin. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Le lapin saute dans le pré. |
| p3-b | Remets les mots en ordre. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Sara lit un livre. |
| p3-c | Construis une phrase complète. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Les chats dorment sur le tapis. |
| p3-d | Quel bloc doit venir juste après « Le cheval » ? | Accorder sujet et verbe | Choix unique : sélectionner (analyser) | galope |
| p3-e | Raconte ce que fait Inès. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Inès dessine une étoile. |
| p3-f | Quelle suite de blocs est dans un ordre possible ? | Ordonner une phrase | Choix unique : sélectionner (trier) | Mila prépare le repas. |
| p3-g | Construis la phrase avec la ponctuation. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Le vent souffle fort. |
| p3-h | Mets les blocs en ordre. | Ordonner une phrase | Construction : ordonner par clic ou glisser (construire) | Nous jouons aux cartes. |

## Niveau 4 — Identifier le sujet et le verbe (3H–4H)

Prérequis : Construire une phrase simple en ordre. Notions : sujet, verbe, accord simple.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l4-a | Clique sur le sujet. | Identifier le sujet | Choix unique : sélectionner | Le petit chien |
| l4-b | Clique sur le verbe. | Identifier le verbe | Choix unique : sélectionner | construisent |
| l4-c | Choisis le verbe qui s’accorde avec le sujet. | Accorder sujet et verbe | Choix unique : sélectionner | jouent |
| p4-a | Qui fait l’action ? | Identifier le sujet | Choix unique : sélectionner (analyser) | Ma sœur |
| p4-b | Quel mot indique ce qui se passe ? | Identifier le verbe | Choix unique : sélectionner (analyser) | tombent |
| p4-c | Quel verbe convient à « Les chiens… » ? | Accorder sujet et verbe | Choix unique : sélectionner (completer) | aboient |
| p4-d | Quel est le sujet de « brille » ? | Identifier le sujet | Choix unique : sélectionner (analyser) | Le soleil |
| p4-e | Complète « La petite souris… ». | Accorder sujet et verbe | Choix unique : sélectionner (completer) | mange |
| p4-f | Quel bloc est le verbe ? | Identifier le verbe | Choix unique : sélectionner (analyser) | répare |
| p4-g | Quelles phrases ont un accord correct ? | Accorder sujet et verbe | Choix multiple : sélectionner (trier) | Les enfants chantent. + La fleur pousse. |
| p4-h | Quel sujet convient à « … jouons » ? | Accorder sujet et verbe | Choix unique : sélectionner (completer) | Nous |

## Niveau 5 — Comprendre les groupes de mots (4H)

Prérequis : Identifier un sujet et un verbe simples. Notions : groupe de mots, déplacement, fusion.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l5-a | Assemble les groupes dans l’ordre. | Former des groupes de mots | Construction : ordonner par clic ou glisser | Le petit chien aboie dans le jardin. |
| l5-b | Construis la phrase avec trois groupes. | Former des groupes de mots | Construction : ordonner par clic ou glisser | Une petite souris mange un morceau de fromage. |
| l5-c | Quel groupe peut remplacer « Le grand arbre » ? | Remplacer un sujet par un pronom | Choix unique : sélectionner | Il |
| p5-a | Rassemble le groupe qui nomme l’animal. | Former des groupes de mots | Construction : ordonner par clic ou glisser (construire) | Le grand chien |
| p5-b | Construis un groupe de mots cohérent. | Former des groupes de mots | Construction : ordonner par clic ou glisser (construire) | une jolie maison |
| p5-c | Quel groupe peut se déplacer ensemble ? | Former des groupes de mots | Choix unique : sélectionner (analyser) | dans le jardin |
| p5-d | Dans la phrase, quel groupe désigne celui qui agit ? | Repérer le sujet complet | Choix unique : sélectionner (analyser) | Les petites fourmis |
| p5-e | Assemble deux groupes puis le point. | Former des groupes de mots | Construction : ordonner par clic ou glisser (construire) | Le jeune marin salue le port. |
| p5-f | Quels groupes peuvent répondre à « où ? » ? | Repérer un groupe indiquant un lieu | Choix multiple : sélectionner (trier) | sous le lit + dans la cour |
| p5-g | Quel groupe contient le verbe ? | Repérer le GV | Choix unique : sélectionner (analyser) | avance doucement |
| p5-h | Forme le groupe qui nomme les fleurs. | Former des groupes de mots | Construction : ordonner par clic ou glisser (construire) | les petites fleurs |

## Niveau 6 — Construire le groupe nominal (4H–5H)

Prérequis : Comprendre qu’un groupe forme un bloc de sens. Notions : groupe nominal, déterminant, nom.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l6-a | Construis le groupe nominal. | Former ou reconnaître un GN | Construction : ordonner par clic ou glisser | le chat |
| l6-b | Assemble le groupe nominal au pluriel. | Associer déterminant et nom | Construction : ordonner par clic ou glisser | des fleurs |
| l6-c | Clique sur le nom. | Identifier un nom | Choix unique : sélectionner | maison |
| p6-a | Assemble un groupe nominal féminin. | Former ou reconnaître un GN | Construction : ordonner par clic ou glisser (construire) | la rivière |
| p6-b | Construis un groupe nominal au pluriel. | Former ou reconnaître un GN | Construction : ordonner par clic ou glisser (construire) | les arbres |
| p6-c | Quel mot est le déterminant ? | Identifier un déterminant | Choix unique : sélectionner (analyser) | ces |
| p6-d | Quel déterminant convient à « … maison » ? | Accorder le groupe nominal | Choix unique : sélectionner (completer) | une |
| p6-e | Dans « un grand cheval », quel est le nom ? | Identifier un nom | Choix unique : sélectionner (analyser) | cheval |
| p6-f | Assemble le déterminant et le nom. | Former ou reconnaître un GN | Construction : ordonner par clic ou glisser (construire) | des étoiles |
| p6-g | Quels exemples sont des groupes nominaux ? | Former ou reconnaître un GN | Choix multiple : sélectionner (trier) | le jardin + une chanson |
| p6-h | Quel nom peut suivre « les » ? | Associer déterminant et nom | Choix unique : sélectionner (completer) | fleurs |

## Niveau 7 — Ajouter des adjectifs (5H)

Prérequis : Identifier déterminant et nom. Notions : adjectif, accord dans le groupe nominal.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l7-a | Construis le groupe nominal enrichi. | Repérer ou placer un adjectif | Construction : ordonner par clic ou glisser | un petit chat noir |
| l7-b | Choisis l’adjectif bien accordé. | Accorder le groupe nominal | Choix unique : sélectionner | petite |
| l7-c | Assemble le groupe nominal au pluriel. | Accorder le groupe nominal | Construction : ordonner par clic ou glisser | les grandes maisons blanches |
| p7-a | Construis un groupe nominal enrichi. | Repérer ou placer un adjectif | Construction : ordonner par clic ou glisser (construire) | une petite étoile |
| p7-b | Place l’adjectif après le nom. | Repérer ou placer un adjectif | Construction : ordonner par clic ou glisser (construire) | un bateau bleu |
| p7-c | Complète « des arbres … ». | Accorder le groupe nominal | Choix unique : sélectionner (completer) | verts |
| p7-d | Quel adjectif convient à « une porte … » ? | Accorder le groupe nominal | Choix unique : sélectionner (completer) | ouverte |
| p7-e | Quel mot précise le nom ? | Repérer ou placer un adjectif | Choix unique : sélectionner (analyser) | vieux |
| p7-f | Assemble le groupe au féminin pluriel. | Accorder le groupe nominal | Construction : ordonner par clic ou glisser (construire) | les longues routes |
| p7-g | Quels groupes sont bien accordés ? | Accorder le groupe nominal | Choix multiple : sélectionner (trier) | une fleur blanche + des petits chats |
| p7-h | Choisis la suite correcte : « les … fleurs ». | Accorder le groupe nominal | Choix unique : sélectionner (completer) | jolies |

## Niveau 8 — Sujet et groupe verbal (5H–6H)

Prérequis : Reconnaître sujet, verbe et groupe nominal. Notions : sujet (fonction), groupe verbal (GV).

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l8-a | Sélectionne tout le groupe sujet. | Repérer le sujet complet | Choix multiple : sélectionner | Le + grand + arbre |
| l8-b | Sélectionne tout le groupe verbal. | Repérer le GV | Choix multiple : sélectionner | écoutent + la consigne |
| l8-c | Assemble les deux grands groupes. | Distinguer sujet et GV | Construction : ordonner par clic ou glisser | La petite fille range ses crayons. |
| p8-a | Repère tous les mots du groupe sujet de la musicienne. | Repérer le sujet complet | Choix multiple : sélectionner (analyser) | La + jeune + musicienne |
| p8-b | Choisis les blocs du groupe verbal du bus. | Repérer le GV | Choix multiple : sélectionner (analyser) | traverse + le village |
| p8-c | Construis la phrase des enfants curieux. | Distinguer sujet et GV | Construction : ordonner par clic ou glisser (construire) | Les enfants curieux observent les nuages. |
| p8-d | Quel groupe peut être remplacé par « elle » ? | Repérer le sujet complet | Choix unique : sélectionner (analyser) | La grande forêt |
| p8-e | Choisis le groupe verbal complet. | Repérer le GV | Choix unique : sélectionner (analyser) | soulève la valise |
| p8-f | Place le groupe sujet avant le groupe verbal. | Distinguer sujet et GV | Construction : ordonner par clic ou glisser (construire) | Le petit écureuil cache des noisettes. |
| p8-g | Quels groupes appartiennent au groupe sujet ? | Repérer le sujet complet | Choix multiple : sélectionner (trier) | Les + oiseaux |
| p8-h | Quel groupe dit ce que fait Lina ? | Repérer le GV | Choix unique : sélectionner (analyser) | dessine un arbre |

## Niveau 9 — Ajouter des compléments (6H)

Prérequis : Distinguer groupe sujet et groupe verbal. Notions : complément de verbe (CV), complément de phrase (CP).

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l9-a | Enrichis la phrase avec le complément. | Ajouter un complément | Construction : ordonner par clic ou glisser | Le chat dort sur le canapé. |
| l9-b | Clique sur le complément. | Repérer un complément de verbe | Choix unique : sélectionner | la fenêtre |
| l9-c | Construis la phrase enrichie. | Distinguer plusieurs compléments | Construction : ordonner par clic ou glisser | Les enfants jouent dans la cour après la classe. |
| p9-a | Ajoute le lieu à la phrase. | Repérer une indication de lieu | Construction : ordonner par clic ou glisser (construire) | Nina chante dans le jardin. |
| p9-b | Ajoute le moment. | Repérer une indication de temps | Construction : ordonner par clic ou glisser (construire) | Le train arrive ce soir. |
| p9-c | Quel groupe complète directement « mange » ? | Repérer un complément de verbe | Choix unique : sélectionner (analyser) | une pomme |
| p9-d | Quels ajouts indiquent un lieu ? | Repérer une indication de lieu | Choix multiple : sélectionner (trier) | près du lac + sous la table |
| p9-e | Enrichis la phrase avec deux informations. | Distinguer plusieurs compléments | Construction : ordonner par clic ou glisser (construire) | Les voisins discutent sur le balcon le soir. |
| p9-f | Quel ajout répond à « quand ? » ? | Repérer une indication de temps | Choix unique : sélectionner (completer) | après l’école |
| p9-g | Ajoute un complément à la phrase. | Repérer un complément de verbe | Construction : ordonner par clic ou glisser (construire) | La joueuse lance la balle. |
| p9-h | Quel complément peut être déplacé en début de phrase ? | Repérer un complément de phrase | Choix unique : sélectionner (analyser) | dans la cour |
| p9-i | Compare « la balle » et « dans la cour » : lequel est un complément de verbe (CV) ? | Repérer un complément de verbe | Choix unique : sélectionner (comparer) | la balle |

## Niveau 10 — Lieu, temps et manière (6H–7H)

Prérequis : Reconnaître un complément. Notions : valeur de lieu, valeur de temps, valeur de manière.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l10-a | Quel bloc indique le lieu ? | Repérer une indication de lieu | Choix unique : sélectionner | dans la forêt |
| l10-b | Quel bloc indique le temps ? | Repérer une indication de temps | Choix unique : sélectionner | après le repas |
| l10-c | Quel bloc indique la manière ? | Repérer une indication de manière | Choix unique : sélectionner | doucement |
| p10-a | Qu’est-ce qui indique la manière ? | Repérer une indication de manière | Choix unique : sélectionner (analyser) | avec soin |
| p10-b | Quel groupe indique un moment ? | Repérer une indication de temps | Choix unique : sélectionner (analyser) | pendant la nuit |
| p10-c | Quel groupe indique un endroit ? | Repérer une indication de lieu | Choix unique : sélectionner (analyser) | dans la cave |
| p10-d | Sélectionne les deux compléments de temps. | Repérer une indication de temps | Choix multiple : sélectionner (trier) | le mercredi + à midi |
| p10-e | Sélectionne les deux compléments de manière. | Repérer une indication de manière | Choix multiple : sélectionner (trier) | lentement + avec précision |
| p10-f | Dans la phrase, quel groupe indique le lieu ? | Repérer une indication de lieu | Choix unique : sélectionner (analyser) | sur la piste |
| p10-g | Dans la phrase, quel mot indique la manière ? | Repérer une indication de manière | Choix unique : sélectionner (analyser) | calmement |
| p10-h | Construis une phrase qui précise comment le facteur marche. | Repérer une indication de manière | Construction : ordonner par clic ou glisser (construire) | Le facteur marche calmement. |

## Niveau 11 — Transformer les phrases (7H)

Prérequis : Maîtriser l’ordre de la phrase simple. Notions : forme positive, forme négative, type déclaratif, type interrogatif.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l11-a | Transforme la phrase en phrase négative. | Reconnaître ou former une négation | Construction : ordonner par clic ou glisser | Le chat ne dort pas. |
| l11-b | Construis la question. | Reconnaître ou former une question | Construction : ordonner par clic ou glisser | Est-ce que tu viens ? |
| l11-c | Choisis la phrase interrogative. | Reconnaître ou former une question | Choix unique : sélectionner | Est-ce que les enfants jouent ? |
| p11-a | Transforme « Lina chante. » à la forme négative. | Reconnaître ou former une négation | Construction : ordonner par clic ou glisser (transformer) | Lina ne chante pas. |
| p11-b | Pose la question avec « Est-ce que ». | Reconnaître ou former une question | Construction : ordonner par clic ou glisser (transformer) | Est-ce que vous jouez ? |
| p11-c | Quelles phrases sont négatives ? | Reconnaître ou former une négation | Choix multiple : sélectionner (trier) | Le soleil ne brille pas. + Les oiseaux ne chantent plus. |
| p11-d | Quelles phrases posent une question ? | Reconnaître ou former une question | Choix multiple : sélectionner (trier) | Tu viens ? + Est-ce qu’il pleut ? |
| p11-e | Quel mot complète « Je ne joue … » ? | Reconnaître ou former une négation | Choix unique : sélectionner (completer) | pas |
| p11-f | Mets « Le chien aboie. » à la forme négative. | Reconnaître ou former une négation | Construction : ordonner par clic ou glisser (transformer) | Le chien n’ aboie pas. |
| p11-g | Quel signe termine une question écrite ? | Reconnaître ou former une question | Choix unique : sélectionner (analyser) | ? |
| p11-h | Quelle transformation garde le sens de « Tu dessines. » en question ? | Reconnaître ou former une question | Choix unique : sélectionner (transformer) | Est-ce que tu dessines ? |

## Niveau 12 — Pronoms et accords (7H–8H)

Prérequis : Identifier le groupe sujet et le verbe. Notions : pronom sujet, accord sujet-verbe.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l12-a | Remplace « Les filles » par un pronom. | Remplacer un sujet par un pronom | Choix unique : sélectionner | Elles |
| l12-b | Choisis le verbe accordé avec « Nous ». | Accorder sujet et verbe | Choix unique : sélectionner | jouons |
| l12-c | Construis la phrase avec le pronom sujet. | Accorder sujet et verbe | Construction : ordonner par clic ou glisser | Ils construisent un nid. |
| p12-a | Remplace « Les garçons » par un pronom. | Remplacer un sujet par un pronom | Choix unique : sélectionner (completer) | Ils |
| p12-b | Remplace « La fleur » par un pronom. | Remplacer un sujet par un pronom | Choix unique : sélectionner (completer) | Elle |
| p12-c | Complète « Vous … une chanson. ». | Accorder sujet et verbe | Choix unique : sélectionner (completer) | chantez |
| p12-d | Quels accords sont corrects ? | Accorder sujet et verbe | Choix multiple : sélectionner (trier) | Nous lisons. + Il écoute. |
| p12-e | Construis une phrase au pluriel. | Accorder sujet et verbe | Construction : ordonner par clic ou glisser (construire) | Elles préparent un spectacle. |
| p12-f | Quel pronom remplace « Le vieux pont » ? | Remplacer un sujet par un pronom | Choix unique : sélectionner (completer) | Il |
| p12-g | Quel verbe convient à « Mes amies… » ? | Accorder sujet et verbe | Choix unique : sélectionner (completer) | viennent |
| p12-h | Assemble une phrase avec « nous ». | Accorder sujet et verbe | Construction : ordonner par clic ou glisser (construire) | Nous observons les étoiles. |

## Niveau 13 — Reconnaître les sujets complexes (8H)

Prérequis : Maîtriser sujet, pronom et accord sujet-verbe. Notions : sujet long, sujet inversé, accord à distance.

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l13-a | Sélectionne tout le sujet. | Identifier un sujet long | Choix multiple : sélectionner | Le petit garçon + de la classe |
| l13-b | Quel groupe est le sujet du verbe « arrivent » ? | Identifier un sujet inversé | Choix unique : sélectionner | les élèves |
| l13-c | Choisis le verbe bien accordé. | Accorder avec un sujet long | Choix unique : sélectionner | poussent |
| p13-a | Sélectionne le sujet complet. | Identifier un sujet long | Choix multiple : sélectionner (analyser) | Les oiseaux + du grand jardin |
| p13-b | Dans cette phrase, quel groupe est sujet ? | Identifier un sujet inversé | Choix unique : sélectionner (analyser) | les bateaux |
| p13-c | Quel verbe convient au sujet long ? | Accorder avec un sujet long | Choix unique : sélectionner (completer) | arrivent |
| p13-d | Construis une phrase à sujet inversé. | Identifier un sujet inversé | Construction : ordonner par clic ou glisser (construire) | Dans le ciel passent de grands oiseaux. |
| p13-e | Quel est le noyau du sujet ? | Identifier un sujet long | Choix unique : sélectionner (analyser) | fleurs |
| p13-f | Quel verbe convient dans « Au loin … les cloches » ? | Accorder avec un sujet inversé | Choix unique : sélectionner (completer) | sonnent |
| p13-g | Sélectionne toutes les parties du sujet. | Identifier un sujet long | Choix multiple : sélectionner (analyser) | La petite maison + au toit rouge |
| p13-h | Quelles phrases ont un sujet après le verbe ? | Identifier un sujet inversé | Choix multiple : sélectionner (trier) | Dans la cour jouent les enfants. + Au loin brillent deux étoiles. |

## Niveau 14 — Construire des phrases enrichies (8H)

Prérequis : Avoir travaillé les niveaux 1 à 13. Notions : phrase enrichie, complément de verbe direct (CVD), complément de verbe indirect (CVI), complément de phrase (CP).

| ID | Exercice | Objectif | Action et type | Réponse codée |
|---|---|---|---|---|
| l14-a | Construis la phrase enrichie. | Analyser ou enrichir une phrase | Construction : ordonner par clic ou glisser | Le petit renard roux traverse rapidement la forêt au lever du jour. |
| l14-b | Construis une phrase avec un sujet inversé. | Identifier un sujet inversé | Construction : ordonner par clic ou glisser | Au sommet de la colline se dressent deux grands sapins. |
| l14-c | Construis la phrase négative enrichie. | Analyser ou enrichir une phrase | Construction : ordonner par clic ou glisser | Les jeunes explorateurs ne traversent jamais la rivière sans prudence. |
| p14-a | Construis une phrase avec lieu et temps. | Analyser ou enrichir une phrase | Construction : ordonner par clic ou glisser (construire) | Les jeunes musiciens répètent dans la salle ce soir. |
| p14-b | Enrichis la phrase avec une manière. | Analyser ou enrichir une phrase | Construction : ordonner par clic ou glisser (construire) | La petite équipe prépare soigneusement un spectacle. |
| p14-c | Sélectionne les compléments de phrase. | Distinguer plusieurs compléments | Choix multiple : sélectionner (analyser) | la nuit + avec attention |
| p14-d | Quelles phrases enrichies sont bien accordées ? | Accorder sujet et verbe | Choix multiple : sélectionner (trier) | Les petits renards traversent la forêt. + Une jeune fille marche doucement. |
| p14-e | Construis une phrase négative enrichie. | Analyser ou enrichir une phrase | Construction : ordonner par clic ou glisser (transformer) | Les enfants ne jouent pas dehors ce soir. |
| p14-f | Quel verbe convient au sujet enrichi ? | Accorder avec un sujet long | Choix unique : sélectionner (completer) | observent |
| p14-g | Place le sujet après le verbe dans la phrase de la vallée. | Identifier un sujet inversé | Construction : ordonner par clic ou glisser (construire) | Dans la vallée avancent trois grands chevaux. |
| p14-h | Quel groupe est le sujet complet ? | Identifier un sujet inversé | Choix unique : sélectionner (analyser) | les oiseaux de la forêt |
| p14-i | Dans « Lina offre un livre à Sami », quel groupe est le CVD ? | Identifier un CVD | Choix unique : sélectionner (analyser) | un livre |
| p14-j | Quel groupe est le CVI dans cette phrase ? | Identifier un CVI | Choix unique : sélectionner (analyser) | à leur maîtresse |
| p14-k | Quels groupes sont des compléments de phrase (CP) dans cette phrase ? | Repérer un complément de phrase | Choix multiple : sélectionner (trier) | ce matin + dans la classe |
