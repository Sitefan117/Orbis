# src

**Rôle du dossier :** Application SvelteKit : configuration, styles et zones principales du site.

## Sous-dossiers

| Dossier | Rôle |
|---|---|
| [`lib/`](./lib/README.md) | Fonctions et composants réutilisables, séparés des pages. |
| [`routes/`](./routes/README.md) | Pages et routes HTTP du site. |

## Fichiers

- **[`app.css](./app.css)** — Styles globaux et variables de couleurs.  
  Dépend de : aucun import direct détecté.
- **[`app.html](./app.html)** — Modèle HTML où SvelteKit insère la page.  
  Dépend de : aucun import direct détecté.
- **[`hooks.server.ts](./hooks.server.ts)** — Redirige les anciennes adresses vers les routes actuelles.  
  Dépend de : `@sveltejs/kit` (dépendance npm).

## Repère de navigation

Pages : `routes/`. Services communs : `lib/orbis/`. Règles propres aux jeux : `lib/games/`. Code serveur : `lib/server/`.
