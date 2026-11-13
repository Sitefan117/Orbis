import { browser } from '$app/environment';
import { getSupabasePublicConfig } from '$lib/orbis/persistence/supabase-rest';
import { clearRemoteSession, getRemoteSession, storeRemoteSession, type OrbisRemoteSession } from '$lib/orbis/persistence/remote-session';

export type OrbisAuthResult =
  | { ok: true; session: OrbisRemoteSession; role: 'teacher' | 'student' }
  | { ok: false; message: string };

let refreshTimer: ReturnType<typeof setInterval> | null = null;

// Supabase Auth utilise une adresse e-mail comme identifiant technique.
// L'élève ne voit jamais cette adresse synthétique et n'a pas besoin d'e-mail.
export function internalAuthEmail(loginId: string): string {
  return `${loginId.trim().toLowerCase()}@orbis.local`;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { msg?: string; message?: string; error_description?: string };
    return body.error_description ?? body.msg ?? body.message ?? `Erreur Supabase (${response.status}).`;
  } catch {
    return `Erreur Supabase (${response.status}).`;
  }
}

/** Connexion destinée à l'écran élève ou enseignant. */
export async function signInWithShortId(loginId: string, password: string): Promise<OrbisAuthResult> {
  if (!browser) return { ok: false, message: 'La connexion est disponible dans le navigateur.' };
  const cleanId = loginId.trim();
  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(cleanId)) {
    return { ok: false, message: 'Identifiant invalide.' };
  }
  if (!password) return { ok: false, message: 'Mot de passe obligatoire.' };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: 'Supabase n’est pas configuré sur cet appareil.' };

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: config.publicKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email: internalAuthEmail(cleanId), password })
    });
    if (!response.ok) return { ok: false, message: await readError(response) };

    const data = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user?: { id: string };
    };
    if (!data.access_token || !data.user?.id) return { ok: false, message: 'Session Supabase incomplète.' };

    const session: OrbisRemoteSession = {
      accessToken: data.access_token,
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
      userId: data.user.id,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600)
    };
    storeRemoteSession(session);
    startSessionRefresh();

    const profileHeaders = { apikey: config.publicKey, authorization: `Bearer ${session.accessToken}` };
    const teacherResponse = await fetch(`${config.url}/rest/v1/teacher_accounts?user_id=eq.${encodeURIComponent(session.userId)}&select=user_id&limit=1`, { headers: profileHeaders });
    if (teacherResponse.ok && (await teacherResponse.json() as unknown[]).length > 0) {
      return { ok: true, session, role: 'teacher' };
    }
    const studentResponse = await fetch(`${config.url}/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(session.userId)}&select=user_id&limit=1`, { headers: profileHeaders });
    if (studentResponse.ok && (await studentResponse.json() as unknown[]).length > 0) {
      return { ok: true, session, role: 'student' };
    }
    clearRemoteSession();
    return { ok: false, message: 'Ce compte existe, mais son profil Orbis n’est pas encore configuré.' };
  } catch {
    return { ok: false, message: 'Connexion impossible. Les données locales restent disponibles.' };
  }
}

export function signOut(): void {
  stopSessionRefresh();
  clearRemoteSession();
}

/** Renouvelle discrètement le jeton avant son expiration, y compris après une mise en veille. */
export async function refreshRemoteSession(): Promise<OrbisRemoteSession | null> {
  if (!browser) return null;
  const current = getRemoteSession({ allowExpired: true });
  if (!current?.refreshToken) return current && !current.expiresAt ? current : null;
  const now = Math.floor(Date.now() / 1000);
  if (current.expiresAt && current.expiresAt > now + 300) return current;

  const config = getSupabasePublicConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: config.publicKey, 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refreshToken })
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 401) clearRemoteSession();
      return null;
    }
    const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; user?: { id?: string } };
    if (!data.access_token) return null;
    const renewed: OrbisRemoteSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
      userId: data.user?.id ?? current.userId,
      expiresAt: now + (data.expires_in ?? 3600)
    };
    storeRemoteSession(renewed);
    return renewed;
  } catch {
    return null;
  }
}

export function startSessionRefresh(): void {
  if (!browser || refreshTimer) return;
  refreshTimer = setInterval(() => { void refreshRemoteSession(); }, 60_000);
  void refreshRemoteSession();
}

function stopSessionRefresh(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
}

export function currentSession(): OrbisRemoteSession | null {
  return getRemoteSession();
}
