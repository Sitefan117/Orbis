import type { ActivityPayload, ActivitySubmission } from './contract';
import { appendLocalActivityEvent, createLocalActivityEvent } from '$lib/orbis/persistence/local-store';
import { installOrbisOnlineSync, syncPendingOrbisData } from '$lib/orbis/persistence/sync';

/**
 * Enregistre d'abord le bilan dans le navigateur. Une synchronisation distante
 * est tentée ensuite si Supabase et une session élève sont disponibles.
 */
export async function submitActivityResult(payload: ActivityPayload): Promise<ActivitySubmission> {
  const event = createLocalActivityEvent(payload);
  if (!appendLocalActivityEvent(event)) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Le navigateur n’a pas pu conserver ce bilan.'
    };
  }
  installOrbisOnlineSync();
  const report = await syncPendingOrbisData();
  return {
    ok: true,
    eventId: event.eventId,
    synced: report.pending === 0 && report.available,
    message: report.pending === 0 && report.available
      ? 'Bilan enregistré et synchronisé.'
      : 'Bilan enregistré sur cet appareil. La synchronisation se fera lorsqu’un compte distant sera disponible.'
  };
}

export type { ActivityEvent, ActivityPayload, ActivitySubmission } from './contract';
