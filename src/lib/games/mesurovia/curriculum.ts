/** Correspondance pédagogique proposée à partir du plan de ceintures fourni. */
export const villageCurriculum: Record<string, { code: string; objective: string; priorities: string[] }> = {
  'sentiers-moulin': {
    code: '7H / Grandeurs et mesures / Ceintures blanche à noire',
    objective: 'Choisir une grandeur, lire un tableau de conversion et vérifier qu’une mesure est vraisemblable.',
    priorities: ['Longueurs : km, m, dm, cm, mm', 'Capacités : L, dL, cL, mL', 'Masses : t, kg, g, mg', 'Durées : h, min, s']
  },
  'clairieres-compas': {
    code: '7H–8H / Grandeurs et mesures / Ceintures blanche à bleue',
    objective: 'Comparer des mesures, convertir des nombres décimaux et résoudre des situations de durée.',
    priorities: ['Conversions dans les deux sens', 'Heures, minutes et secondes', 'Introduction aux jours et semaines', 'Estimation et ordre de grandeur']
  },
  'canaux-artisans': {
    code: '8H / Grandeurs et mesures / Ceintures blanche à bleue',
    objective: 'Utiliser les conversions dans des problèmes et distinguer longueur, aire et volume.',
    priorities: ['Aires : km², ha, m², cm², mm²', 'Volumes : m³, dm³, cm³, mm³', 'Capacités : L, dL, cL, mL', 'Problèmes à plusieurs étapes']
  },
  'hautes-terres': {
    code: '8H / Grandeurs et mesures / Ceintures blanche à bleue',
    objective: 'Choisir une stratégie, justifier les conversions et contrôler un résultat complexe.',
    priorities: ['Aires et volumes', 'Lien entre L et dm³ dans des situations guidées', 'Durées : j, semaine, mois, année', 'Communication de la démarche']
  }
};

export const houseCurriculum: Record<string, Record<string, { code: string; objective: string }>> = {
  'sentiers-moulin': {
    repères: { code: '7H / Grandeurs et mesures / Ceinture blanche', objective: 'Lire le tableau, choisir une unité et estimer une longueur.' },
    longueurs: { code: '7H / Grandeurs et mesures / Ceinture blanche', objective: 'Mesurer et convertir les longueurs en mm, cm, dm, m et km.' },
    masses: { code: '7H / Grandeurs et mesures / Ceintures bleue et noire', objective: 'Comparer des capacités et des masses, puis convertir.' },
    durées: { code: '7H / Grandeurs et mesures / Ceinture noire', objective: 'Convertir et comparer principalement les heures, minutes et secondes.' },
    expedition: { code: '7H / Grandeurs et mesures / Ceintures blanche à noire', objective: 'Résoudre un problème en choisissant une unité et en vérifiant le résultat.' }
  },
  'clairieres-compas': {
    repères: { code: '7H / Grandeurs et mesures / Ceinture blanche', objective: 'Choisir une unité adaptée et estimer.' },
    longueurs: { code: '8H / Grandeurs et mesures / Ceinture blanche', objective: 'Comparer et convertir des longueurs dans les unités conventionnelles.' },
    masses: { code: '8H / Grandeurs et mesures / Ceintures verte et bleue', objective: 'Comparer les capacités et les masses, convertir leurs unités.' },
    durées: { code: '8H / Grandeurs et mesures / Ceinture bleue', objective: 'Calculer avec h, min et s, puis découvrir les jours et les semaines.' },
    expedition: { code: '8H / Grandeurs et mesures / Ceintures verte et bleue', objective: 'Résoudre des problèmes de mesures à plusieurs grandeurs.' }
  },
  'canaux-artisans': {
    repères: { code: '8H / Grandeurs et mesures / Ceinture blanche', objective: 'Estimer une mesure et vérifier la vraisemblance.' },
    longueurs: { code: '8H / Grandeurs et mesures / Ceinture blanche', objective: 'Convertir et comparer des longueurs décimales.' },
    masses: { code: '8H / Grandeurs et mesures / Ceintures verte et bleue', objective: 'Convertir des masses et capacités dans une situation concrète.' },
    surfaces: { code: '8H / Grandeurs et mesures / Ceinture jaune', objective: 'Comparer et convertir des aires, en privilégiant km², ha, m², cm² et mm².' },
    expedition: { code: '8H / Grandeurs et mesures / Ceintures jaune à bleue', objective: 'Résoudre une situation à plusieurs étapes et contrôler les unités.' }
  },
  'hautes-terres': {
    repères: { code: '8H / Grandeurs et mesures / Ceinture blanche', objective: 'Choisir l’unité et contrôler l’ordre de grandeur.' },
    longueurs: { code: '8H / Grandeurs et mesures / Ceinture blanche', objective: 'Convertir, comparer et ordonner des longueurs.' },
    masses: { code: '8H / Grandeurs et mesures / Ceinture bleue', objective: 'Comparer et convertir des masses, avec une extension vers mg.' },
    formes: { code: '8H / Grandeurs et mesures / Ceintures jaune et verte', objective: 'Distinguer aire, capacité et volume ; utiliser L, m³, dm³, cm³ et mm³.' },
    expedition: { code: '8H / Grandeurs et mesures / Ceintures blanche à bleue', objective: 'Justifier une solution complète avec des mesures cohérentes.' }
  }
};

/** Références PER explicites. La correspondance maison → PER est une traduction pédagogique locale,
 * tandis que MSN 24 est la référence officielle commune aux activités de mesure. */
export const PER_MSN24_URL = 'https://bdper.plandetudes.ch/uploads/per_pdf/Mathematiques_et_sciences_de_la_nature/Mathematiques/PER_print_MSN_24.pdf';

export type PerMeasureLink = {
  label: string;
  progression: string;
};

export const perMeasureLinks: Record<string, PerMeasureLink> = {
  repères: {
    label: 'MSN 24 · comparer des grandeurs et choisir une unité conventionnelle',
    progression: 'Estimer une mesure, choisir une unité adaptée et vérifier la vraisemblance du résultat.'
  },
  longueurs: {
    label: 'MSN 24 · longueurs : mm, cm, dm, m, km',
    progression: 'Comparer et exprimer une même longueur dans différentes unités, notamment km↔m et m↔cm.'
  },
  masses: {
    label: 'MSN 24 · masses et capacités : t↔kg, kg↔g, l↔dl',
    progression: 'Comparer et convertir des masses et des capacités ; les unités intermédiaires servent d’étayage dans Mesurovia.'
  },
  durées: {
    label: 'MSN 24 · durées : h↔min et min↔s',
    progression: 'Comparer et calculer avec les heures, minutes et secondes, puis élargir aux jours et semaines.'
  },
  surfaces: {
    label: 'MSN 24 · aires : cm², dm², m²',
    progression: 'Distinguer une aire d’une longueur et convertir les unités d’aire ; Mesurovia ajoute km², ha et mm².'
  },
  formes: {
    label: 'MSN 24 · aires, volumes et capacités',
    progression: 'Distinguer aire, volume et capacité et utiliser les relations entre L, dm³, cm³ et m³ dans des situations.'
  },
  expedition: {
    label: 'MSN 24 · résoudre des problèmes de mesure',
    progression: 'Mobiliser les unités, les conversions, l’estimation et la justification dans une situation-problème.'
  }
};

export const villagePerLinks: Record<string, PerMeasureLink> = {
  'sentiers-moulin': perMeasureLinks.repères,
  'clairieres-compas': perMeasureLinks.longueurs,
  'canaux-artisans': perMeasureLinks.surfaces,
  'hautes-terres': perMeasureLinks.expedition
};

export const housePerLinks: Record<string, Record<string, PerMeasureLink>> = {
  'sentiers-moulin': {
    repères: perMeasureLinks.repères, longueurs: perMeasureLinks.longueurs, masses: perMeasureLinks.masses,
    durées: perMeasureLinks.durées, expedition: perMeasureLinks.expedition
  },
  'clairieres-compas': {
    repères: perMeasureLinks.repères, longueurs: perMeasureLinks.longueurs, masses: perMeasureLinks.masses,
    durées: perMeasureLinks.durées, expedition: perMeasureLinks.expedition
  },
  'canaux-artisans': {
    repères: perMeasureLinks.repères, longueurs: perMeasureLinks.longueurs, masses: perMeasureLinks.masses,
    surfaces: perMeasureLinks.surfaces, expedition: perMeasureLinks.expedition
  },
  'hautes-terres': {
    repères: perMeasureLinks.repères, longueurs: perMeasureLinks.longueurs, masses: perMeasureLinks.masses,
    formes: perMeasureLinks.formes, expedition: perMeasureLinks.expedition
  }
};
