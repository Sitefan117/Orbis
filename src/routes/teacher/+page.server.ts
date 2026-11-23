import { fail } from '@sveltejs/kit';
import {
  createTeacherSession,
  destroyTeacherSession,
  getTeacherSession,
  TEACHER_SESSION_COOKIE,
  TEACHER_SESSION_MAX_AGE_SECONDS
} from '$lib/server/teacher-auth';
import type { Actions, PageServerLoad } from './$types';
import { getTeacherDashboardData, type TeacherDashboardData } from '$lib/server/activity-results';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: TEACHER_SESSION_MAX_AGE_SECONDS
};

export const load: PageServerLoad = ({ cookies }) => {
  const authenticated = Boolean(getTeacherSession(cookies.get(TEACHER_SESSION_COOKIE)));
  return {
    authenticated,
    dashboard: authenticated ? (getTeacherDashboardData() as TeacherDashboardData) : null
  };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const password = String(formData.get('password') ?? '');
    const result = createTeacherSession(password);

    if (!result.ok) {
      return fail(401, {
        success: false,
        message:
          result.reason === 'missing_configuration'
            ? 'La connexion enseignant n’est pas configurée sur ce serveur.'
            : 'Mot de passe incorrect.'
      });
    }

    cookies.set(TEACHER_SESSION_COOKIE, result.sessionId, {
      ...cookieOptions,
      expires: new Date(result.expiresAt)
    });

    return { success: true };
  },

  logout: async ({ cookies }) => {
    const sessionId = cookies.get(TEACHER_SESSION_COOKIE);
    destroyTeacherSession(sessionId);
    cookies.delete(TEACHER_SESSION_COOKIE, { path: '/' });
    return { success: true };
  }
};
