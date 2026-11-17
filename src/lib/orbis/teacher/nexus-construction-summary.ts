import { GEOMETRY_FIGURES } from '../../games/geometrie/figures';
import type { RemoteActivityEvent } from './remote';

export type NexusConstructionRow = {
  figureId: string;
  figureName: string;
  sessions: number;
  students: number;
  attempts: number;
  hints: number;
  latestAt: string;
};

/** Décrit les croquis terminés, sans convertir leurs essais en note scolaire. */
export function summarizeNexusConstruction(events: readonly RemoteActivityEvent[]): NexusConstructionRow[] {
  const known = new Map(GEOMETRY_FIGURES.map((figure) => [figure.id, figure.name]));
  const groups = new Map<string, { sessions: number; studentIds: Set<string>; attempts: number; hints: number; latestAt: string }>();
  for (const event of events) {
    if (event.game_id !== 'geometrie') continue;
    const figureId = event.metadata?.figureId;
    if (typeof figureId !== 'string' || !known.has(figureId)) continue;
    const group = groups.get(figureId) ?? { sessions: 0, studentIds: new Set<string>(), attempts: 0, hints: 0, latestAt: '' };
    group.sessions += 1;
    group.studentIds.add(event.student_id);
    const value = Number(event.metadata?.totalChecks ?? event.metadata?.totalAttempts);
    if (Number.isFinite(value) && value >= 1) group.attempts += value;
    group.hints += event.hints_used ?? 0;
    if (event.occurred_at > group.latestAt) group.latestAt = event.occurred_at;
    groups.set(figureId, group);
  }
  return [...groups].map(([figureId, value]) => ({
    figureId, figureName: known.get(figureId)!, sessions: value.sessions,
    students: value.studentIds.size, attempts: value.attempts, hints: value.hints, latestAt: value.latestAt
  })).sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}
