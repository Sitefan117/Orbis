import type { WorldId } from '$lib/orbis/catalog/games';

/** Format de transition utilisé par les activités qui envoient un bilan. */
export type ActivityPayload = {
  studentName: string;
  world: WorldId;
  mission: string;
  score: number;
  total: number;
  scoreBasis?: 'last' | 'best';
  errorCount?: number;
  errorFamilies?: Array<string | object>;
  skillId?: string;
  hintsUsed?: number;
  durationSeconds?: number;
  responseDetails?: ResponseDetail[];
  metadata?: Record<string, unknown>;
  /** Permet de distinguer une séance de jeu d'un cours suivi. */
  activityKind?: 'game' | 'course';
  /** Regroupe les réponses d'une même séance ou d'un cours. */
  sessionId?: string;
};

/** Trace structurée d'une question, sans enregistrer de document libre. */
export type ResponseDetail = {
  questionIndex: number;
  /** Identifiant stable de l'item, utile pour comparer plusieurs tentatives. */
  questionId?: string;
  /** Compétence précise de cette question lorsqu'une activité en mélange plusieurs. */
  skillId?: string;
  /** Regroupement lisible pour l'enseignant (numération, mesure, grammaire…). */
  category?: string;
  prompt?: string;
  response?: string;
  expected?: string;
  correct: boolean;
  attempts?: number;
  hintsUsed?: number;
  durationSeconds?: number;
  errorFamily?: string;
};

/** Événement durable stocké localement avant une éventuelle synchronisation. */
export type ActivityEvent = {
  eventId: string;
  /** Lie une file hors ligne au compte authentifié qui l'a produite. */
  remoteStudentId?: string;
  studentName: string;
  gameId: WorldId;
  activityId: string;
  skillId?: string;
  correctCount: number;
  questionCount: number;
  errorCount: number;
  errorFamilies: string[];
  hintsUsed?: number;
  durationSeconds?: number;
  responseDetails?: ResponseDetail[];
  occurredAt: string;
  metadata?: Record<string, unknown>;
  activityKind?: 'game' | 'course';
  sessionId?: string;
  syncState: 'pending' | 'synced';
  syncedAt?: string;
};

export type ActivitySubmission =
  | { ok: true; message: string; eventId?: string; synced?: boolean }
  | { ok: false; message: string; reason: 'offline' | 'unavailable' | 'rejected' };
