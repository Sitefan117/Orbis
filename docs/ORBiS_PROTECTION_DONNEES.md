# Protection des données Orbis — pilote

## Avant toute utilisation avec de vrais élèves

- Faire valider le pilote, Supabase et la notice par la direction ou le répondant à la protection des données.
- Utiliser des pseudonymes, jamais les noms complets dans les identifiants.
- Remettre la notice `/confidentialite` aux élèves et aux représentants lorsque cela est requis.
- Vérifier dans Supabase que l'inscription publique est désactivée et que seul l'enseignant crée les comptes.
- Activer la MFA sur le compte administrateur Supabase.
- Tester l'isolation avec deux enseignants, deux classes et deux élèves sans donnée réelle.

## Conservation proposée

Pour le pilote, les données sont conservées pendant l'année scolaire et au maximum douze mois après la fin de la classe, sauf règle institutionnelle différente. À l'échéance : exporter les éléments nécessaires, puis supprimer le compte depuis l'espace enseignant. La suppression du compte Auth entraîne la suppression en cascade de son profil, de ses inscriptions, résultats, sauvegardes et documents PCP.

## Export et suppression

L'espace enseignant propose un export JSON complet et une suppression en deux clics. Ces actions nécessitent la version correspondante de l'Edge Function `orbis-admin`. L'export doit être conservé uniquement dans un emplacement institutionnel chiffré et supprimé lorsqu'il n'est plus nécessaire.

## Sauvegarde de la base

Le plan Supabase Free ne fournit pas de sauvegarde automatique. La commande suivante crée un dump logique du schéma public et de ses données :

```bash
export ORBIS_SUPABASE_DB_URL='postgresql://...'
npm run supabase:backup
```

La chaîne de connexion se trouve dans Supabase → Connect → Direct connection. Ne jamais la copier dans Git, un document partagé ou une capture d'écran. Les fichiers sont créés sous `backups/supabase/`, ignorés par Git, avec des permissions locales restrictives.

Le dump public ne contient pas les mots de passe Supabase Auth. Une procédure de reprise doit donc prévoir la recréation ou la réinitialisation des comptes. Au moins une restauration doit être testée sur un projet Supabase distinct avant de considérer la sauvegarde comme opérationnelle.

## Incident

En cas de mauvais destinataire, compte compromis ou exposition de documents PCP : suspendre l'utilisation, révoquer les sessions concernées, conserver les journaux nécessaires, informer la direction et appliquer la procédure institutionnelle de violation de données.
