# Référence IA — conception de cours hybrides et de web-apps fondée sur les preuves

Version du 1er novembre 2026. Ce document fusionne la revue fournie par NotebookLM dans la conversation avec le [corpus de 30 publications](ETUDES-VERIFIEES.md). Le contenu utile et les points de désaccord sont consignés ci-dessous. Ce texte sert de contexte à une IA qui créera des cours, dossiers d’apprentissage ou applications. Il ne remplace pas la lecture des études primaires avant toute affirmation précise.

## 1. Mission et public

- Concevoir pour l’école suisse romande, en priorité en mathématiques, puis français langue de scolarisation, allemand et anglais langues étrangères.
- Le public désigné combine deux critères à vérifier pour chaque projet : années HarmoS **6H à 9H** et élèves **12 à 15 ans**. Ces critères ne coïncident pas exactement ; ne pas supposer que tous les élèves de 6H ont 12 ans ou que tous les élèves de 9H ont 15 ans. Demander le degré, l’âge réel et le niveau de maîtrise au début d’une création concrète.
- Certains élèves ont un retard sur les attendus. Prévoir un diagnostic discret des prérequis, des retours en arrière possibles, des variantes de difficulté et des aides non stigmatisantes.
- Produire selon la demande : cours, séquence, dossier papier-numérique, activité, cahier des charges ou web-app fonctionnelle. Le présent document soutient les choix ; il ne fixe pas une unique recette.
- Un livre sur la manière dont les élèves apprennent est dans le NotebookLM de l’utilisateur, mais son texte n’a pas été fourni ici. Ne pas lui attribuer d’arguments ni de citations.

## 2. Hiérarchie de preuve et mode d’emploi

Pour une proposition précise, indiquer le type de preuve, la population et la mesure : acquisition disciplinaire, motivation, engagement, transfert, maintien ou effet indésirable. Donner le plus de poids aux essais contrôlés en classe et aux synthèses méthodologiquement solides portant sur un âge et une discipline proches. Les méta-analyses générales aident à cadrer, mais leur taille d’effet ne se transpose pas directement à une application particulière. Une revue narrative et un rapport institutionnel donnent contexte et hypothèses ; une enquête corrélationnelle ne démontre pas la causalité.

Étiquettes à employer dans le raisonnement de l’IA :

- **Établi pour une intervention proche** : résultat directement mesuré dans plusieurs études comparables ou dans un essai rigoureux proche du terrain.
- **Prometteur sous conditions** : résultat favorable, mais intervention multicomposante, comparateur faible ou transfert incertain.
- **Choix de conception à tester** : décision raisonnable dérivée des résultats, non directement démontrée.
- **À vérifier** : référence, chiffre, généralisation ou mécanisme non contrôlé.

Ne jamais additionner les études incluses dans plusieurs méta-analyses pour annoncer un nombre de participants « total ». Ne pas comparer des valeurs *g*, *d*, points PISA et « mois de progrès » comme si elles avaient la même unité. La qualité de l’étude, la pertinence du comparateur, l’âge et la discipline importent plus que la grandeur apparente du chiffre.

## 3. Énoncés directeurs pondérés

### 3.1 Numérique et résultats en mathématiques

La méta-analyse de [Hillmayr et al. (2020)](https://doi.org/10.1016/j.compedu.2020.103897) porte sur 92 comparaisons au secondaire en mathématiques et sciences ; elle indique un effet moyen positif (*g* = 0,65), une différence selon le type d’outil et un rôle de la formation des enseignants. [Cheung et Slavin (2013)](https://doi.org/10.1016/j.edurev.2013.01.001) trouvent un effet moyen beaucoup plus modeste (+0,15 dans le résumé éditorial) dans 74 études K–12 de mathématiques. [Rakes et al. (2020)](https://doi.org/10.1016/j.edurev.2020.100337) rapportent des effets petits et sensibles aux ajustements pour biais de publication. Ces résultats ne s’annulent pas : corpus, critères d’inclusion, comparateurs et analyses diffèrent. Ils interdisent une promesse universelle du type « toute activité numérique améliore les maths ».

Un [essai randomisé de 43 écoles et 2 850 élèves de 7e année](https://doi.org/10.1177/2332858416673968) teste ASSISTments avec devoirs, indices, retour pour l’enseignant et formation ; il trouve un meilleur résultat scolaire (Roschelle et al., 2016). L’intervention est un ensemble : ne pas attribuer l’effet à un seul bouton de l’interface.

**Décision à tester** : pour une nouvelle séquence, comparer les acquis avant/après sur une tâche nouvelle et garder l’enseignement, la discussion et la correction en classe. Documenter aussi le temps enseignant et le temps élève.

### 3.2 Adaptation et élèves en difficulté

[Major et al. (2021)](https://doi.org/10.1111/bjet.13116) synthétisent l’apprentissage personnalisé assisté par technologie **dans des pays à revenu faible ou intermédiaire**. L’ajustement au niveau de l’élève est associé à un effet plus favorable (0,35 dans la méta-régression) que des formes de personnalisation moins liées aux acquis. La transférabilité à une classe suisse n’est pas automatique. La valeur 0,65 attribuée sans contexte à cette étude dans NotebookLM reste à revérifier avant emploi.

En mathématiques K–12, [Steenbergen-Hu et Cooper (2013)](https://doi.org/10.1037/a0032447) trouvent pour les systèmes tutoriels intelligents des effets moyens proches de zéro à petits (*g* = 0,01 à 0,09), et moins favorables chez les élèves peu performants. Une synthèse plus large et multispécialité trouve des effets variables selon le comparateur : [Ma et al. (2014)](https://doi.org/10.1037/a0037123) rapporte *g* = 0,42 par rapport à un grand groupe avec enseignant, mais environ 0,05 par rapport à un petit groupe. [Benavides-Varela et al. (2020)](https://doi.org/10.1016/j.compedu.2020.103953) trouvent un effet favorable des interventions numériques chez les enfants ayant des difficultés mathématiques, surtout au préscolaire/primaire, sans avantage établi des jeux vidéo sur le tutorat ou l’exercice numérique. [Myers et al. (2021)](https://doi.org/10.1111/ldrp.12244) trouvent un effet moyen pour un ensemble d’interventions destinées aux adolescents en difficulté ; ce dernier chiffre n’est **pas** l’effet du seul numérique.

**Décision à tester** : diagnostiquer les prérequis, proposer de petites marches, laisser l’enseignant modifier les parcours et éviter l’assignation automatique irréversible. Pour l’adaptation, mesurer spécialement les progrès des élèves initialement faibles ; ne pas supposer qu’ils bénéficieront le plus de l’algorithme.

### 3.3 Feedback

La méta-analyse de [van der Kleij et al. (2015)](https://doi.org/10.3102/0034654314564881) compare des formats de retour informatisé. Les estimations rapportées sont plus élevées pour le feedback élaboré (0,49) que pour « correct/incorrect » (0,05), avec différences selon la tâche et le niveau. Cela justifie des explications ou indices ciblés, sans rendre obligatoire un ordre fixe de trois indices pour chaque notion.

En lecture numérique au secondaire, [Mañá et al. (2026)](https://doi.org/10.1016/j.lindif.2025.102818) observent des réponses différentes selon les grades : le feedback élaboré profite davantage aux plus jeunes de leur échantillon, le feedback correctif aux plus âgés. **Contradiction utile** : le feedback détaillé n’est pas toujours optimal ; son contenu, le niveau de l’élève et la possibilité de relire comptent.

**Décision à tester** : fournir une indication sur l’erreur ou la stratégie, puis laisser refaire une tâche apparentée ; vérifier la réussite différée sans aide. Autoriser l’enseignant à choisir entre indice court, explication et solution développée.

### 3.4 Gamification et jeux sérieux

Une [méta-analyse générale](https://doi.org/10.1007/s10648-019-09498-w) trouve des effets moyens positifs sur les acquis cognitifs (*g* = 0,49), la motivation (*g* = 0,36) et le comportement (*g* = 0,25), avec hétérogénéité et robustesse moindre pour certains résultats (Sailer & Homner, 2020). Il est incorrect d’écrire que l’effet cognitif 0,49 est « plus modéré » que l’effet motivationnel 0,36 sur la seule base de ces chiffres. Il est également trop fort de dire que la gamification augmente **systématiquement** l’engagement.

La [revue K–12 de 54 études](https://doi.org/10.1111/bjet.13335) recense aussi des résultats neutres ou négatifs (Dehghanzadeh et al., 2024). En maths secondaire et supérieur, [Ratinho et al. (2026)](https://doi.org/10.1007/s10648-025-10108-1) trouvent un effet sur la **motivation**, sur 11 études quantitativement exploitables ; ils ne démontrent pas l’acquisition mathématique. Une [méta-analyse de cinq études de gamification au secondaire](https://doi.org/10.21831/jpms.v14i2.96112) donne un estimateur positif, mais un intervalle de confiance couvrant zéro et une forte hétérogénéité (Vega et al., 2026). Les jeux numériques complets et la gamification d’exercices ordinaires sont des interventions distinctes.

**Décision à tester** : offrir des défis et une progression personnelle, utiliser la coopération si pertinente, ne pas imposer de classement public ou de minuteur agressif aux élèves fragiles. Ces choix sont des précautions de conception ; leur effet dans cette classe devra être mesuré. Mesurer l’apprentissage sur un exercice non ludifié et la motivation avec un instrument distinct.

### 3.5 Papier, écran, lecture et langues

[Delgado et al. (2018)](https://www.sciencedirect.com/science/article/pii/S1747938X18300101) comparent la compréhension de textes similaires sur papier et écran ; leur résultat concerne **la lecture**, pas toutes les démonstrations ou problèmes mathématiques. Le partage strict « papier = réfléchir / numérique = automatiser » de NotebookLM est une **heuristique de conception**, pas une loi expérimentale. Tester l’utilité de l’écrit manuscrit pour le problème donné ; réserver le numérique aux interactions qui ajoutent réellement quelque chose.

En lecture au secondaire, [Cheung et Shi (2026)](https://www.sciencedirect.com/science/article/pii/S1747938X26000035) rapportent un effet moyen modeste (0,15) des technologies chez les lecteurs en difficulté. Pour les langues secondes, la [méta-analyse de Dixon et al. (2022)](https://doi.org/10.64152/10125/73464) traite des gains par jeux numériques ; ses sous-groupes, le décompte des études et ses tailles d’effet précis doivent être vérifiés dans le texte intégral avant reprise des chiffres de NotebookLM. Une [revue de 21 études](https://doi.org/10.3390/bs13040331) trouve des résultats positifs, négatifs et nuls pour la gamification en langues étrangères (Luo, 2023). Il manque encore une preuve directe pour le français langue première et l’allemand de cette classe.

**Décision à tester** : distinguer vocabulaire, compréhension, production écrite, oral et grammaire ; utiliser des évaluations propres à chaque objectif. Prévoir la révision des textes et l’accès papier lorsque la tâche le justifie.

### 3.6 Distraction, équité, données et rôle de l’enseignant

Le [rapport PISA 2022, volume II](https://www.oecd.org/en/publications/pisa-2022-results-volume-ii_a97db61c-en.html) indique qu’environ 30 % des élèves déclarent être distraits par leurs appareils en cours de mathématiques. Ce résultat est observationnel ; il ne fixe pas un seuil universel d’une heure et ne démontre pas une perte de 15 points causée par l’appareil. Le [rapport UNESCO 2023](https://www.unesco.org/gem-report/en/publication/technology) examine aussi l’équité, l’accès, la formation, la vie privée et les effets indésirables. Ces rapports aident à cadrer les risques ; ils ne valident pas une application précise.

**Décision à tester** : écran dépouillé, notifications désactivées, activité délimitée, fonctionnement accessible et minimisation des données. Le tableau de bord enseignant doit montrer les erreurs utiles à l’intervention, sans surveillance excessive ni classement public.

## 4. Apports du document NotebookLM à conserver comme hypothèses

Le document propose trois familles de cadres : charge cognitive, autodétermination et modèles d’intégration pédagogique. Les deux premières peuvent éclairer le design et les hypothèses. TPACK décrit des connaissances requises pour enseigner avec la technologie ; SAMR est une grille descriptive de transformation des tâches, **pas une preuve qu’un niveau « supérieur » produit nécessairement plus d’apprentissage**. Le « modèle H-PAG » est une construction proposée dans la sortie NotebookLM ; ne pas le citer comme théorie validée extérieurement.

Idées prometteuses à prototyper : balance interactive pour l’égalité, droite numérique et modèles d’aires pour les fractions, géométrie dynamique, journal d’erreurs, QR code ouvrant une manipulation utile, progression individuelle, possibilité de refaire une activité sans exposition sociale. Définir pour chacune l’objectif conceptuel, le résultat mesuré, l’alternative papier, le coût en temps et le risque de distraction. Le nombre « deux clics maximum », les « trois niveaux de feedback », l’écrit préalable **obligatoire** et les durées fixes de 2–4 ou 8–12 semaines ne sont pas des seuils scientifiques établis par les sources contrôlées ici.

Le rapport [Cnesco de Grugeon-Allys et Grapin (2020)](https://www.cnesco.fr/fr/ressources/apport-numerique-enseignement-apprentissage-nombres-calcul-algebre/) existe et fournit un angle didactique francophone pertinent. Ne pas transformer ses exemples de nombres, calcul et algèbre en preuve d’une efficacité mesurée d’une future balance virtuelle particulière sans examen du passage correspondant.

## 5. Registre des désaccords et corrections documentaires

| Point | NotebookLM | Corpus / vérification | Position provisoire |
|---|---|---|---|
| Effet général | *g* = 0,65 présenté comme effet du numérique en maths | Hillmayr mélange maths et sciences ; Cheung & Slavin : +0,15 dans le résumé éditorial ; Rakes : sensible au biais | Bénéfice possible, ampleur incertaine |
| Adaptation | Supériorité nette et généralisable aux élèves en retard suisses | Major : pays à revenu faible/intermédiaire ; Steenbergen-Hu & Cooper : effet faible et faibles élèves pas forcément avantagés | Piloter et mesurer par profil |
| Gamification | Motivation systématique ; effets cognitifs garantis si jeu bien aligné | Effets hétérogènes ; études négatives/neutres ; Ratinho mesure motivation | Séparer motivation et maîtrise |
| Fiction | Présentée comme l’un des ingrédients les plus efficaces | Les effets dépendent du résultat et du contexte chez Sailer & Homner | Option de design, non impératif |
| Feedback | Toujours détaillé et en trois paliers | Méta-analyse favorable aux explications, mais Mañá trouve des différences selon l’âge | Adapter à la tâche et vérifier |
| Papier | Nécessaire pour toute preuve ou résolution complexe | Études papier/écran surtout sur lecture de textes | Hypothèse pratique à tester |
| Enseignant | « Multiplie par deux » l’effet | Hillmayr signale une modération par la formation, pas un coefficient universel de 2 | Prévoir formation, éviter le multiplicateur |
| Distraction | Seuil d’une heure ; −15 points = trois quarts d’année | PISA décrit des associations, pas un seuil causal général ; conversion à vérifier | Éviter chiffres et causalité non établis |
| Âge / année | 12–15 ans = 6H–9H | Équivalence inexacte | Décrire âge et année séparément |
| Référence PISA | « OCDE (2023), volume V » | Le volume V est publié en **2024** ; le volume II date de 2023 | Corriger titre, volume et année selon l’énoncé |
| Cnesco | Rapport présenté comme preuve directe d’effet | Contribution didactique, à lire par section | Source de conception, niveau de preuve distinct |
| Bibliographie | Titre de Delgado et plusieurs chiffres demandent contrôle | Notice éditeur à comparer avant citation APA finale | Ne pas propager une notice incertaine |

## 6. Instructions opérationnelles pour une IA qui utilisera cette référence

1. Lire [SKILL.md](SKILL.md), ce document et le tableau des [30 publications](ETUDES-VERIFIEES.md) avant une conception fondée sur la recherche. Lire le texte primaire nécessaire si une valeur chiffrée ou une attribution précise sera publiée.
2. Demander ou inférer prudemment le degré HarmoS réel, l’âge, la notion, les prérequis, le temps disponible, le matériel et le résultat d’apprentissage. L’écart entre âge et degré n’est pas une erreur à « corriger » chez l’élève.
3. Produire une chaîne traçable : **besoin → objectif mesurable → activité papier/numérique → feedback → rôle enseignant → évaluation → preuve citée → limite**.
4. Écrire les citations à proximité des affirmations. Toute décision qui dépasse l’étude est explicitement nommée « déduction pédagogique » ou « à tester ».
5. Évaluer les acquis sur une tâche nouvelle et, si possible, à distance de l’activité. Mesurer séparément motivation, temps d’usage, réussite immédiate et transfert hors écran.
6. Inclure une alternative accessible et une vérification par l’enseignant. Réduire les données collectées sur les mineurs au nécessaire pour l’apprentissage.
7. Terminer toute synthèse scientifique par un tableau des études effectivement citées, avec âge/degré, pays, méthode, comparateur, durée, effectif, résultat, taille d’effet si vérifiée, limites et utilité. Une valeur inconnue doit rester « non vérifiée » ; ne jamais la compléter par plausibilité.
8. Vérifier les chevauchements entre méta-analyses. Ne pas présenter 30 lignes de synthèses comme 30 expériences indépendantes.

## 7. Périmètre non résolu

Le corpus de 30 est un **inventaire raisonné**, sans évaluation indépendante de tous les textes intégraux. La bibliographie APA 7 complète, le pays et la durée de chaque étude primaire, et le risque de biais formalisé restent à consolider. La sortie NotebookLM n’expose pas ses sources internes ni les passages exacts du livre de l’utilisateur. Avant de transformer cette référence en guide humain, vérifier ces champs et séparer clairement les recommandations robustes des idées à expérimenter.
