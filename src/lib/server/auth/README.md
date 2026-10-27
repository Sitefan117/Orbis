# auth

**Rôle du dossier :** Empreintes du mot de passe enseignant.

## Fichiers

- **[`password-hash.ts](./password-hash.ts)** — Crée et vérifie les empreintes des mots de passe.  
  Dépend de : `node:crypto` (bibliothèque intégrée à Node.js).
- **[`print-teacher-hash.ts](./print-teacher-hash.ts)** — Commande pour produire une empreinte de mot de passe.  
  Dépend de : `src/lib/server/auth/password-hash.ts`.
