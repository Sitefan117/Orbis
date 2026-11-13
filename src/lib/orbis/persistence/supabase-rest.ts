// GitHub Pages est un site statique : les variables doivent être injectées
// pendant le build. `$env/dynamic/public` reste vide une fois déployé sans
// serveur SvelteKit, alors que `$env/static/public` est remplacé par Vite.
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { ActivityEvent } from '$lib/orbis/results/contract';
import type { LocalSaveEnvelope } from './local-store';
import type { OrbisRemoteSession } from './remote-session';

export type SupabasePublicConfig = { url: string; publicKey: string };
export type RemoteGameSave<TState> = {
  formatVersion: number;
  state: TState;
  revision: number;
  updatedAt: string;
};

// Repli public pour le site statique : une URL Supabase et une clé
// `sb_publishable_` peuvent être exposées dans le navigateur par conception.
// Les variables GitHub restent prioritaires et permettent de changer de projet.
const fallbackPublicConfig: SupabasePublicConfig = {
  url: 'https://tnoyoleonpnwjujktpdc.supabase.co',
  publicKey: 'sb_publishable_ZbvCrE0wm-FLqUCww-VvRg_gSMTTakX'
};

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = (PUBLIC_SUPABASE_URL || fallbackPublicConfig.url).replace(/\/$/, '');
  const publicKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackPublicConfig.publicKey;
  return url && publicKey ? { url, publicKey } : null;
}

function headers(config: SupabasePublicConfig, session: OrbisRemoteSession, prefer?: string): HeadersInit {
  return {
    apikey: config.publicKey,
    authorization: `Bearer ${session.accessToken}`,
    'content-type': 'application/json',
    ...(prefer ? { prefer } : {})
  };
}

export async function uploadActivityEvent(
  event: ActivityEvent,
  config: SupabasePublicConfig,
  session: OrbisRemoteSession
): Promise<Response> {
  return fetch(`${config.url}/rest/v1/activity_events?on_conflict=event_id`, {
    method: 'POST',
    headers: headers(config, session, 'resolution=ignore-duplicates,return=minimal'),
    body: JSON.stringify({
      event_id: event.eventId,
      student_id: session.userId,
      game_id: event.gameId,
      activity_id: event.activityId,
      skill_id: event.skillId ?? null,
      correct_count: event.correctCount,
      question_count: event.questionCount,
      error_count: event.errorCount,
      error_families: event.errorFamilies,
      hints_used: event.hintsUsed ?? null,
      duration_seconds: event.durationSeconds ?? null,
      ...(event.responseDetails?.length ? { response_details: event.responseDetails } : {}),
      occurred_at: event.occurredAt
    })
  });
}

export async function uploadGameSave(
  save: LocalSaveEnvelope,
  config: SupabasePublicConfig,
  session: OrbisRemoteSession
): Promise<{ response: Response; remoteRevision?: number }> {
  const response = await fetch(`${config.url}/rest/v1/rpc/orbis_save_game_state`, {
    method: 'POST',
    headers: headers(config, session),
    body: JSON.stringify({
      p_game_id: save.gameId,
      p_format_version: save.record.formatVersion,
      p_state: save.record.state,
      p_expected_revision: save.remoteRevision ?? 0,
      p_updated_at: save.record.updatedAt
    })
  });
  if (!response.ok) return { response };
  const value = Number(await response.json());
  return { response, ...(Number.isInteger(value) && value > 0 ? { remoteRevision: value } : {}) };
}

export async function downloadGameSave<TState>(
  gameId: string,
  config: SupabasePublicConfig,
  session: OrbisRemoteSession
): Promise<RemoteGameSave<TState> | null> {
  const query = new URLSearchParams({
    student_id: `eq.${session.userId}`,
    game_id: `eq.${gameId}`,
    select: 'format_version,state,revision,updated_at',
    limit: '1'
  });
  const response = await fetch(`${config.url}/rest/v1/game_saves?${query}`, {
    headers: headers(config, session)
  });
  if (!response.ok) throw new Error(`remote-save-${response.status}`);
  const rows = await response.json() as Array<{
    format_version: number;
    state: TState;
    revision: number;
    updated_at: string;
  }>;
  const row = rows[0];
  return row ? {
    formatVersion: row.format_version,
    state: row.state,
    revision: row.revision,
    updatedAt: row.updated_at
  } : null;
}
