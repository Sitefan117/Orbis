export type DecimalOperation = '+' | '-';

export interface CalculsMissionConfiguration {
  schemaVersion: 1;
  activeLevels: number[];
  operations: DecimalOperation[];
  questionCount: number;
}

export const DEFAULT_CALCULS_CONFIGURATION: CalculsMissionConfiguration = {
  schemaVersion: 1,
  activeLevels: [1],
  operations: ['+', '-'],
  questionCount: 10
};

export function normalizeCalculsConfiguration(value: unknown): CalculsMissionConfiguration | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const activeLevels = [...new Set((Array.isArray(raw.activeLevels) ? raw.activeLevels : []).map(Number)
    .filter((level) => Number.isInteger(level) && level >= 1 && level <= 3))].sort((a, b) => a - b);
  const operations = [...new Set((Array.isArray(raw.operations) ? raw.operations : [])
    .filter((operation): operation is DecimalOperation => operation === '+' || operation === '-'))];
  const questionCount = Number(raw.questionCount);
  if (activeLevels.length === 0 || operations.length === 0 || !Number.isInteger(questionCount) || questionCount < 5 || questionCount > 20) return null;
  return { schemaVersion: 1, activeLevels, operations, questionCount };
}

export function summarizeCalculsConfiguration(configuration: CalculsMissionConfiguration): string[] {
  const operationLabel = configuration.operations.length === 2 ? 'Additions et soustractions' : configuration.operations[0] === '+' ? 'Additions' : 'Soustractions';
  return [`Niveaux ${configuration.activeLevels.join(', ')}`, operationLabel, `${configuration.questionCount} questions`];
}
