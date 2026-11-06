import type { GrammarChallenge, GrammarLevel, GrammarProgress } from './types';

export const GRAMMAR_PROGRESS_VERSION = 1;

export function sameSelection(challenge: GrammarChallenge, selectedIds: string[]): boolean {
  const solutions = [challenge.solution, ...(challenge.acceptedSolutions ?? [])];
  if (challenge.kind === 'order') {
    return solutions.some((solution) => selectedIds.length === solution.length
      && selectedIds.every((id, index) => id === solution[index]));
  }
  return new Set(selectedIds).size === selectedIds.length && solutions.some((solution) => selectedIds.length === solution.length
    && selectedIds.every((id) => solution.includes(id)));
}

export function matchesRepair(challenge: GrammarChallenge, answer: string): boolean {
  if (challenge.kind !== 'repair') return false;
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-CH');
  return [challenge.solution, ...(challenge.acceptedSolutions ?? [])].some((ids) =>
    ids.some((id) => normalize(challenge.blocks.find((block) => block.id === id)?.text ?? '') === normalize(answer)));
}

export function transformedSentence(challenge: GrammarChallenge, selectedId: string): string {
  const selected = challenge.blocks.find((block) => block.id === selectedId);
  if (challenge.kind !== 'move' || !selected) return challenge.context ?? '';
  const remaining = challenge.blocks.filter((block) => block.id !== selectedId);
  if (challenge.moveOperation === 'front') {
    const head = selected.text.charAt(0).toLocaleUpperCase('fr-CH') + selected.text.slice(1);
    return `${head}, ${remaining.map((block) => block.text).join(' ')}`.replace(/ ([.!?])/g, '$1');
  }
  return remaining.map((block) => block.text).join(' ').replace(/ ([.!?])/g, '$1');
}

export function acceptedOrders(challenge: GrammarChallenge): string[][] {
  return [challenge.solution, ...(challenge.acceptedSolutions ?? [])];
}

export function validNextBlocks(challenge: GrammarChallenge, placed: string[]): string[] {
  return [...new Set(acceptedOrders(challenge)
    .filter((order) => placed.every((id, index) => order[index] === id))
    .map((order) => order[placed.length])
    .filter((id): id is string => Boolean(id)))];
}

export function pickChallenges(level: GrammarLevel, count: number, previousIds: string[] = [], random = Math.random): GrammarChallenge[] {
  const unseen = level.challenges.filter((challenge) => !previousIds.includes(challenge.id));
  const pool = unseen.length >= count ? unseen : level.challenges;
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  const selected: GrammarChallenge[] = [];
  const add = (challenge?: GrammarChallenge) => {
    if (challenge && selected.length < count && !selected.some((item) => item.id === challenge.id)
      && !(level.requiredErrorFamilies?.includes(challenge.errorFamily) && selected.some((item) => item.errorFamily === challenge.errorFamily))) selected.push(challenge);
  };
  for (const family of level.requiredErrorFamilies ?? []) add(shuffled.find((challenge) => challenge.errorFamily === family));
  for (const kind of ['order', 'highlight', 'repair', 'move'] as const) add(shuffled.find((challenge) => challenge.kind === kind));
  for (const challenge of shuffled) add(challenge);
  return selected.map((challenge) => {
    if (challenge.kind !== 'order' && challenge.kind !== 'select') return challenge;
    if (challenge.kind === 'select' && challenge.context) return challenge;
    const blocks = [...challenge.blocks];
    for (let index = blocks.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [blocks[index], blocks[swap]] = [blocks[swap], blocks[index]];
    }
    return { ...challenge, blocks };
  });
}

export function levelMastered(correct: number, questions: number): boolean {
  return questions > 0 && correct >= Math.ceil(questions * 0.8);
}

export function isAutonomousSuccess(attempts: number, usedHint: boolean): boolean {
  return attempts === 1 && !usedHint;
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
    practiceSessions: 0,
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
  let unlockedLevel = 1;
  const completed = new Set(completedLevels);
  while (unlockedLevel < 14 && completed.has(unlockedLevel)) unlockedLevel++;
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
    unlockedLevel,
    completedLevels,
    starsByLevel,
    totalCorrect: Math.max(0, Number.isFinite(candidate.totalCorrect) ? Math.floor(candidate.totalCorrect!) : 0),
    totalErrors: Math.max(0, Number.isFinite(candidate.totalErrors) ? Math.floor(candidate.totalErrors!) : 0),
    practiceSessions: Math.max(0, Number.isFinite(candidate.practiceSessions) ? Math.floor(candidate.practiceSessions!) : 0),
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
  const completedLevels = progress.completedLevels.includes(levelId)
    ? [...progress.completedLevels]
    : [...progress.completedLevels, levelId].sort((a, b) => a - b);
  const completed = new Set(completedLevels);
  let unlockedLevel = 1;
  while (unlockedLevel < 14 && completed.has(unlockedLevel)) unlockedLevel++;
  return {
    unlockedLevel,
    completedLevels,
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
    if (challenge.kind === 'repair' && (!challenge.repair || challenge.solution.length !== 1)) errors.push(`${challenge.id}: réparation invalide`);
    if (challenge.kind === 'move' && challenge.solution.length !== 1) errors.push(`${challenge.id}: déplacement invalide`);
    if (challenge.kind === 'highlight' && !challenge.context) errors.push(`${challenge.id}: phrase à surligner absente`);
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
