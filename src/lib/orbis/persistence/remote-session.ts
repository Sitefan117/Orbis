const SESSION_KEY = 'orbis:supabase-session:v1';

export type OrbisRemoteSession = {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  expiresAt?: number;
};

export function getRemoteSession(options: { allowExpired?: boolean } = {}): OrbisRemoteSession | null {
  const local = typeof localStorage !== 'undefined' ? localStorage : null;
  const sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  if (!local && !sessionStore) return null;
  try {
    const raw = local?.getItem(SESSION_KEY) ?? sessionStore?.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as OrbisRemoteSession;
    if (!session.accessToken || !session.userId) return null;
    if (!options.allowExpired && session.expiresAt && session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Utilisé par le futur écran de connexion ; le jeton reste limité à l’onglet. */
export function storeRemoteSession(session: OrbisRemoteSession): void {
  const serialized = JSON.stringify(session);
  if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, serialized);
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SESSION_KEY, serialized);
}

export function clearRemoteSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_KEY);
}
