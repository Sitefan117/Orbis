# Audit des questions de Fraction Tower

## Résultat

Les neuf étages sont actifs. La progression normale ouvre l’étage suivant après la victoire du boss précédent ; le parchemin de téléportation accepte aussi les codes des étages 1 à 9. L’étage 9 dispose de son décor, de son cours, de son entraînement et de son combat de boss.

## Revue par étage

| Étage | Notion | Vérifications et améliorations |
|---|---|---|
| 1 | Partage équitable | L’entraînement et le boss spécial utilisent une sélection multiple de quatre dessins distincts ; de 1 à 4 sont corrects. Les mauvaises réponses montrent des parts inégales ou un nombre de parts coloriées incorrect. |
| 2 | Lire et représenter | Les consignes décrivent explicitement la quantité coloriée. L’activité d’images réemploie le modèle de partage et les aides rappellent le rôle du numérateur et du dénominateur. |
| 3 | Droite graduée | Les exercices interactifs et les QCM parlent de graduations ; les images hors sujet ont été remplacées par des placements sur la droite. L’aide compte les intervalles depuis zéro. |
| 4 | Équivalence et simplification | Les numérateurs et dénominateurs sont multipliés ou divisés par un facteur commun. Les pistes indiquent le diviseur réellement utilisable. |
| 5 | Comparaison et ordre | Comparaisons à dénominateur commun, à numérateur commun, à deux composantes différentes, équivalences et classement de trois fractions. Le classement attend une chaîne dans l’ordre croissant. |
| 6 | Fractions décimales | Conversions dans les deux sens et comparaisons aux rangs des dixièmes, centièmes et millièmes. Les explications précisent le nombre de chiffres après la virgule. |
| 7 | Addition et soustraction, même dénominateur | Les calculs conservent le dénominateur et les valeurs de soustraction restent positives. Les QCM proposent aussi le choix du dénominateur. |
| 8 | Dénominateurs différents | Les calculs construisent un dénominateur commun par équivalence ; les soustractions ordonnent les valeurs pour éviter les résultats négatifs accidentels. Les égalités utilisent des écritures différentes. |
| 9 | Multiplication et division | Produits, division par l’inverse, choix de règle, fractions d’une collection et partage d’une longueur de ruban. Les anciennes questions de coloriage sans rapport avec ces opérations ont été retirées. |

## Aides et retours

- Une aide graphique n’est affichée que lorsqu’une seule fraction ou un seul nombre décimal est explicite dans la consigne. Elle ne transforme plus arbitrairement deux nombres d’un énoncé en fraction.
- Les consignes de comparaison et de calcul à plusieurs fractions affichent plutôt la piste textuelle propre à la méthode.
- Le combat de boss affiche également une piste après une erreur, sans donner immédiatement la réponse.
- Le boss spécial de l’étage 1 évite de reposer une fraction déjà vue pendant le combat et donne une piste adaptée à la question.
- Pour les sélections d’images, l’aide montre un exemple juste et rappelle qu’il faut compter des parts de même taille.

## Base pédagogique et limites

La sélection d’images cible les deux idées nécessaires à une fraction partie-tout : l’unité doit être partagée en parts égales, puis le numérateur compte les parts retenues. C’est une déduction de conception à partir d’études sur le partage égal et la compréhension des fractions, pas une validation expérimentale de Fraction Tower. Pour la droite graduée, les résultats publiés soutiennent une pratique avec retour explicatif plutôt qu’une répétition sans retour. La génération et les réponses du jeu sont vérifiées automatiquement ; il faudra encore observer des élèves pour mesurer si les aides et la difficulté leur conviennent réellement.

- [Yoshida, 2002 — equal-partitioning and equal-whole](https://onlinelibrary.wiley.com/doi/full/10.1111/1468-5884.00021)
- [Fuchs et al. — Improving Children’s Knowledge of Fraction Magnitudes](https://pmc.ncbi.nlm.nih.gov/articles/PMC5074569/)
- [Fuchs et al. — Error Patterns in Ordering Fractions](https://pmc.ncbi.nlm.nih.gov/articles/PMC5018237/)

## Vérifications automatisées

`tests/fractionstower2-generator.test.ts` génère 540 sessions sur les neuf étages et contrôle les doublons dans une séance, la présence des bonnes réponses dans les QCM, les comparaisons, les calculs, les conversions décimales, les quatre images distinctes et la correspondance entre dessins justes et fraction cible. Ces tests ne remplacent pas un essai auprès d’élèves.
