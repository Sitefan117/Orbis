# Le Bazar

Prototype de français 6H–8H organisé en neuf échoppes. Chaque échoppe contient trois défis structurés par niveau. Les réponses libres longues sont volontairement exclues du prototype : l’atelier d’écriture fait choisir et justifier mentalement la formulation qui respecte une contrainte.

La page `/bazar` enregistre un bilan détaillé à la fin de chaque échoppe avec `recordGameActivity`. La sauvegarde de progression utilise le service Orbis local-first et se synchronise avec Supabase lorsqu’un compte élève est connecté.

Les scores mesurent uniquement les réussites autonomes au premier essai, sans indice. Ils servent à repérer des besoins d’entraînement et ne certifient pas une maîtrise du PER.
