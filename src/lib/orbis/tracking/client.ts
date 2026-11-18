import { queueGameProgressSnapshot } from '$lib/orbis/persistence/game-services';
import { submitActivityResult, type ActivitySubmission } from '$lib/orbis/results/client';
import type { GameActivityInput, GameProgressInput } from './contract';

/** Point d’entrée commun pour le bilan de fin d’une activité. */
export function recordGameActivity(input: GameActivityInput): Promise<ActivitySubmission> {
  return submitActivityResult({
    studentName: input.studentName,
    world: input.gameId,
    mission: input.activityId,
    score: input.correctCount,
    total: input.questionCount,
    errorCount: input.errorCount,
    errorFamilies: input.errorFamilies,
    skillId: input.skillId,
    hintsUsed: input.hintsUsed,
    durationSeconds: input.durationSeconds,
    responseDetails: input.responseDetails,
    metadata: input.metadata,
    activityKind: input.activityKind,
    sessionId: input.sessionId
  });
}

/** Même format que les jeux, mais marqué explicitement comme cours. */
export function recordCourseActivity(input: Omit<GameActivityInput, 'activityKind'>): Promise<ActivitySubmission> {
  return recordGameActivity({ ...input, activityKind: 'course' });
}

/** Point d’entrée commun pour une sauvegarde, sans interpréter l’état du jeu. */
export function recordGameProgress<TState>(input: GameProgressInput<TState>): void {
  queueGameProgressSnapshot(
    input.studentName,
    input.gameId,
    input.state,
    input.formatVersion,
    input.summary
  );
}

export type { GameActivityInput, GameProgressInput } from './contract';
