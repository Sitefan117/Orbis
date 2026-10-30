import type { GrammarChallenge, GrammarProgress } from './types';

export const GRAMMAR_PROGRESS_VERSION = 1;

export function sameSelection(challenge: GrammarChallenge, selectedIds: string[]): boolean {
  const solutions = [challenge.solution, ...(challenge.acceptedSolutions ?? [])];
  if (challenge.kind === 'order') {
    return solutions.some((solution) => selectedIds.length === solution.length
      && selectedIds.every((id, index) => id === solution[index]));
  }
  return solutions.some((solution) => selectedIds.length === solution.length
    && selectedIds.every((id) => solution.includes(id)));
}

export function isSelectionComplete(challenge: GrammarChallenge, selectedIds: string[]): boolean {
  return selectedIds.length >= challenge.solution.length;
}

export function nextChallengeIndex(current: number, challengeCount: number): number {
  if (challengeCount <= 0) return 0;
  return (current + 1) % challengeCount;
}

export function starsForLevel(correct: number, questions: number, hints: number): number {
  if (questions <= 0) return 0;
  const ratio = correct / questions;
  if (ratio >= 1 && hints === 0) return 3;
  if (ratio >= 0.8) return 2;
  if (ratio >= 0.6) return 1;
  return 0;
}

export function createInitialProgress(): GrammarProgress {
  return {
    unlockedLevel: 1,
    completedLevels: [],
    starsByLevel: {},
    totalCorrect: 0,
    totalErrors: 0,
    updatedAt: new Date(0).toISOString()
  };
}

export function sanitizeProgress(value: unknown): GrammarProgress {
  const fallback = createInitialProgress();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<GrammarProgress>;
  const completedLevels = Array.isArray(candidate.completedLevels)
    ? [...new Set(candidate.completedLevels.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 14))]
    : [];
  const starsByLevel: Record<number, number> = {};
  if (candidate.starsByLevel && typeof candidate.starsByLevel === 'object') {
    for (const [key, value] of Object.entries(candidate.starsByLevel)) {
      const level = Number(key);
      if (Number.isInteger(level) && level >= 1 && level <= 14 && Number.isFinite(value)) {
        starsByLevel[level] = Math.max(0, Math.min(3, Math.floor(value)));
      }
    }
  }
  return {
    unlockedLevel: Math.max(1, Math.min(14, Number.isInteger(candidate.unlockedLevel) ? candidate.unlockedLevel! : 1)),
    completedLevels,
    starsByLevel,
    totalCorrect: Math.max(0, Number.isFinite(candidate.totalCorrect) ? Math.floor(candidate.totalCorrect!) : 0),
    totalErrors: Math.max(0, Number.isFinite(candidate.totalErrors) ? Math.floor(candidate.totalErrors!) : 0),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : fallback.updatedAt
  };
}

export function completeLevel(
  progress: GrammarProgress,
  levelId: number,
  stars: number,
  correct: number,
  errors: number
): GrammarProgress {
  return {
    unlockedLevel: Math.min(14, Math.max(progress.unlockedLevel, levelId + 1)),
    completedLevels: progress.completedLevels.includes(levelId)
      ? [...progress.completedLevels]
      : [...progress.completedLevels, levelId].sort((a, b) => a - b),
    starsByLevel: { ...progress.starsByLevel, [levelId]: Math.max(progress.starsByLevel[levelId] ?? 0, stars) },
    totalCorrect: progress.totalCorrect + Math.max(0, correct),
    totalErrors: progress.totalErrors + Math.max(0, errors),
    updatedAt: new Date().toISOString()
  };
}

export function validateCurriculum(challenges: GrammarChallenge[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const challenge of challenges) {
    if (ids.has(challenge.id)) errors.push(`Défi dupliqué : ${challenge.id}`);
    ids.add(challenge.id);
    const blockIds = new Set(challenge.blocks.map((block) => block.id));
    if (blockIds.size !== challenge.blocks.length) errors.push(`${challenge.id}: blocs dupliqués`);
    if (challenge.solution.length === 0) errors.push(`${challenge.id}: solution vide`);
    if (challenge.solution.some((id) => !blockIds.has(id))) errors.push(`${challenge.id}: solution inconnue`);
    for (const solution of challenge.acceptedSolutions ?? []) {
      if (solution.length !== challenge.solution.length || solution.some((id) => !blockIds.has(id))) {
        errors.push(`${challenge.id}: solution alternative invalide`);
      }
    }
    if (!challenge.prompt || !challenge.explanation || !challenge.hint || !challenge.errorFamily) {
      errors.push(`${challenge.id}: contenu pédagogique incomplet`);
    }
  }
  return errors;
}
