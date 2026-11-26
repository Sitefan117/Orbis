export type MathHuntDifficulty = 'FACILE' | 'ACCRUE';

export interface MathHuntMissionConfiguration {
  schemaVersion: 1;
  selectedTables: number[];
  difficulty: MathHuntDifficulty;
  movementOn: boolean;
}

export const DEFAULT_MATHHUNT_CONFIGURATION: MathHuntMissionConfiguration = {
  schemaVersion: 1,
  selectedTables: [2, 3, 4, 5],
  difficulty: 'FACILE',
  movementOn: true
};

export function normalizeMathHuntConfiguration(value: unknown): MathHuntMissionConfiguration | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const selectedTables = [...new Set((Array.isArray(raw.selectedTables) ? raw.selectedTables : [])
    .map(Number).filter((table) => Number.isInteger(table) && table >= 1 && table <= 12))].sort((a, b) => a - b);
  if (selectedTables.length === 0 || (raw.difficulty !== 'FACILE' && raw.difficulty !== 'ACCRUE') || typeof raw.movementOn !== 'boolean') return null;
  return { schemaVersion: 1, selectedTables, difficulty: raw.difficulty, movementOn: raw.movementOn };
}

export function summarizeMathHuntConfiguration(configuration: MathHuntMissionConfiguration): string[] {
  return [`Tables de ${configuration.selectedTables.join(', ')}`, configuration.difficulty === 'FACILE' ? 'Difficulté facile' : 'Difficulté accrue', configuration.movementOn ? 'Cibles mobiles' : 'Cibles fixes'];
}
