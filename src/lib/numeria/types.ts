/** Types partagés par le contenu, le moteur d'exercices et l'interface de Numéria. */

export type Grade = '6H' | '7H' | '8H';
export type MissionMode = 'training' | 'guardian';
export type QuestionKind = 'choice' | 'input' | 'numberline';

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
  schemaVersion: 2;
  studentName: string;
  grade: Grade;
  xp: number;
  completedRealms: string[];
  teacherBypassRealms: string[];
  realms: Record<string, RealmProgress>;
  codexEntries: string[];
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
