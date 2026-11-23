export type BazarLevel = 6 | 7 | 8;

export type BazarThemeId =
  | 'phrase'
  | 'transformation'
  | 'accords'
  | 'orthographe'
  | 'vocabulaire'
  | 'lecture'
  | 'connecteurs'
  | 'revision'
  | 'ecriture';

export type BazarTheme = {
  id: BazarThemeId;
  title: string;
  stall: string;
  emoji: string;
  description: string;
  color: string;
};

export type BazarChallenge = {
  id: string;
  level: BazarLevel;
  theme: BazarThemeId;
  skillId: string;
  instruction: string;
  context?: string;
  prompt: string;
  choices: string[];
  answer: string;
  hint: string;
  explanation: string;
  errorFamily: string;
};

export type BazarLevelProgress = {
  completedThemes: BazarThemeId[];
  bestScores: Partial<Record<BazarThemeId, number>>;
};

export type BazarProgress = {
  selectedLevel: BazarLevel;
  levels: Partial<Record<BazarLevel, BazarLevelProgress>>;
  updatedAt: string;
};
