import { studentStorageScope } from '$lib/orbis/identity/local-student';
import type { SaveRecord } from '$lib/orbis/progress/contract';
import type { ActivityEvent, ActivityPayload } from '$lib/orbis/results/contract';

const EVENTS_KEY = 'orbis:activity-events:v1';
const SAVES_KEY = 'orbis:game-saves:v1';
const MAX_LOCAL_EVENTS = 2_000;

type LocalSaveEnvelope = {
  studentScope: string;
  studentName: string;
  gameId: string;
  record: SaveRecord<Record<string, unknown>>;
  progressSummary?: { label: string; completed?: number; total?: number };
  syncState: 'pending' | 'synced' | 'conflict';
  /** Dernière révision confirmée par le service distant, indépendante des écritures locales. */
  remoteRevision: number;
  syncedAt?: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizedErrorFamilies(values: ActivityPayload['errorFamilies']): string[] {
  if (!values) return [];
  return [...new Set(values.map((value) => typeof value === 'string' ? value : JSON.stringify(value)))]
    .map((value) => value.slice(0, 120))
    .slice(0, 20);
}

function boundedInteger(value: unknown, min: number, max: number): number | undefined {
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function createLocalActivityEvent(payload: ActivityPayload): ActivityEvent {
  const questionCount = boundedInteger(payload.total, 1, 10_000) ?? 1;
  const correctCount = boundedInteger(payload.score, 0, questionCount) ?? 0;
  return {
    eventId: createEventId(),
    studentName: payload.studentName.trim().slice(0, 80) || 'Explorateur',
    gameId: payload.world,
    activityId: payload.mission.trim().slice(0, 120) || 'activité',
    ...(payload.skillId?.trim() ? { skillId: payload.skillId.trim().slice(0, 120) } : {}),
    correctCount,
    questionCount,
    errorCount: boundedInteger(payload.errorCount ?? questionCount - correctCount, 0, 10_000) ?? 0,
    errorFamilies: normalizedErrorFamilies(payload.errorFamilies),
    ...(payload.hintsUsed === undefined ? {} : { hintsUsed: boundedInteger(payload.hintsUsed, 0, 10_000) ?? 0 }),
    ...(payload.durationSeconds === undefined ? {} : { durationSeconds: boundedInteger(payload.durationSeconds, 0, 86_400) ?? 0 }),
    occurredAt: new Date().toISOString(),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
    syncState: 'pending'
  };
}

export function appendLocalActivityEvent(event: ActivityEvent): boolean {
  const events = getLocalActivityEvents();
  if (events.some((item) => item.eventId === event.eventId)) return true;
  return writeJson(EVENTS_KEY, [...events, event].slice(-MAX_LOCAL_EVENTS));
}

export function getLocalActivityEvents(): ActivityEvent[] {
  const events = readJson<unknown[]>(EVENTS_KEY, []);
  return events.filter((event): event is ActivityEvent => Boolean(
    event && typeof event === 'object' && typeof (event as ActivityEvent).eventId === 'string'
  ));
}

export function getPendingActivityEvents(): ActivityEvent[] {
  return getLocalActivityEvents().filter((event) => event.syncState !== 'synced');
}

export function markActivityEventSynced(eventId: string): void {
  const now = new Date().toISOString();
  const events = getLocalActivityEvents().map((event) => event.eventId === eventId
    ? { ...event, syncState: 'synced' as const, syncedAt: now }
    : event);
  writeJson(EVENTS_KEY, events);
}

export function clearLocalActivityEvents(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(EVENTS_KEY);
}

function saveKey(studentName: string, gameId: string): string {
  return `${studentStorageScope(studentName)}::${gameId}`;
}

function readSaveMap(): Record<string, LocalSaveEnvelope> {
  return readJson<Record<string, LocalSaveEnvelope>>(SAVES_KEY, {});
}

export function loadLocalGameSave(studentName: string, gameId: string): LocalSaveEnvelope | null {
  return readSaveMap()[saveKey(studentName, gameId)] ?? null;
}

/** Installe une sauvegarde distante déjà validée sans toucher aux anciennes clés du jeu. */
export function storeRemoteGameSave<TState>(
  studentName: string,
  gameId: string,
  record: SaveRecord<TState>
): LocalSaveEnvelope | null {
  const saves = readSaveMap();
  const key = saveKey(studentName, gameId);
  const envelope: LocalSaveEnvelope = {
    studentScope: studentStorageScope(studentName),
    studentName: studentName.trim(),
    gameId,
    record: record as SaveRecord<Record<string, unknown>>,
    remoteRevision: record.revision,
    syncState: 'synced',
    syncedAt: new Date().toISOString()
  };
  saves[key] = envelope;
  return writeJson(SAVES_KEY, saves) ? envelope : null;
}

export function saveLocalGameState<TState>(
  studentName: string,
  gameId: string,
  state: TState,
  formatVersion: number,
  progressSummary?: LocalSaveEnvelope['progressSummary']
): LocalSaveEnvelope | null {
  const saves = readSaveMap();
  const key = saveKey(studentName, gameId);
  const previous = saves[key];
  const envelope: LocalSaveEnvelope = {
    studentScope: studentStorageScope(studentName),
    studentName: studentName.trim(),
    gameId,
    record: {
      state: state as Record<string, unknown>,
      formatVersion: Math.max(1, Math.round(formatVersion)),
      updatedAt: new Date().toISOString(),
      revision: (previous?.record.revision ?? 0) + 1
    },
    syncState: 'pending',
    remoteRevision: previous?.remoteRevision ?? 0,
    ...(progressSummary ? { progressSummary } : {})
  };
  saves[key] = envelope;
  return writeJson(SAVES_KEY, saves) ? envelope : null;
}

export function getPendingGameSaves(): LocalSaveEnvelope[] {
  return Object.values(readSaveMap()).filter((save) => save.syncState !== 'synced');
}

export function getLocalGameSaves(): LocalSaveEnvelope[] {
  return Object.values(readSaveMap());
}

export function markGameSaveSynced(studentScope: string, gameId: string, localRevision: number, remoteRevision: number): void {
  const saves = readSaveMap();
  const key = `${studentScope}::${gameId}`;
  const current = saves[key];
  if (!current) return;
  // Une nouvelle écriture a pu arriver pendant la requête : elle doit rester en attente.
  saves[key] = current.record.revision === localRevision
    ? { ...current, remoteRevision, syncState: 'synced', syncedAt: new Date().toISOString() }
    : { ...current, remoteRevision, syncState: 'pending' };
  writeJson(SAVES_KEY, saves);
}

export function markGameSaveConflict(studentScope: string, gameId: string, localRevision: number): void {
  const saves = readSaveMap();
  const key = `${studentScope}::${gameId}`;
  const current = saves[key];
  if (!current || current.record.revision !== localRevision) return;
  saves[key] = { ...current, syncState: 'conflict' };
  writeJson(SAVES_KEY, saves);
}

export type { LocalSaveEnvelope };
