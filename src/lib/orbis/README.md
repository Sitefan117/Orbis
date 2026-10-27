# orbis

**Rôle du dossier :** services transversaux facultatifs : catalogue, profil, persistance et résultats.

## Sous-dossiers

| Dossier | Rôle |
|---|---|
| [`catalog/`](./catalog/README.md) | Catalogue des jeux et cours, chemins des documents. |
| [`identity/`](./identity/README.md) | Identification locale de l’élève. |
| [`persistence/`](./persistence/README.md) | Stockage local et synchronisation Supabase facultative. |
| [`progress/`](./progress/README.md) | Contrat de progression commun minimal. |
| [`results/`](./results/README.md) | Contrat et envoi des bilans d’activité. |
| [`teacher/`](./teacher/README.md) | Composants du suivi enseignant. |
| [`tracking/`](./tracking/README.md) | Interface commune appelée par tous les jeux intégrés. |

## Repère d’intégration

Les jeux gardent leurs moteurs et sauvegardes. Les modules Orbis sont facultatifs ; voir `progress/contract.ts` et `results/contract.ts`.
