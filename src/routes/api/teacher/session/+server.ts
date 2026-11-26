import { json, type RequestHandler } from '@sveltejs/kit';
import {
  createTeacherSession,
  destroyTeacherSession,
  getTeacherSession,
  TEACHER_SESSION_COOKIE,
  TEACHER_SESSION_MAX_AGE_SECONDS
} from '$lib/server/teacher-auth';

export const prerender = false;

export const GET: RequestHandler = ({ cookies }) => {
  const session = getTeacherSession(cookies.get(TEACHER_SESSION_COOKIE));
  return json({ authenticated: Boolean(session), expiresAt: session?.expiresAt ?? null });
};

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const result = createTeacherSession(typeof body.password === 'string' ? body.password : '');
  if (!result.ok) {
    const message = result.reason === 'missing_configuration'
      ? 'Aucun mot de passe enseignant n’est configuré sur le serveur.'
      : 'Mot de passe incorrect.';
    return json({ authenticated: false, message }, { status: result.reason === 'missing_configuration' ? 503 : 401 });
  }

  cookies.set(TEACHER_SESSION_COOKIE, result.sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: TEACHER_SESSION_MAX_AGE_SECONDS
  });
  return json({ authenticated: true, expiresAt: result.expiresAt });
};

export const DELETE: RequestHandler = ({ cookies }) => {
  destroyTeacherSession(cookies.get(TEACHER_SESSION_COOKIE));
  cookies.delete(TEACHER_SESSION_COOKIE, { path: '/' });
  return json({ authenticated: false });
};
