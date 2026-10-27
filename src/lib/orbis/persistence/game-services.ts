import type { GameProgressService, OrbisResult, SaveRecord } from '$lib/orbis/progress/contract';
import { loadLocalGameSave, saveLocalGameState, storeRemoteGameSave } from './local-store';
import { getRemoteSession } from './remote-session';
import { downloadGameSave, getSupabasePublicConfig } from './supabase-rest';
import { installOrbisOnlineSync, syncPendingOrbisData } from './sync';

/** Adaptateur facultatif : chaque jeu garde la structure interne de son état. */
export function createGameProgressService<TState>(
  studentName: string,
  gameId: string
): GameProgressService<TState> {
  return {
    async loadProgress(): Promise<OrbisResult<SaveRecord<TState> | null>> {
      const local = loadLocalGameSave(studentName, gameId);
      const config = getSupabasePublicConfig();
      const session = getRemoteSession();
      if (!config || !session || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        return { ok: true, value: local ? local.record as SaveRecord<TState> : null };
      }
      try {
        const remote = await downloadGameSave<TState>(gameId, config, session);
        if (!remote) return { ok: true, value: local ? local.record as SaveRecord<TState> : null };
        if (local?.syncState === 'conflict'
          || (local?.syncState === 'pending' && remote.revision > (local.remoteRevision ?? 0))) {
          return { ok: false, error: 'conflict', message: 'Une autre version de cette sauvegarde existe en ligne.' };
        }
        if (!local || (local.syncState === 'synced' && remote.revision > (local.remoteRevision ?? 0))) {
          const record: SaveRecord<TState> = remote;
          storeRemoteGameSave(studentName, gameId, record);
          return { ok: true, value: record };
        }
        return { ok: true, value: local.record as SaveRecord<TState> };
      } catch {
        return { ok: true, value: local ? local.record as SaveRecord<TState> : null };
      }
    },
    async saveProgress(state: TState, formatVersion: number): Promise<OrbisResult<SaveRecord<TState>>> {
      const saved = saveLocalGameState(studentName, gameId, state, formatVersion);
      if (!saved) return { ok: false, error: 'storage-unavailable', message: 'Le navigateur refuse le stockage local.' };
      installOrbisOnlineSync();
      void syncPendingOrbisData();
      return { ok: true, value: saved.record as SaveRecord<TState> };
    }
  };
}

/**
 * Copie non bloquante destinée aux jeux qui possèdent déjà leur propre sauvegarde.
 * Leur ancien format reste la source principale pendant la transition.
 */
export function queueGameProgressSnapshot<TState>(
  studentName: string,
  gameId: string,
  state: TState,
  formatVersion = 1,
  progressSummary?: { label: string; completed?: number; total?: number }
): void {
  if (!studentName.trim()) return;
  const saved = saveLocalGameState(studentName, gameId, state, formatVersion, progressSummary);
  if (saved) {
    installOrbisOnlineSync();
    void syncPendingOrbisData();
  }
}
