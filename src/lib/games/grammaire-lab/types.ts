export type GrammarCategory =
  | 'phrase'
  | 'non-phrase'
  | 'determiner'
  | 'noun'
  | 'adjective'
  | 'subject'
  | 'verb'
  | 'complement'
  | 'place'
  | 'time'
  | 'manner'
  | 'pronoun'
  | 'negation'
  | 'punctuation'
  | 'neutral';

export type ChallengeKind = 'order' | 'select' | 'highlight' | 'repair' | 'move';
export type GrammarTask = 'observer' | 'trier' | 'construire' | 'analyser' | 'completer' | 'transformer' | 'comparer';

export type GrammarBlock = {
  id: string;
  text: string;
  category: GrammarCategory;
  group?: string;
  label?: string;
};

export type GrammarChallenge = {
  id: string;
  kind: ChallengeKind;
  task?: GrammarTask;
  prompt: string;
  context?: string;
  repair?: { before: string; wrong: string; after: string };
  moveOperation?: 'remove' | 'front';
  blocks: GrammarBlock[];
  solution: string[];
  acceptedSolutions?: string[][];
  sentence: string;
  explanation: string;
  hint: string;
  errorFamily: string;
};

export type GrammarLevel = {
  id: number;
  title: string;
  shortTitle: string;
  grade: string;
  goal: string;
  prerequisite: string;
  notions: string[];
  requiredErrorFamilies?: string[];
  theory: string;
  categoriesVisible: GrammarCategory[];
  challenges: GrammarChallenge[];
};

export type GrammarProgress = {
  unlockedLevel: number;
  completedLevels: number[];
  starsByLevel: Record<number, number>;
  totalCorrect: number;
  totalErrors: number;
  practiceSessions?: number;
  updatedAt: string;
};

export type ActivityStats = {
  correct: number;
  autonomousCorrect: number;
  questions: number;
  errors: number;
  hints: number;
  errorFamilies: Record<string, number>;
  startedAt: number;
};
