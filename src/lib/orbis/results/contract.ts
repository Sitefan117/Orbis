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
  metadata?: Record<string, unknown>;
};

export type ActivitySubmission =
  | { ok: true; message: string }
  | { ok: false; message: string; reason: 'offline' | 'unavailable' | 'rejected' };
