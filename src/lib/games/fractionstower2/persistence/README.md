# persistence

**Rôle du dossier :** Langue, progression et sauvegardes locales.

## Fichiers

- **[`LanguageManager.ts](./LanguageManager.ts)** — Gère la langue sélectionnée.  
  Dépend de : aucun import direct détecté.
- **[`ProgressManager.ts](./ProgressManager.ts)** — Enregistre et relit la progression locale.  
  Dépend de : `src/lib/orbis/identity/local-student.ts` — autre dossier.
- **[`SaveManager.ts](./SaveManager.ts)** — Exporte et importe les sauvegardes.  
  Dépend de : `src/lib/games/fractionstower2/types/world.ts` — autre dossier.
