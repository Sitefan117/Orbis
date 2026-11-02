---
name: sequences-pedagogiques-orbis
description: Concevoir des séquences pédagogiques hybrides et guider leur traduction en cours, jeux et fonctionnalités Orbis pour des élèves de 6H à 9H, surtout en mathématiques.
metadata:
  short-description: Concevoir, programmer et évaluer des séquences Orbis
---

# Séquences pédagogiques et Orbis

Utiliser ce skill lorsqu’il faut créer une séquence, un dossier d’apprentissage, un cours numérique, un jeu ou une fonctionnalité Orbis qui doit soutenir un apprentissage identifiable. Il complète le skill [recherche-pedagogique-numerique](../recherche-pedagogique-numerique/SKILL.md) et le skill [orbis-pedagogie](../orbis-pedagogie/SKILL.md).

## Principe directeur

Commencer par le besoin de l’élève et l’objectif observable. Choisir ensuite ce que le papier, l’oral, l’enseignant et Orbis apportent chacun. Ne jamais partir d’une mécanique de jeu pour chercher après coup une justification pédagogique.

## Avant de concevoir

Définir :

- le degré HarmoS et l’âge réel ;
- la notion et la compétence attendue ;
- les prérequis ;
- les erreurs probables ;
- les élèves qui ont besoin d’une reprise ;
- la tâche finale qui prouvera l’apprentissage ;
- le temps disponible, le matériel et le rôle de l’enseignant.

Prévoir un diagnostic bref et discret. Les parcours de reprise doivent rester accessibles sans étiquette publique ni verrouillage irréversible.

## Construire la progression

Organiser selon les besoins, généralement :

1. diagnostic ;
2. découverte ou mise en situation ;
3. explicitation et vocabulaire ;
4. manipulation ou entraînement guidé ;
5. trace écrite ou verbalisation ;
6. transfert dans une tâche nouvelle ;
7. évaluation différée ou réinvestissement.

Pour chaque étape, préciser l’objectif, le support, la consigne, l’aide, la production de l’élève et le critère de réussite. Une activité Orbis doit avoir une place et une durée justifiées dans la séquence.

## Répartir les supports

- **Papier** : recherche, schéma, calcul posé, justification, trace durable et résolution de problèmes longs.
- **Orbis** : manipulation dynamique, entraînement ciblé, variation des exemples, adaptation prudente et feedback.
- **Oral** : comparaison de stratégies, institutionnalisation et mise en mots.
- **Enseignant** : diagnostic, étayage, observation, régulation et validation du savoir.

Cette répartition est une hypothèse de conception, pas une loi générale. Vérifier que l’alternance apporte quelque chose à la tâche.

## Programmer ou modifier Orbis

Avant de coder, écrire le contrat pédagogique :

**objectif → action mathématique ou langagière → représentation → réponse attendue → erreur possible → feedback → réessai → donnée utile à l’enseignant → test de transfert.**

Conserver les activités autonomes et les contrats de navigation et de sauvegarde existants. Utiliser le \`base\` SvelteKit pour les liens. Ne pas transformer un score, un temps ou une animation en mesure de maîtrise sans preuve.

Les mécaniques de gamification doivent soutenir une action cognitive. Privilégier progression personnelle, défis accessibles et coopération pertinente. Traiter les classements publics, minuteurs agressifs, récompenses sans lien avec la compétence et animations décoratives comme des choix à justifier, surtout pour les élèves en difficulté.

## Feedback et différenciation

Après une erreur, favoriser un indice qui aide à comprendre la stratégie et à refaire une tâche apparentée. Le nombre et l’ordre des aides doivent dépendre de la notion et du niveau ; trois paliers fixes ne sont pas une exigence scientifique.

Prévoir plusieurs accès à la même compétence : reprise, parcours standard, approfondissement, aides facultatives et possibilité de recommencer. L’adaptation automatique doit rester visible, révisable et contrôlable par l’enseignant.

## Évaluer la séquence

Séparer :

- réussite immédiate dans Orbis ;
- compréhension et justification ;
- motivation ou engagement ;
- autonomie et recours aux aides ;
- transfert sur papier, à l’oral ou dans une nouvelle situation ;
- maintien quelques jours plus tard.

Ne conclure à un apprentissage qu’après une tâche nouvelle hors de l’interface. Relever aussi les problèmes d’accès, la charge de travail enseignant et les effets sur les élèves initialement faibles.

## Restitution attendue

Fournir une fiche de séquence, les activités et documents nécessaires, les choix de programmation, les tests, les limites et une proposition d’observation en classe. Pour chaque recommandation fondée sur une étude, distinguer le résultat publié, l’inférence pour Orbis et l’hypothèse à tester.

Lire [references/fiche-sequence.md](references/fiche-sequence.md) pour le gabarit détaillé.
