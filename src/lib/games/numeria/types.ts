/** Types partagés par le contenu, le moteur d'exercices et l'interface de Numéria. */

export type Grade = '6H' | '7H' | '8H';
export type MissionMode = 'training' | 'guardian';
export type QuestionKind = 'choice' | 'input' | 'numberline';
export type MissionFeedback = 'none' | 'try-again' | 'success' | 'reveal';

export interface Realm {
  id: string;
  grade: Grade;
  order: number;
  name: string;
  subtitle: string;
  symbol: string;
  region: string;
  skill: string;
  learningGoal: string;
  story: string;
  guardian: string;
  color: 'jade' | 'gold' | 'violet' | 'blue' | 'rose';
  /** true = entraînement et boss disponibles sans code ; false = extension facultative. */
  core: boolean;
}

export interface Question {
  id: string;
  realmId: string;
  grade: Grade;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  expected: string;
  hint: string;
  explanation: string;
  /** Pour les questions de droite graduée, repères visuels uniquement. */
  line?: { min: number; max: number; target: number; label: string };
  /** Identifiant court de la famille d'erreurs pour le futur tableau enseignant ORBIS. */
  errorFamily: string;
}

export interface QuestionOutcome {
  solved: boolean;
  firstTry: boolean;
  mistakes: number;
}

/** État suffisant pour reprendre une mission Numéria exactement sur cet appareil. */
export interface ActiveMissionSave {
  realmId: string;
  grade: Grade;
  mode: MissionMode;
  questions: Question[];
  questionIndex: number;
  answer: string;
  attemptsForQuestion: number;
  showHint: boolean;
  feedback: MissionFeedback;
  feedbackText: string;
  questionFinished: boolean;
  outcomes: QuestionOutcome[];
  savedAt: string;
}

export interface RealmProgress {
  trainingBest: number;
  guardianBest: number;
  guardianWon: boolean;
  codexUnlocked: boolean;
  attempts: number;
  totalCorrect: number;
  lastPlayedAt?: string;
}

export interface StudentSave {
  schemaVersion: 3;
  studentName: string;
  grade: Grade;
  xp: number;
  completedRealms: string[];
  teacherBypassRealms: string[];
  realms: Record<string, RealmProgress>;
  codexEntries: string[];
  activeMission?: ActiveMissionSave;
  updatedAt: string;
}

export interface SessionResult {
  correct: number;
  total: number;
  percent: number;
  stars: number;
  xpGained: number;
  guardianWon: boolean;
}
