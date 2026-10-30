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

export type ChallengeKind = 'order' | 'select';

export type GrammarBlock = {
  id: string;
  text: string;
  category: GrammarCategory;
  group?: string;
};

export type GrammarChallenge = {
  id: string;
  kind: ChallengeKind;
  prompt: string;
  context?: string;
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
  updatedAt: string;
};

export type ActivityStats = {
  correct: number;
  questions: number;
  errors: number;
  hints: number;
  errorFamilies: Record<string, number>;
  startedAt: number;
};
