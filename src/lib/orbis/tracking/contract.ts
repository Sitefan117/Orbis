import type { WorldId } from '$lib/orbis/catalog/games';

/** Bilan commun : tous les jeux emploient ces mêmes noms de champs. */
export type GameActivityInput = {
  studentName: string;
  gameId: WorldId;
  activityId: string;
  correctCount: number;
  questionCount: number;
  skillId?: string;
  errorCount?: number;
  errorFamilies?: Array<string | object>;
  hintsUsed?: number;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
};

/** Copie de progression facultative ; la structure de state reste celle du jeu. */
export type GameProgressInput<TState> = {
  studentName: string;
  gameId: WorldId;
  state: TState;
  formatVersion: number;
  summary?: {
    label: string;
    completed?: number;
    total?: number;
  };
};
