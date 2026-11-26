export const MISSION_GAMES = ['race', 'livrets', 'mathhunt', 'calculs', 'conju_lab', 'shift'] as const;

export type MissionGame = (typeof MISSION_GAMES)[number];

export const MISSION_GAME_INFO: Record<MissionGame, { label: string; prefix: string; route: string }> = {
  race: { label: 'Math Racer', prefix: 'RACE', route: '/race' },
  livrets: { label: 'Atelier des Livrets', prefix: 'LIV', route: '/livrets' },
  mathhunt: { label: 'Math Hunt', prefix: 'HUNT', route: '/mathhunt' },
  calculs: { label: 'Calcul Décimal', prefix: 'CALC', route: '/calculs' },
  conju_lab: { label: 'Conju Lab', prefix: 'CONJ', route: '/conju_lab' },
  shift: { label: 'Shift', prefix: 'SHIFT', route: '/shift' }
};

export function isMissionGame(value: unknown): value is MissionGame {
  return typeof value === 'string' && MISSION_GAMES.includes(value as MissionGame);
}

export function gameCode(game: MissionGame, token: string): string {
  return `${MISSION_GAME_INFO[game].prefix}-${token}`;
}
