# db

**Rôle du dossier :** Connexion, tables et initialisation de SQLite.

## Fichiers

- **[`client.ts](./client.ts)** — Ouvre SQLite et prépare les tables.  
  Dépend de : `src/lib/server/db/schema.ts`, `better-sqlite3` (dépendance npm), `drizzle-orm` (dépendance npm), `node:fs` (bibliothèque intégrée à Node.js), `node:path` (bibliothèque intégrée à Node.js).
- **[`migrate.ts](./migrate.ts)** — Commande d’initialisation de la base SQLite.  
  Dépend de : `src/lib/server/db/client.ts`.
- **[`schema.ts](./schema.ts)** — Décrit les tables SQLite.  
  Dépend de : `drizzle-orm` (dépendance npm).
