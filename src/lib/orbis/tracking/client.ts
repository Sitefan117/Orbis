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
    metadata: input.metadata
  });
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
