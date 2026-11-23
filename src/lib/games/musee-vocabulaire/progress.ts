export type WordMastery = 'nouveau' | 'pas-encore' | 'fragile' | 'a-consolider' | 'solide';
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';
export type EvidenceStrength = 'practice' | 'recognition' | 'recall';

/** Tuple compacte : résultat, date ISO, séance, force de rappel. */
export type WordEvidence = [0 | 1, string, string, EvidenceStrength];

export type WordEncounter = {
  correct: boolean;
  errors?: number;
  hints?: number;
  mode: string;
  sessionId: string;
  strength: EvidenceStrength;
  /** Réservé aux rappels réellement plus exigeants qu'un QCM. */
  easy?: boolean;
};

export type WordProgress = {
  status: WordMastery;
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  errors: number;
  hints: number;
  streak: number;
  lapses: number;
  difficulty: number;
  stabilityDays: number;
  evidence: WordEvidence[];
  lastSeen?: string;
  nextReview?: string;
};

export type VocabularyProgress = Record<string, WordProgress>;

const DAY = 86_400_000;
const MINUTE = 60_000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function emptyWordProgress(): WordProgress {
  return {
    status: 'nouveau', attempts: 0, correct: 0, firstTryCorrect: 0, errors: 0, hints: 0,
    streak: 0, lapses: 0, difficulty: 5, stabilityDays: 0, evidence: []
  };
}

/** Accepte aussi les sauvegardes v1 sans inventer de nouvelles observations. */
export function normalizeWordProgress(value: (Omit<Partial<WordProgress>, 'status'> & { status?: string }) | undefined): WordProgress {
  const fallback = emptyWordProgress();
  if (!value || typeof value !== 'object') return fallback;
  const legacyStatus: Record<string, WordMastery> = {
    nouveau: 'nouveau', fragile: 'fragile', 'a-revoir': 'a-consolider', acquis: 'solide',
    'pas-encore': 'pas-encore', 'a-consolider': 'a-consolider', solide: 'solide'
  };
  const evidence: WordEvidence[] = Array.isArray(value.evidence)
    ? value.evidence.flatMap((item): WordEvidence[] => {
      if (Array.isArray(item) && (item[0] === 0 || item[0] === 1)
        && typeof item[1] === 'string' && typeof item[2] === 'string') {
        const strength = item[3] === 'practice' || item[3] === 'recognition' || item[3] === 'recall'
          ? item[3] : 'recognition';
        return [[item[0], item[1], item[2], strength]];
      }
      // Tolère les premières sauvegardes v2 à objets, sans conserver leurs champs superflus.
      if (item && typeof item === 'object') {
        const legacy = item as unknown as { result?: unknown; at?: unknown; sessionId?: unknown; strength?: unknown };
        if ((legacy.result === 0 || legacy.result === 1) && typeof legacy.at === 'string'
          && typeof legacy.sessionId === 'string') {
          const strength = legacy.strength === 'practice' || legacy.strength === 'recognition' || legacy.strength === 'recall'
            ? legacy.strength : 'recognition';
          return [[legacy.result, legacy.at, legacy.sessionId, strength]];
        }
      }
      return [];
    }).slice(-3)
    : [];
  return {
    status: legacyStatus[value.status ?? ''] ?? fallback.status,
    attempts: Math.max(0, Number(value.attempts) || 0),
    correct: Math.max(0, Number(value.correct) || 0),
    firstTryCorrect: Math.max(0, Number(value.firstTryCorrect) || 0),
    errors: Math.max(0, Number(value.errors) || 0),
    hints: Math.max(0, Number(value.hints) || 0),
    streak: Math.max(0, Number(value.streak) || 0),
    lapses: Math.max(0, Number(value.lapses) || 0),
    difficulty: clamp(Number(value.difficulty) || 5, 1, 10),
    stabilityDays: Math.max(0, Number(value.stabilityDays) || 0),
    evidence,
    ...(typeof value.lastSeen === 'string' ? { lastSeen: value.lastSeen } : {}),
    ...(typeof value.nextReview === 'string' ? { nextReview: value.nextReview } : {})
  };
}

export function gradeEncounter(encounter: WordEncounter): ReviewGrade {
  if (!encounter.correct) return 'again';
  if ((encounter.errors ?? 0) > 0 || (encounter.hints ?? 0) > 0) return 'hard';
  return encounter.easy && encounter.strength === 'recall' ? 'easy' : 'good';
}

function statusFromEvidence(evidence: WordEvidence[], previousStatus: WordMastery): WordMastery {
  const recent = evidence.slice(-3);
  if (recent.length < 3) {
    if (previousStatus === 'solide') return recent.at(-1)?.[0] === 0 ? 'a-consolider' : 'solide';
    return evidence.length ? 'nouveau' : previousStatus;
  }
  const successes = recent.reduce((sum, item) => sum + item[0], 0);
  if (successes === 0) return 'pas-encore';
  if (successes === 1) return 'fragile';
  if (successes === 2) return 'a-consolider';
  const sessions = new Set(recent.map((item) => item[2]));
  const span = new Date(recent.at(-1)![1]).getTime() - new Date(recent[0][1]).getTime();
  const hasRecall = recent.some((item) => item[3] === 'recall');
  return (sessions.size >= 2 && span >= 2 * DAY && hasRecall) || (previousStatus === 'solide' && successes === 3)
    ? 'solide' : 'a-consolider';
}

function nextStability(current: WordProgress, grade: ReviewGrade): number {
  const base = current.stabilityDays || (grade === 'again' ? 0.2 : grade === 'hard' ? 0.7 : grade === 'good' ? 2 : 4);
  if (grade === 'again') return clamp(base * 0.35, 0.2, 7);
  if (grade === 'hard') return clamp(base * 1.2, 0.7, 30);
  if (grade === 'easy') return clamp(base * 2.7, 4, 120);
  const difficultyFactor = 1.7 + (10 - current.difficulty) * 0.08;
  return clamp(base * difficultyFactor, 2, 90);
}

export function updateWordProgress(
  previous: WordProgress | undefined,
  encounter: WordEncounter,
  now = new Date()
): WordProgress {
  const current = normalizeWordProgress(previous);
  const grade = gradeEncounter(encounter);
  const firstTry = grade === 'good' || grade === 'easy';
  const encounterErrors = Math.max(encounter.correct ? 0 : 1, encounter.errors ?? 0);
  const stabilityDays = nextStability(current, grade);
  const newEvidence: WordEvidence = [
    (firstTry ? 1 : 0) as 0 | 1,
    now.toISOString(),
    encounter.sessionId,
    encounter.strength
  ];
  const evidence: WordEvidence[] = [...current.evidence, newEvidence].slice(-3);
  const difficultyDelta = grade === 'again' ? 1.2 : grade === 'hard' ? 0.45 : grade === 'easy' ? -0.7 : -0.3;
  const status = statusFromEvidence(evidence, current.status);
  const nextReview = new Date(now.getTime() + (grade === 'again' ? 10 * MINUTE : stabilityDays * DAY));
  return {
    status,
    attempts: current.attempts + 1,
    correct: current.correct + (encounter.correct ? 1 : 0),
    firstTryCorrect: current.firstTryCorrect + (firstTry ? 1 : 0),
    errors: current.errors + encounterErrors,
    hints: current.hints + Math.max(0, encounter.hints ?? 0),
    streak: firstTry ? current.streak + 1 : 0,
    lapses: current.lapses + (grade === 'again' ? 1 : 0),
    difficulty: clamp(current.difficulty + difficultyDelta, 1, 10),
    stabilityDays,
    evidence,
    lastSeen: now.toISOString(),
    nextReview: nextReview.toISOString()
  };
}

export function isDue(progress: WordProgress | undefined, now = new Date()): boolean {
  const item = normalizeWordProgress(progress);
  return !item.nextReview || new Date(item.nextReview) <= now;
}

export function reviewableWordIds(progress: VocabularyProgress, now = new Date()): string[] {
  return Object.entries(progress)
    .filter(([, item]) => isDue(item, now))
    .sort(([, a], [, b]) => (a.nextReview ?? '').localeCompare(b.nextReview ?? ''))
    .map(([id]) => id);
}

const priorityByStatus: Record<WordMastery, number> = {
  'pas-encore': 9,
  fragile: 7,
  'a-consolider': 5,
  nouveau: 4,
  solide: 1
};

/** Place les mots faibles/échus en tête tout en conservant un peu de variété. */
export function prioritizeAdaptive<T extends { id: string }>(
  items: readonly T[],
  progress: VocabularyProgress,
  recentIds: readonly string[],
  now = new Date(),
  random = Math.random
): T[] {
  const recent = new Set(recentIds);
  return items.map((item) => {
    const state = normalizeWordProgress(progress[item.id]);
    const dueBonus = state.attempts > 0 && isDue(state, now) ? 7 : 0;
    const unseenBonus = state.attempts === 0 ? 2 : 0;
    const recentPenalty = recent.has(item.id) ? 30 : 0;
    return { item, score: priorityByStatus[state.status] + dueBonus + unseenBonus - recentPenalty + random() * 2 };
  }).sort((a, b) => b.score - a.score).map(({ item }) => item);
}

export function masterySummary(progress: VocabularyProgress, now = new Date()) {
  const values = Object.values(progress).map((item) => normalizeWordProgress(item));
  return {
    total: values.length,
    new: values.filter((item) => item.status === 'nouveau').length,
    unknown: values.filter((item) => item.status === 'pas-encore').length,
    fragile: values.filter((item) => item.status === 'fragile').length,
    consolidating: values.filter((item) => item.status === 'a-consolider').length,
    due: values.filter((item) => item.attempts > 0 && isDue(item, now)).length,
    acquired: values.filter((item) => item.status === 'solide').length
  };
}

export function masteryLists<T extends { id: string }>(items: readonly T[], progress: VocabularyProgress) {
  const groups: Record<WordMastery, T[]> = {
    nouveau: [], 'pas-encore': [], fragile: [], 'a-consolider': [], solide: []
  };
  for (const item of items) groups[normalizeWordProgress(progress[item.id]).status].push(item);
  return groups;
}
