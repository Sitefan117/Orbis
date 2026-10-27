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
  metadata?: Record<string, unknown>;
};

/** Événement durable stocké localement avant une éventuelle synchronisation. */
export type ActivityEvent = {
  eventId: string;
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
  occurredAt: string;
  metadata?: Record<string, unknown>;
  syncState: 'pending' | 'synced';
  syncedAt?: string;
};

export type ActivitySubmission =
  | { ok: true; message: string; eventId?: string; synced?: boolean }
  | { ok: false; message: string; reason: 'offline' | 'unavailable' | 'rejected' };
