import type { LessonSlide } from './types';
import { fondationsCourses } from './fondations';
import { conversionsCourses } from './conversions';
import { areasCourses } from './areas';
import { volumesCourses } from './volumes';
import { masteryCourses } from './mastery';
import { houseCurriculum } from '../curriculum';

export const coursesByVillage: Record<string, Record<string, LessonSlide[]>> = {
  'fondations-mesure': fondationsCourses,
  'royaume-conversions': conversionsCourses,
  'aires-perimetres': areasCourses,
  'volumes-capacites': volumesCourses,
  'missions-maitrise': masteryCourses
};

export function courseForHouse(villageId: string, houseId: string): LessonSlide[] {
  const source = coursesByVillage[villageId]?.[houseId] ?? [];
  const house = houseCurriculum[villageId]?.[houseId];
  if (!source.length || !house) return source.map((slide) => ({ ...slide, options: [...slide.options] }));
  const success = house.success;
  const cloned = source.map((slide) => ({ ...slide, options: [...slide.options] }));
  const labelled = cloned.map((slide, index) => ({
    ...slide,
    step: (['explication', 'exemple', 'manipulation', 'autonomie'] as const)[index] ?? 'autonomie'
  }));
  const verification: LessonSlide = {
    step: 'vérification',
    title: 'Je vérifie ma méthode',
    body: `Avant de répondre seul, je contrôle ce point : ${success[0]}`,
    ask: `Quelle action montre que tu travailles l’objectif « ${house.objective} » ?`,
    options: [success[0], 'Je choisis seulement le plus grand nombre.', 'J’oublie l’unité pour aller plus vite.'],
    answer: success[0],
    explain: `Ce contrôle est observable : ${success[0]}`
  };
  const criteria: LessonSlide = {
    step: 'réussite',
    title: 'Je sais quand j’ai réussi',
    body: success.map((criterion) => `• ${criterion}`).join('\n'),
    ask: 'Quel contrôle dois-tu encore faire avant de valider ta réponse ?',
    options: [success[2], 'Changer la grandeur demandée.', 'Effacer l’unité du résultat.'],
    answer: success[2],
    explain: `Le dernier contrôle de cette maison est : ${success[2]}`
  };
  return [...labelled.slice(0, 3), verification, ...labelled.slice(3, 4), criteria];
}

export type { LessonSlide } from './types';
