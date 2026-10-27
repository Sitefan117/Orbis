# Décors des étages

**Rôle du dossier :** arrière-plans illustrés et locaux des neuf étages prévus dans Fractions Tower.

## Fichiers

- **`01-partage.jpg`** — salle du partage équitable.
- **`02-representations.jpg`** — bibliothèque des représentations.
- **`03-droite-graduee.jpg`** — observatoire de la droite graduée.
- **`04-equivalences.jpg`** — atelier des fractions équivalentes.
- **`05-comparer.jpg`** — salle des balances et de la comparaison.
- **`06-decimaux.jpg`** — serre des fractions décimales.
- **`07-addition.jpg`** — boulangerie des additions et soustractions.
- **`08-denominateurs.jpg`** — atelier des dénominateurs communs.
- **`09-multiplication.jpg`** — laboratoire des multiplications et divisions.

La page `src/routes/fractionstower2/play/+page.svelte` sélectionne le décor à partir de l’identifiant `floor-N`. Les JPG regroupent le décor peint, les murs, les escaliers et les ornements afin d’éviter une mosaïque d’images superposées. Chaque salle réserve quatre alcôves aux personnages d’activité, un espace central, un escalier nord, un piédestal à parchemin et un escalier sud. Les fichiers ont été convertis en JPG pour réduire leur poids de chargement. Les collisions et interactions restent définies dans `src/lib/games/fractionstower2/game/FloorManager.ts`. Les neuf étages sont jouables ; l’étage 9 traite de la multiplication et de la division des fractions.
