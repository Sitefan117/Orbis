export const RACE_NOTIONS = [
  'livrets',
  'doubles',
  'triples',
  'quadruples',
  'complements10',
  'complements100',
  'complements1000',
  'dizaineSuivante',
  'centaineSuivante',
  'millierSuivant',
  'trous',
  'divisions'
] as const;

export type RaceNotion = (typeof RACE_NOTIONS)[number];
export type RacePracticeLevel = 'guided' | 'standard' | 'challenge';
export type RaceGameMode = 'training' | 'arcade';

export interface RaceMissionConfiguration {
  schemaVersion: 1;
  selectedNotions: RaceNotion[];
  selectedTables: number[];
  practiceLevel: RacePracticeLevel;
  gameMode: RaceGameMode;
  questionCount: number;
}

export const DEFAULT_RACE_CONFIGURATION: RaceMissionConfiguration = {
  schemaVersion: 1,
  selectedNotions: ['livrets', 'doubles', 'complements10'],
  selectedTables: [2, 3, 4, 5],
  practiceLevel: 'guided',
  gameMode: 'training',
  questionCount: 12
};

const RACE_NOTION_LABELS: Record<RaceNotion, string> = {
  livrets: 'Livrets',
  doubles: 'Doubles / moitiés',
  triples: 'Triples',
  quadruples: 'Quadruples',
  complements10: 'Compléments à 10',
  complements100: 'Compléments à 100',
  complements1000: 'Compléments à 1 000',
  dizaineSuivante: 'Dizaine suivante',
  centaineSuivante: 'Centaine suivante',
  millierSuivant: 'Millier suivant',
  trous: 'Facteur manquant',
  divisions: 'Divisions liées'
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeRaceConfiguration(value: unknown): RaceMissionConfiguration | null {
  if (!isRecord(value)) return null;

  const rawNotions = Array.isArray(value.selectedNotions) ? value.selectedNotions : [];
  const selectedNotions = [...new Set(rawNotions.filter((notion): notion is RaceNotion =>
    typeof notion === 'string' && RACE_NOTIONS.includes(notion as RaceNotion)
  ))];
  if (selectedNotions.length === 0) return null;

  const rawTables = Array.isArray(value.selectedTables) ? value.selectedTables : [];
  const selectedTables = [...new Set(rawTables
    .map(Number)
    .filter((table) => Number.isInteger(table) && table >= 1 && table <= 12)
  )].sort((a, b) => a - b);
  if (selectedNotions.includes('livrets') && selectedTables.length === 0) return null;

  const practiceLevel = value.practiceLevel;
  const gameMode = value.gameMode;
  const questionCount = Number(value.questionCount);
  if (practiceLevel !== 'guided' && practiceLevel !== 'standard' && practiceLevel !== 'challenge') return null;
  if (gameMode !== 'training' && gameMode !== 'arcade') return null;
  if (!Number.isInteger(questionCount) || questionCount < 6 || questionCount > 15) return null;

  return {
    schemaVersion: 1,
    selectedNotions,
    selectedTables,
    practiceLevel,
    gameMode,
    questionCount
  };
}

export function summarizeRaceConfiguration(configuration: RaceMissionConfiguration): string[] {
  const summary = configuration.selectedNotions.map((notion) => {
    if (notion !== 'livrets') return RACE_NOTION_LABELS[notion];
    const tableLabel = configuration.selectedTables.length === 1 ? 'Table' : 'Tables';
    return `${tableLabel} de ${configuration.selectedTables.join(', ')}`;
  });
  summary.push(
    configuration.practiceLevel === 'guided' ? 'Niveau guidé' : configuration.practiceLevel === 'standard' ? 'Niveau standard' : 'Niveau défi',
    configuration.gameMode === 'training' ? 'Entraînement' : 'Arcade',
    `${configuration.questionCount} questions`
  );
  return summary;
}
