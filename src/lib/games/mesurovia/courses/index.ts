import type { LessonSlide } from './types';
import { fondationsCourses } from './fondations';
import { conversionsCourses } from './conversions';
import { areasCourses } from './areas';
import { volumesCourses } from './volumes';
import { masteryCourses } from './mastery';

export const coursesByVillage: Record<string, Record<string, LessonSlide[]>> = {
  'fondations-mesure': fondationsCourses,
  'royaume-conversions': conversionsCourses,
  'aires-perimetres': areasCourses,
  'volumes-capacites': volumesCourses,
  'missions-maitrise': masteryCourses
};

export function courseForHouse(villageId: string, houseId: string): LessonSlide[] {
  return (coursesByVillage[villageId]?.[houseId] ?? []).map((slide) => ({ ...slide, options: [...slide.options] }));
}

export type { LessonSlide } from './types';
