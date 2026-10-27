import {
  getPendingActivityEvents,
  getPendingGameSaves,
  markActivityEventSynced,
  markGameSaveConflict,
  markGameSaveSynced
} from './local-store';
import { getRemoteSession } from './remote-session';
import { getSupabasePublicConfig, uploadActivityEvent, uploadGameSave } from './supabase-rest';

export type SyncReport = {
  available: boolean;
  eventsSynced: number;
  savesSynced: number;
  pending: number;
  message: string;
};

let activeSync: Promise<SyncReport> | null = null;

async function performSync(): Promise<SyncReport> {
  const config = getSupabasePublicConfig();
  const session = getRemoteSession();
  const pendingEvents = getPendingActivityEvents();
  const pendingSaves = getPendingGameSaves();
  const pending = pendingEvents.length + pendingSaves.length;

  if (!config || !session) {
    return { available: false, eventsSynced: 0, savesSynced: 0, pending, message: 'Données conservées localement.' };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { available: true, eventsSynced: 0, savesSynced: 0, pending, message: 'Hors ligne : synchronisation en attente.' };
  }

  let eventsSynced = 0;
  let savesSynced = 0;
  for (const event of pendingEvents) {
    try {
      const response = await uploadActivityEvent(event, config, session);
      if (response.ok) {
        markActivityEventSynced(event.eventId);
        eventsSynced += 1;
      }
    } catch {
      break;
    }
  }
  for (const save of pendingSaves) {
    try {
      const result = await uploadGameSave(save, config, session);
      if (result.response.ok && result.remoteRevision) {
        markGameSaveSynced(save.studentScope, save.gameId, save.record.revision, result.remoteRevision);
        savesSynced += 1;
      } else if (result.response.status === 409) {
        markGameSaveConflict(save.studentScope, save.gameId, save.record.revision);
      }
    } catch {
      break;
    }
  }

  const remaining = getPendingActivityEvents().length + getPendingGameSaves().length;
  return {
    available: true,
    eventsSynced,
    savesSynced,
    pending: remaining,
    message: remaining === 0 ? 'Données locales synchronisées.' : 'Certaines données restent en attente.'
  };
}

export function syncPendingOrbisData(): Promise<SyncReport> {
  if (activeSync) return activeSync;
  activeSync = performSync().finally(() => { activeSync = null; });
  return activeSync;
}

let onlineListenerInstalled = false;
export function installOrbisOnlineSync(): void {
  if (onlineListenerInstalled || typeof window === 'undefined') return;
  onlineListenerInstalled = true;
  window.addEventListener('online', () => { void syncPendingOrbisData(); });
}
