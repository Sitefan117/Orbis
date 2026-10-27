const SESSION_KEY = 'orbis:supabase-session:v1';

export type OrbisRemoteSession = {
  accessToken: string;
  userId: string;
  expiresAt?: number;
};

export function getRemoteSession(): OrbisRemoteSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as OrbisRemoteSession;
    if (!session.accessToken || !session.userId) return null;
    if (session.expiresAt && session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Utilisé par le futur écran de connexion ; le jeton reste limité à l’onglet. */
export function storeRemoteSession(session: OrbisRemoteSession): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearRemoteSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}
