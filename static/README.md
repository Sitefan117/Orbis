# Fichiers publiés

**Rôle du dossier :** ressources servies telles quelles par le site, par exemple les cours HTML, les images et les sons. Les moteurs des jeux restent dans `src/lib/games/`.

## Sous-dossiers importants

| Dossier | Rôle |
|---|---|
| [`cours/`](./cours/README.md) | Cahiers HTML et corrigés de mathématiques. |
| [`fractionstower2/`](./fractionstower2/README.md) | Supports historiques de fractions et images du jeu. |
| [`learning-lab/`](./learning-lab/README.md) | Anciennes pages HTML autonomes de géométrie. |
| `audio/`, `images/`, `assets/` | Ressources graphiques ou sonores utilisées par les pages. |

Les illustrations de Mesurovia sont classées dans [`images/mesurovia/`](./images/mesurovia/README.md). Les pages les chargent avec le préfixe SvelteKit afin que les chemins fonctionnent aussi sur GitHub Pages.

Les chemins publics commencent par `/` ; avec GitHub Pages, le préfixe de déploiement est ajouté par l’application.
