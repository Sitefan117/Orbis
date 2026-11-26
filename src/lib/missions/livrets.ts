export interface LivretsMissionConfiguration {
  schemaVersion: 1;
  selectedTables: number[];
  questionCount: number;
}

export const DEFAULT_LIVRETS_CONFIGURATION: LivretsMissionConfiguration = {
  schemaVersion: 1,
  selectedTables: [2, 3, 4, 5],
  questionCount: 10
};

export function normalizeLivretsConfiguration(value: unknown): LivretsMissionConfiguration | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const selectedTables = [...new Set((Array.isArray(raw.selectedTables) ? raw.selectedTables : [])
    .map(Number).filter((table) => Number.isInteger(table) && table >= 1 && table <= 12))].sort((a, b) => a - b);
  const questionCount = Number(raw.questionCount);
  if (selectedTables.length === 0 || !Number.isInteger(questionCount) || questionCount < 5 || questionCount > 20) return null;
  return { schemaVersion: 1, selectedTables, questionCount };
}

export function summarizeLivretsConfiguration(configuration: LivretsMissionConfiguration): string[] {
  return [`Tables de ${configuration.selectedTables.join(', ')}`, `${configuration.questionCount} questions`];
}
