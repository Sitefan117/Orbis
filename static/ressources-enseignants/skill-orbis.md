---
name: orbis-pedagogie
description: Concevoir, corriger ou évaluer un cours, un jeu ou une fonction d'Orbis en reliant les besoins des élèves, le code existant et les études pédagogiques. À utiliser pour les futurs travaux sur Orbis, surtout en mathématiques 6H–9H.
---

# Orbis : développement guidé par la pédagogie

Utiliser ce skill pour un apport ou une correction dans Orbis. Il complète le skill [recherche-pedagogique-numerique](../recherche-pedagogique-numerique/SKILL.md) ; il n'en recopie pas la revue de littérature.

## Contexte stable

- Public principal : école suisse romande, surtout mathématiques 6H–9H, avec des élèves de 12 à 15 ans dont certains ont des prérequis plus anciens à reprendre. Âge, année HarmoS et niveau réel ne sont pas interchangeables.
- Orbis combine un portail, des jeux autonomes et des cours parfois imprimables. L'enseignant choisit souvent l'activité ; préserver les usages guidés et hybrides.
- Dépôt de travail actuel : `/Users/stefan/ClassRoom-Sitefan`. Retrouver son emplacement courant si ce chemin n'existe plus. Lire son `README.md`, le catalogue et le jeu concerné avant de modifier quoi que ce soit.
- Le site est publié comme fichiers statiques sur GitHub Pages. Les anciennes routes API SvelteKit et SQLite n'y fonctionnent pas. Les résultats et sauvegardes restent surtout locaux ; Supabase est une piste préparée, pas un service de classe déjà opérationnel.
- Décisions exprimées par l'enseignant : le tableau local provisoire lui convient pour l'instant ; les corrigés peuvent rester librement accessibles. Ne pas transformer ces points en chantier prioritaire sans nouvelle demande ou changement de contexte.

## Pour un apport ou une correction

1. Identifier la notion, les prérequis, l'obstacle observé, la tâche que l'élève doit réussir et la place de l'enseignant. Si la demande est un bug d'interface, garder le problème concret de l'élève au centre de la correction.
2. Inspecter le parcours existant : page du jeu dans `src/routes/`, moteur et progression dans `src/lib/games/`, catalogue dans `src/lib/orbis/catalog/`, cours dans `static/cours/`, tests ciblés dans `tests/`. Préserver les routes publiques et les anciennes sauvegardes lors d'une évolution.
3. Pour justifier une décision pédagogique, lire [REFERENCE-IA.md](../recherche-pedagogique-numerique/REFERENCE-IA.md) et les lignes pertinentes du [corpus de 30 publications](../recherche-pedagogique-numerique/ETUDES-VERIFIEES.md). Revérifier la source primaire lorsqu'une affirmation précise, un chiffre ou une nouvelle recommandation en dépend. Le livre présent seulement dans NotebookLM n'est pas disponible dans ces fichiers.
4. Rendre explicite la chaîne **besoin de l'élève → choix dans Orbis → mécanisme d'apprentissage attendu → preuve citée → limite → vérification en classe**. Qualifier le lien : directement étudié, transfert plausible, ou hypothèse de conception. Aucune étude du corpus ne démontre l'efficacité d'Orbis lui-même.
5. Modifier au périmètre utile. Garder chaque jeu autonome, avec ses règles dans son moteur propre ; réutiliser les contrats communs de suivi lorsque la donnée mesurée est fiable. Ne pas inventer d'indicateur pédagogique à partir d'une simple animation, d'un score ou d'une sauvegarde.
6. Vérifier le comportement sur le parcours touché, y compris navigation et usage tactile quand pertinent. Utiliser les contrôles et tests du dépôt adaptés au changement ; pour une question d'apprentissage, prévoir aussi une tâche hors jeu ou différée plutôt que conclure à partir du score interne.

## Critères de qualité pédagogiques

- Favoriser les retours qui aident à comprendre l'erreur et à réessayer une tâche apparentée. Ne pas imposer le même niveau de détail à chaque élève ou notion.
- Pour les élèves en retard, proposer des marches de prérequis accessibles sans affichage stigmatisant et sans verrouillage irréversible de parcours.
- Distinguer entraînement de procédure, compréhension conceptuelle, motivation et transfert. Les étoiles, niveaux et temps de jeu ne mesurent pas à eux seuls l'apprentissage.
- Vérifier que les éléments visuels, sonores et narratifs servent l'attention sur la notion ; préserver les réglages de confort et le contrôle du rythme.
- Dans les bilans enseignants, montrer une information qui peut mener à une action pédagogique. Signaler honnêtement les données absentes et les limites du stockage sur un seul appareil.

## Utiliser une nouvelle synthèse de recherche

Lorsqu’un texte produit par NotebookLM ou une autre IA propose de nouvelles recommandations, classer chaque élément avant de l’appliquer :

1. résultat directement mesuré dans une étude ;
2. interprétation possible pour Orbis ;
3. hypothèse de conception à tester ;
4. limite ou information encore non vérifiée.

Ne pas reprendre automatiquement un chiffre, une taille d’effet ou une référence simplement parce qu’ils figurent dans une synthèse. Vérifier la publication primaire, son âge scolaire, sa discipline, son comparateur et son statut d’accès. Les scores du jeu, la motivation et le transfert hors jeu doivent rester des mesures distinctes.

Pour les nouvelles activités, relier chaque mécanique à une action cognitive observable : représenter, comparer, expliquer, calculer, justifier, corriger ou réutiliser. Une progression personnelle, une coopération ou une narration sont des choix de conception ; leur effet local doit être évalué par une tâche nouvelle et, si possible, différée.

## Restitution attendue

Expliquer ce qui a changé, pourquoi, les contrôles effectués et la limite restante. Pour une recommandation fondée sur la recherche, citer la publication à côté de l'énoncé et distinguer le résultat publié de l'inférence pour Orbis. Si plusieurs études sont mobilisées, montrer aussi leurs éventuelles contradictions et le degré de proximité avec les élèves visés.
