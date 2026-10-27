# Personnages de Fraction Tower

**Rôle du dossier :** illustrations transparentes des personnages affichés dans les salles de Fraction Tower.

## Fichiers

- **`hero.png`** — pose debout du personnage contrôlé par l’élève.
- **`hero-step.png`** — seconde pose affichée en alternance quand le personnage marche ; les deux images forment une animation légère sans mouvement décoratif permanent.
- **`guide-owl.png`** — Astre, qui ouvre le cours guidé.
- **`guide-classic.png`** — guide des cours classiques.
- **`trainer-fox.png`** — Renard, qui ouvre l’entraînement.
- **`boss-dragon.png`** — gardien des défis.
- **`stair-guardian.png`** — gardien qui explique pourquoi l’escalier nord est fermé ou ouvert.

Les images sont chargées par `src/routes/fractionstower2/play/+page.svelte`. Leur position et leur taille d’affichage sont réglées par le jeu ; elles ne changent ni les zones d’interaction ni les sauvegardes. L’animation du héros n’utilise que ses deux poses pendant un déplacement réel.
