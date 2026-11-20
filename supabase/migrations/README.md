# Migrations Supabase

Appliquer ces fichiers **dans l’ordre de leur nom** sur un projet de test, puis
vérifier les droits avec des comptes fictifs avant toute donnée réelle. Les
migrations ne sont pas exécutées par le build GitHub Pages.

| Fichier | Effet principal |
| --- | --- |
| `202610250001_orbis_free_pilot.sql` | Tables, RLS et sauvegardes du pilote. |
| `202611120001_orbis_short_ids.sql` | Identifiants courts des élèves. |
| `202611130001_orbis_admin_student_rpc.sql` | Création contrôlée des profils. |
| `202611130002_orbis_copy_student_save.sql` | Copie contrôlée d’une sauvegarde. |
| `202611130003_orbis_details_and_pcp.sql` | Détails de réponses et documents PCP. |
| `202611150001_orbis_tracking_context.sql` | Contexte des résultats. |
| `202611150002_orbis_student_tasks.sql` | Consignes enseignant. |
| `202611150003_orbis_task_recipients.sql` | Destinataires des consignes. |
| `202611200001_orbis_private_rls_helpers.sql` | Aides RLS dans `orbis_private`, fonctions privilégiées durcies. |

La dernière migration conserve les identités des fonctions utilisées par les
politiques RLS ; les RPC administratives restent dans `public` car l’Edge
Function les appelle par l’API. Elle doit être validée sur une copie de test
avant application à un projet contenant des données.
