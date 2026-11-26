export const SHIFT_MISSION_IDS = ['factory', 'measure', 'words', 'decompose', 'sort', 'line', 'rank', 'build'] as const;
export const SHIFT_DIFFICULTIES = ['starter', 'workshop', 'decimal', 'expedition'] as const;
export type ShiftMissionId = (typeof SHIFT_MISSION_IDS)[number];
export type ShiftDifficulty = (typeof SHIFT_DIFFICULTIES)[number];
export type ShiftPlayStyle = 'practice' | 'challenge';

export interface ShiftMissionConfiguration {
  schemaVersion: 1;
  missionId: ShiftMissionId;
  difficulty: ShiftDifficulty;
  playStyle: ShiftPlayStyle;
}

export const DEFAULT_SHIFT_CONFIGURATION: ShiftMissionConfiguration = { schemaVersion: 1, missionId: 'factory', difficulty: 'starter', playStyle: 'practice' };

export const SHIFT_MISSION_LABELS: Record<ShiftMissionId, string> = {
  factory: 'Fabrique des nombres', measure: 'Convertisseur', words: 'Scanner de nombres', decompose: 'Labo des rangs', sort: 'Centre de tri', line: 'Ligne de précision', rank: 'Compteur de rangs', build: 'Crée un nombre'
};
export const SHIFT_DIFFICULTY_LABELS: Record<ShiftDifficulty, string> = { starter: 'Réactivation', workshop: 'Atelier', decimal: 'Décimaux', expedition: 'Grande expédition' };

export function normalizeShiftConfiguration(value: unknown): ShiftMissionConfiguration | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!SHIFT_MISSION_IDS.includes(raw.missionId as ShiftMissionId) || !SHIFT_DIFFICULTIES.includes(raw.difficulty as ShiftDifficulty) || (raw.playStyle !== 'practice' && raw.playStyle !== 'challenge')) return null;
  return { schemaVersion: 1, missionId: raw.missionId as ShiftMissionId, difficulty: raw.difficulty as ShiftDifficulty, playStyle: raw.playStyle };
}

export function summarizeShiftConfiguration(configuration: ShiftMissionConfiguration): string[] {
  return [SHIFT_MISSION_LABELS[configuration.missionId], SHIFT_DIFFICULTY_LABELS[configuration.difficulty], configuration.playStyle === 'practice' ? 'Entraînement' : 'Défi · 3 vies'];
}
