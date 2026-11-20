import type { Level, Mode, PlayMode } from './types';

export type GeometryMissionId = 'proprietes' | 'triangles' | 'solides' | 'classification';

export type GeometryMission = {
  id: GeometryMissionId;
  title: string;
  description: string;
  mode: Mode;
  skillId: string;
  accent: string;
};

export type GeometryMastery = {
  attempts: number;
  bestScore: number;
  totalQuestions: number;
  firstTryCorrect: number;
  lastPlayedAt: string;
};

export type GeometryMasteryMap = Partial<Record<GeometryMissionId, GeometryMastery>>;

export type GeometryBadge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
};

export const GEOMETRY_MISSIONS: GeometryMission[] = [
  { id: 'proprietes', title: 'Scanner les propriétés', description: 'Repérer côtés, angles, sommets et symétries.', mode: 'A', skillId: 'geometrie.proprietes_figures', accent: 'teal' },
  { id: 'triangles', title: 'Défi des triangles', description: 'Comparer les familles de triangles et leurs propriétés.', mode: 'B', skillId: 'geometrie.triangles', accent: 'violet' },
  { id: 'solides', title: 'Expédition des solides', description: 'Lire faces, arêtes, sommets et formes des faces.', mode: 'C', skillId: 'geometrie.solides', accent: 'amber' },
  { id: 'classification', title: 'Centre de tri', description: 'Classer plusieurs figures selon un critère précis.', mode: 'D', skillId: 'geometrie.classification', accent: 'rose' }
];

export function missionFor(id: GeometryMissionId): GeometryMission {
  return GEOMETRY_MISSIONS.find((mission) => mission.id === id) ?? GEOMETRY_MISSIONS[0];
}

export function missionForMode(mode: Mode | ''): GeometryMission {
  return GEOMETRY_MISSIONS.find((mission) => mission.mode === mode) ?? GEOMETRY_MISSIONS[0];
}

export function dailyMissionKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Une graine distincte par question, stable même après une reprise du jeu. */
export function dailyQuestionRandom(key: string, index: number): () => number {
  let state = 2166136261;
  for (const character of `${key}:${index}`) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function challengeUnlocked(value?: GeometryMastery): boolean {
  return masteryPercent(value) >= 70;
}

export function dailyMission(date = new Date()): { key: string; level: Level; mission: GeometryMission } {
  const key = dailyMissionKey(date);
  const seed = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const mission = GEOMETRY_MISSIONS[seed % GEOMETRY_MISSIONS.length];
  const level: Level = (['6H', '7H', '8H'] as Level[])[seed % 3];
  return { key, level, mission };
}

export function updateMastery(
  mastery: GeometryMasteryMap,
  missionId: GeometryMissionId,
  score: number,
  total: number,
  firstTryCorrect: number,
  now = new Date()
): GeometryMasteryMap {
  const previous = mastery[missionId];
  return {
    ...mastery,
    [missionId]: {
      attempts: (previous?.attempts ?? 0) + 1,
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      totalQuestions: Math.max(previous?.totalQuestions ?? 0, total),
      firstTryCorrect: Math.max(previous?.firstTryCorrect ?? 0, firstTryCorrect),
      lastPlayedAt: now.toISOString()
    }
  };
}

export function masteryPercent(value?: GeometryMastery): number {
  if (!value || value.totalQuestions <= 0) return 0;
  return Math.round((value.bestScore / value.totalQuestions) * 100);
}

export function masteryRank(value?: GeometryMastery): string {
  const percent = masteryPercent(value);
  if (percent >= 90 && (value?.attempts ?? 0) >= 2) return 'Expert';
  if (percent >= 70) return 'Enquêteur';
  return 'Explorateur';
}

export function badgesForMission(
  existing: GeometryBadge[],
  missionId: GeometryMissionId,
  score: number,
  total: number,
  firstTryCorrect: number,
  hadRetry: boolean,
  now = new Date()
): GeometryBadge[] {
  const earned = new Map(existing.map((badge) => [badge.id, badge]));
  const add = (id: string, title: string, description: string, icon: string) => {
    if (!earned.has(id)) earned.set(id, { id, title, description, icon, earnedAt: now.toISOString() });
  };
  add('first-mission', 'Premier dossier', 'Tu as lancé ta première enquête Nexus.', '✦');
  if (score === total) add('geometry-ace', 'As de la géométrie', 'Un dossier réussi sans laisser une propriété au hasard.', '◆');
  if (firstTryCorrect >= Math.ceil(total * 0.7)) add('sharp-eye', 'Œil précis', 'Au moins 70 % des réponses trouvées du premier coup.', '◈');
  if (hadRetry && score > 0) add('persistence', 'Persévérance', 'Tu as corrigé une erreur et poursuivi ton raisonnement.', '↻');
  const mission = missionFor(missionId);
  if (score >= Math.ceil(total * 0.7)) add(`mission-${missionId}`, missionId === 'triangles' ? 'Maître des triangles' : missionId === 'solides' ? 'Détective des solides' : mission.title, `Mission maîtrisée : ${mission.description.toLowerCase()}`, '⬡');
  return [...earned.values()];
}

export function levelForMode(mode: PlayMode): Level {
  return mode === 'D' ? '7H' : mode === 'C' ? '8H' : '6H';
}
