import { GEOMETRY_FIGURES } from './figures';

export type ConstructionProgress = {
  completedIds: string[];
  bestAttempts: Record<string, number>;
  xp: number;
  badges: string[];
  dailyKeys: string[];
};

export const EMPTY_CONSTRUCTION_PROGRESS: ConstructionProgress = { completedIds: [], bestAttempts: {}, xp: 0, badges: [], dailyKeys: [] };

export const CONSTRUCTION_BADGES: Record<string, { title: string; description: string }> = {
  'first-trace': { title: 'Premier tracé', description: 'Une première figure reconstituée.' },
  'careful-trace': { title: 'Œil précis', description: 'Une figure terminée du premier essai et sans indice.' },
  'persistent-trace': { title: 'Je persévère', description: 'Une erreur corrigée avant de terminer.' },
  'triangle-collection': { title: 'Maître des triangles', description: 'Tous les triangles du catalogue reproduits.' },
  'solid-collection': { title: 'Détective des solides', description: 'Toutes les vues de solides reconstituées.' },
  'all-figures': { title: 'Cartographe Nexus', description: 'Toutes les figures du catalogue explorées.' },
  'daily-trace': { title: 'Défi du jour', description: 'Un croquis du jour terminé.' }
};

export function awardConstruction(progress: ConstructionProgress, figureId: string, checks: number, errors: number, usedHint: boolean, dailyKey = ''): ConstructionProgress {
  const wasCompleted = progress.completedIds.includes(figureId);
  const completedIds = wasCompleted ? progress.completedIds : [...progress.completedIds, figureId];
  const dailyNew = Boolean(dailyKey && !progress.dailyKeys.includes(dailyKey));
  const badges = new Set(progress.badges);
  badges.add('first-trace');
  if (errors === 0 && !usedHint) badges.add('careful-trace');
  if (errors > 0) badges.add('persistent-trace');
  if (GEOMETRY_FIGURES.filter((figure) => figure.isTriangle).every((figure) => completedIds.includes(figure.id))) badges.add('triangle-collection');
  if (GEOMETRY_FIGURES.filter((figure) => figure.kind === 'solid').every((figure) => completedIds.includes(figure.id))) badges.add('solid-collection');
  if (completedIds.length === GEOMETRY_FIGURES.length) badges.add('all-figures');
  if (dailyNew) badges.add('daily-trace');
  return {
    completedIds,
    bestAttempts: { ...progress.bestAttempts, [figureId]: Math.min(progress.bestAttempts[figureId] ?? Infinity, checks) },
    xp: progress.xp + (wasCompleted ? 0 : 20) + (dailyNew ? 10 : 0),
    badges: [...badges],
    dailyKeys: dailyNew ? [...progress.dailyKeys, dailyKey] : progress.dailyKeys
  };
}
