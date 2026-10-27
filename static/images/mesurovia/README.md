# Images de Mesurovia

**Rôle du dossier :** illustrations décoratives propres au jeu Mesurovia.

## Fichiers

- **`village-hero.jpg`** — paysage du moulin, du ruisseau et du château affiché sur l’écran d’accueil. Utilisé par `src/routes/mesurovia/+page.svelte`.
- **`maitre-mesuro.png`** — personnage-guide avec fond transparent, affiché dans la scène de classe et les explications de cours. Utilisé par `src/routes/mesurovia/+page.svelte`.
- **`eleves.png`** — trois élèves illustrés au premier plan de la scène de classe. Utilisé par `src/routes/mesurovia/+page.svelte`.
- [`regions/`](./regions/README.md) — paysages des trois autres régions. Avec `village-hero.jpg`, ils illustrent les quatre cartes de départ et l’en-tête de chaque village.
- [`villages/`](./villages/README.md) — quatre cartes illustrées complètes, avec maisons et habitants propres à chaque région ; la page conserve les zones de clic par-dessus.

Ces images n’ajoutent aucune dépendance réseau : elles sont publiées avec le site statique.
