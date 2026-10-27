# Préparer Supabase pour Orbis

Guide mis à jour le 27 octobre 2026 pour un projet Supabase **Free** et un site hébergé sur GitHub Pages.

## Ce qui est déjà prêt dans le dépôt

- Tous les jeux intégrés parlent au même contrat sous `src/lib/orbis/tracking/`.
- Les données sont d’abord enregistrées localement : une panne réseau ne bloque pas les jeux.
- Le client sait envoyer les bilans, envoyer une sauvegarde et relire une sauvegarde distante.
- La migration crée les tables, les droits RLS et la protection contre l’écrasement d’une révision plus récente.
- Le déploiement GitHub Pages sait recevoir l’URL et la clé publique depuis les variables GitHub.

## Ce que Stefan devra créer une seule fois

1. Ouvrir Supabase et créer **un projet Free de test** appelé par exemple `orbis-test`.
2. Ne placer au début que de faux élèves dans ce projet.
3. Dans le tableau Supabase, ouvrir l’éditeur SQL et exécuter `supabase/migrations/202610250001_orbis_free_pilot.sql`.
4. Dans la fenêtre **Connect** ou **API Keys**, copier :
   - l’URL du projet ;
   - la clé **Publishable** commençant par `sb_publishable_`.
5. Ne jamais copier une clé **Secret** commençant par `sb_secret_` dans le dépôt, une page web ou une variable publique GitHub.

## Variables GitHub Pages

Dans le dépôt GitHub : **Settings → Secrets and variables → Actions → Variables**, créer :

| Nom | Valeur |
|---|---|
| `PUBLIC_SUPABASE_URL` | URL du projet, par exemple `https://abc.supabase.co` |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé commençant par `sb_publishable_` |

Ces valeurs sont publiques. La sécurité vient des comptes élèves et des règles RLS, pas du fait de cacher cette clé.

Pour travailler uniquement sur le Mac, copier `.env.example` vers `.env` et remplacer les deux valeurs. `.env` est ignoré par Git.

## Pourquoi les comptes ne sont pas encore activés

L’objectif retenu est : code de classe + identifiant élève + code personnel, sans adresse électronique personnelle. La création et la réinitialisation de ces comptes nécessitent une fonction distante possédant une clé secrète. Cette fonction ne peut pas être placée dans GitHub Pages.

La prochaine phase Supabase devra donc ajouter :

1. une fonction sécurisée pour créer/réinitialiser un élève ;
2. l’écran enseignant authentifié ;
3. l’écran élève par codes ;
4. des essais avec deux enseignants et deux classes pour vérifier qu’aucun enseignant ne voit l’autre classe ;
5. un export périodique, car le plan Free ne fournit pas les mêmes sauvegardes automatiques que les offres payantes.

## Fonctionnement gratuit attendu

Le site reste hébergé sur GitHub Pages et aucun Mac ne doit rester allumé. Si Supabase est en pause ou inaccessible, les jeux continuent localement et la file attend la prochaine connexion. Le projet Free peut être mis en pause après une période de faible activité ; il pourra être réactivé depuis le tableau Supabase.
