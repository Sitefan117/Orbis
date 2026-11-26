import { and, desc, eq, or } from 'drizzle-orm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { MISSION_GAME_INFO, isMissionGame, gameCode, type MissionGame } from '$lib/missions/catalog';
import { normalizeRaceConfiguration, summarizeRaceConfiguration } from '$lib/missions/race';
import { normalizeLivretsConfiguration, summarizeLivretsConfiguration } from '$lib/missions/livrets';
import { normalizeMathHuntConfiguration, summarizeMathHuntConfiguration } from '$lib/missions/mathhunt';
import { normalizeCalculsConfiguration, summarizeCalculsConfiguration } from '$lib/missions/calculs';
import { normalizeConjuLabConfiguration, summarizeConjuLabConfiguration } from '$lib/missions/conju-lab';
import { normalizeShiftConfiguration, summarizeShiftConfiguration } from '$lib/missions/shift';
import { getDb } from './db/client';
import { learningMissions } from './db/schema';

export type MissionScope = 'portal' | 'game';
export interface PublicLearningMission { id: string; code: string; portalCode: string; gameCode: string; scope: MissionScope; game: MissionGame; configuration: unknown; summary: string[]; createdAt: number; expiresAt: number | null; }

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const adapters: Record<MissionGame, { normalize: (value: unknown) => unknown | null; summarize: (configuration: never) => string[] }> = {
  race: { normalize: normalizeRaceConfiguration, summarize: summarizeRaceConfiguration as (configuration: never) => string[] },
  livrets: { normalize: normalizeLivretsConfiguration, summarize: summarizeLivretsConfiguration as (configuration: never) => string[] },
  mathhunt: { normalize: normalizeMathHuntConfiguration, summarize: summarizeMathHuntConfiguration as (configuration: never) => string[] },
  calculs: { normalize: normalizeCalculsConfiguration, summarize: summarizeCalculsConfiguration as (configuration: never) => string[] },
  conju_lab: { normalize: normalizeConjuLabConfiguration, summarize: summarizeConjuLabConfiguration as (configuration: never) => string[] },
  shift: { normalize: normalizeShiftConfiguration, summarize: summarizeShiftConfiguration as (configuration: never) => string[] }
};

function codeSuffix(): string { const bytes = randomBytes(6); return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join(''); }
function missionToken(code: string): string { const normalized = code.trim().toUpperCase().replace(/\s+/g, ''); const separator = normalized.indexOf('-'); return separator === -1 ? normalized : normalized.slice(separator + 1); }
function configurationKey(game: string, configurationJson: string): string { return createHash('sha256').update(`${game}:${configurationJson}`).digest('hex'); }
function prefixGame(code: string): MissionGame | null { const prefix = code.split('-', 1)[0]; return (Object.entries(MISSION_GAME_INFO).find(([, info]) => info.prefix === prefix)?.[0] as MissionGame | undefined) ?? null; }

function parseMission(row: typeof learningMissions.$inferSelect, requestedScope?: MissionScope): PublicLearningMission | null {
  if (!isMissionGame(row.game) || (row.scope !== 'portal' && row.scope !== 'game')) return null;
  try {
    const adapter = adapters[row.game];
    const configuration = adapter.normalize(JSON.parse(row.configurationJson));
    if (!configuration) return null;
    const token = missionToken(row.code);
    const scope = requestedScope ?? row.scope;
    const directCode = gameCode(row.game, token);
    return { id: row.id, code: scope === 'portal' ? token : directCode, portalCode: token, gameCode: directCode, scope, game: row.game, configuration, summary: adapter.summarize(configuration as never), createdAt: row.createdAt, expiresAt: row.expiresAt };
  } catch { return null; }
}

export function createLearningMission(input: { scope: MissionScope; game: MissionGame; configuration: unknown; expiresAt?: number | null }): PublicLearningMission {
  const configuration = adapters[input.game].normalize(input.configuration);
  if (!configuration) throw new Error(`Configuration ${MISSION_GAME_INFO[input.game].label} invalide.`);
  const db = getDb();
  const configurationJson = JSON.stringify(configuration);
  const key = configurationKey(input.game, configurationJson);
  const existingConfiguration = db.select().from(learningMissions).where(and(eq(learningMissions.game, input.game), eq(learningMissions.configurationKey, key))).get();
  if (existingConfiguration) { const existingMission = parseMission(existingConfiguration, input.scope); if (existingMission) return existingMission; }
  const existingTokens = new Set(db.select({ code: learningMissions.code }).from(learningMissions).all().map((row) => missionToken(row.code)));
  let code = '';
  for (let attempt = 0; attempt < 20; attempt++) { const candidate = codeSuffix(); if (!existingTokens.has(candidate)) { code = candidate; break; } }
  if (!code) throw new Error('Impossible de générer un code unique.');
  const row = db.insert(learningMissions).values({ id: randomUUID(), code, scope: input.scope, game: input.game, configurationJson, configurationKey: key, createdAt: Date.now(), expiresAt: input.expiresAt ?? null, disabledAt: null }).returning().get();
  const mission = parseMission(row, input.scope);
  if (!mission) throw new Error('Mission créée mais illisible.');
  return mission;
}

export function findActiveLearningMission(codeInput: string): PublicLearningMission | null {
  const code = codeInput.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) return null;
  const hasPrefix = code.includes('-');
  const requestedGame = hasPrefix && !code.startsWith('ORBIS-') ? prefixGame(code) : null;
  if (hasPrefix && !code.startsWith('ORBIS-') && !requestedGame) return null;
  const scope: MissionScope = requestedGame ? 'game' : 'portal';
  const token = missionToken(code);
  const row = getDb().select().from(learningMissions).where(or(eq(learningMissions.code, code), eq(learningMissions.code, token), eq(learningMissions.code, `ORBIS-${token}`))).get();
  if (!row || row.disabledAt || (row.expiresAt !== null && row.expiresAt < Date.now()) || (requestedGame && row.game !== requestedGame)) return null;
  const key = configurationKey(row.game, row.configurationJson);
  const canonicalRow = getDb().select().from(learningMissions).where(and(eq(learningMissions.game, row.game), eq(learningMissions.configurationKey, key))).get() ?? row;
  return parseMission(canonicalRow, scope);
}

export function listLearningMissions(limit = 50): PublicLearningMission[] {
  const seen = new Set<string>(); const missions: PublicLearningMission[] = [];
  for (const row of getDb().select().from(learningMissions).orderBy(desc(learningMissions.createdAt)).all()) {
    const dedupeKey = `${row.game}:${row.configurationJson}`; if (seen.has(dedupeKey)) continue; seen.add(dedupeKey);
    const mission = parseMission(row); if (mission) missions.push(mission); if (missions.length >= limit) break;
  }
  return missions;
}
