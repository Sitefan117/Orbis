/** Vérifie les accès et gère la durée de vie des sessions enseignant côté serveur. */
import { eq, lt } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { getDb } from './db/client';
import { teacherSessions, type TeacherSession } from './db/schema';
import { safeEqualText, verifyPasswordHash } from './auth/password-hash';

export const TEACHER_SESSION_COOKIE = 'classroom_teacher_session';
export const TEACHER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SESSION_MAX_AGE_MS = TEACHER_SESSION_MAX_AGE_SECONDS * 1000;

export type TeacherLoginResult =
  | { ok: true; sessionId: string; expiresAt: number }
  | { ok: false; reason: 'missing_configuration' | 'invalid_password' };

// Préfère l’empreinte, tout en gardant l’ancien secret de configuration compatible.
function verifyConfiguredTeacherPassword(password: string): TeacherLoginResult | null {
  const hash = process.env.TEACHER_PASSWORD_HASH;
  if (hash) {
    return verifyPasswordHash(password, hash) ? null : { ok: false, reason: 'invalid_password' };
  }

  const plainSecret = process.env.TEACHER_PASSWORD;
  if (plainSecret) {
    return safeEqualText(password, plainSecret) ? null : { ok: false, reason: 'invalid_password' };
  }

  return { ok: false, reason: 'missing_configuration' };
}

// Crée une session aléatoire de huit heures uniquement après validation du secret.
export function createTeacherSession(password: string): TeacherLoginResult {
  const failed = verifyConfiguredTeacherPassword(password);
  if (failed) return failed;

  const now = Date.now();
  const sessionId = randomBytes(32).toString('base64url');
  const expiresAt = now + SESSION_MAX_AGE_MS;

  getDb()
    .insert(teacherSessions)
    .values({ id: sessionId, createdAt: now, expiresAt, lastSeenAt: now })
    .run();

  return { ok: true, sessionId, expiresAt };
}

export function getTeacherSession(sessionId: string | undefined): TeacherSession | null {
  if (!sessionId) return null;

  const now = Date.now();
  const db = getDb();
  db.delete(teacherSessions).where(lt(teacherSessions.expiresAt, now)).run();

  const session = db
    .select()
    .from(teacherSessions)
    .where(eq(teacherSessions.id, sessionId))
    .get();

  if (!session || session.expiresAt < now) return null;

  db.update(teacherSessions)
    .set({ lastSeenAt: now })
    .where(eq(teacherSessions.id, session.id))
    .run();

  return session;
}

export function destroyTeacherSession(sessionId: string | undefined): void {
  if (!sessionId) return;
  getDb().delete(teacherSessions).where(eq(teacherSessions.id, sessionId)).run();
}
