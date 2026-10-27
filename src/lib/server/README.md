# server

**Rôle du dossier :** Code exécuté côté serveur : résultats, authentification et base.

## Sous-dossiers

| Dossier | Rôle |
|---|---|
| [`auth/`](./auth/README.md) | Empreintes du mot de passe enseignant. |
| [`db/`](./db/README.md) | Connexion, tables et initialisation de SQLite. |

## Fichiers

- **[`activity-results.ts](./activity-results.ts)** — Enregistre les résultats et progressions côté serveur.  
  Dépend de : `src/lib/server/db/client.ts` — autre dossier, `src/lib/server/db/schema.ts` — autre dossier, `drizzle-orm` (dépendance npm).
- **[`teacher-auth.ts](./teacher-auth.ts)** — Vérifie le mot de passe et gère la session enseignant.  
  Dépend de : `src/lib/server/db/client.ts` — autre dossier, `src/lib/server/db/schema.ts` — autre dossier, `src/lib/server/auth/password-hash.ts` — autre dossier, `drizzle-orm` (dépendance npm), `node:crypto` (bibliothèque intégrée à Node.js).

## Publication

Ces éléments nécessitent un serveur SvelteKit. GitHub Pages statique ne peut pas exécuter SQLite ni les routes API.
