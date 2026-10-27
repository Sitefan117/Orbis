# routes

**Rôle du dossier :** Pages et routes HTTP du site.

## Sous-dossiers

| Dossier | Rôle |
|---|---|
| [`api/`](./api/README.md) | Points d’entrée HTTP pour les services serveur. |
| [`calculs/`](./calculs/README.md) | Page du jeu de calcul décimal. |
| [`conju_lab/`](./conju_lab/README.md) | Page de ConjuLab. |
| [`fractionstower2/`](./fractionstower2/README.md) | Accueil de Fraction Tower. |
| [`geometrie/`](./geometrie/README.md) | Page du jeu de géométrie. |
| [`livrets/`](./livrets/README.md) | Page des défis de multiplication. |
| [`mathhunt/`](./mathhunt/README.md) | Page de MathHunt. |
| [`mesurovia/`](./mesurovia/README.md) | Page de Mesurovia. |
| [`numeria/`](./numeria/README.md) | Page de Numéria. |
| [`pcp/`](./pcp/README.md) | Page du parcours professionnel PCP. |
| [`race/`](./race/README.md) | Page de Racer. |
| [`shift/`](./shift/README.md) | Page de Shift. |
| [`teacher/`](./teacher/README.md) | Ancien tableau local enseignant pour Fraction Tower. |

## Fichiers

- **[`+layout.svelte](./+layout.svelte)** — Charge les styles globaux pour toutes les pages.  
  Dépend de : `src/app.css` — autre dossier.
- **[`+layout.ts](./+layout.ts)** — Active le pré-rendu adapté à un hébergement statique.  
  Dépend de : aucun import direct détecté.
- **[`+page.svelte](./+page.svelte)** — Accueil Orbis, arcade et accès aux cours.  
  Dépend de : `src/lib/orbis/identity/local-student.ts` — autre dossier, `src/lib/orbis/catalog/games.ts` — autre dossier, `src/lib/orbis/catalog/courses.ts` — autre dossier, `svelte` (dépendance npm).
