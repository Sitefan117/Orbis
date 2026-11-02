# Bibliothèque de Noireau

Ce dossier rassemble les images de la mascotte pour les fiches et Orbis. Pour rechercher une pose ou intégrer une image, commence par ce fichier et par [`index.json`](./index.json), dont les chemins sont relatifs à ce dossier. Les copies d'origine restent à leur emplacement précédent.

## Choisir rapidement

| Besoin | Planche | Utilisation conseillée |
|---|---|---|
| Fiches ou cours en manga | [Manga général](./planches/manga-general-4x4.png) | 16 poses, dont expliquer, lire, réfléchir et encourager. |
| Impression noir et blanc | [Manga noir et blanc](./planches/manga-noir-blanc-4x2.png) | 8 poses en encrage monochrome. |
| Fiches en aplats | [Collage éditorial](./planches/collage-editorial-4x2.png) | 8 poses, présentation avec formes découpées. |
| Fiche numérique ou jeu rétro | [Pixel pédagogique](./planches/pixel-pedagogique-4x2.png) | 8 poses; sert aussi de série pour le Noireau pixel du catalogue. |
| Catalogue Orbis, accueil discret | [Guide complice](./planches/catalogue-guide-4x2.png) | 8 poses de guide, notamment accueil et indication. |
| Catalogue Orbis, entrée plus expressive | [Manga dynamique](./planches/catalogue-manga-4x2.png) | 8 poses avec accents colorés. |
| MathRacer | [Réactions MathRacer](./planches/mathracer-reactions-4x2.png) | Coach pour les menus, les retours et le bilan du jeu. |
| Mesurovia | [Variantes Mesurovia](./planches/mesurovia-noireau-6x1.png) | 6 apparences d'avatar. |
| ConjuFighter | [Combat Conju Lab](./planches/conju-lab-combat-4x3.png) | 12 poses de combat et de réaction. |

Les [illustrations individuelles](./illustrations/) comprennent aussi les trois propositions pour le catalogue et les références de style, dont une illustration noir et blanc pour l'impression.

## Repérer une pose

Dans les cinq nouvelles planches 4 × 2 — noir et blanc, collage, pixel pédagogique, guide et manga dynamique — les poses suivent le même ordre :

| Rangée | Colonne 1 | Colonne 2 | Colonne 3 | Colonne 4 |
|---|---|---|---|---|
| 1 | Accueillir | Saluer | Réfléchir | Présenter un choix |
| 2 | Montrer vers le bas | Petit « oups » | Encourager | Célébrer |

Les positions des autres planches sont détaillées dans `index.json`. Les indices de rangée et de colonne y commencent à 1. Pour choisir une image isolée sans découpage, utiliser les fichiers du dossier `illustrations/`.

## Consignes pour une IA qui intègre les images

- Chercher par contexte, style et pose dans `index.json`; lire la remarque associée avant de modifier du code.
- Les planches sont des collections de poses fixes, pas des séquences d'animation. Leurs grilles indiquent où chercher : vérifier les bords, les effets et l'alpha sur la pose choisie avant de la découper ou de l'afficher. La première planche manga n'a pas de cellules régulières.
- Dans Orbis, le catalogue est dans `src/routes/+page.svelte`; la route MathRacer est `src/routes/race/+page.svelte`. La planche MathRacer est destinée à son interface, pas à la scène 3D.
- Mesurovia utilise un atlas de six avatars dans `static/images/mesurovia/hero-atlas.png`. La nouvelle planche représente six versions de Noireau : adapter les choix et les identifiants pour conserver les personnages existants si souhaité.
- Conju Lab utilise `static/assets/conju-lab/arcade-sprite-sheet.png` et des positions CSS dans `src/routes/conju_lab/+page.svelte`. L'image actuelle inclut le personnage et le boss; la nouvelle ne contient que Noireau. Adapter la composition et l'association entre les poses et les états avant intégration.
- Préserver le confort de lecture : illustration secondaire, commandes et consignes dégagées; respecter les préférences de réduction des mouvements si une animation est ajoutée.

Ces fichiers sont des propositions graphiques; leur rendu dans les jeux et dans les fiches reste à vérifier lors de leur intégration.
