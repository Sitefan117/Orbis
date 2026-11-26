import { json, type RequestHandler } from '@sveltejs/kit';
import { getTeacherDashboardData } from '$lib/server/activity-results';
import { getTeacherSession, TEACHER_SESSION_COOKIE } from '$lib/server/teacher-auth';

export const prerender = false;

export const GET: RequestHandler = ({ cookies }) => {
  if (!getTeacherSession(cookies.get(TEACHER_SESSION_COOKIE))) {
    return json({ message: 'Authentification enseignant requise.' }, { status: 401 });
  }
  return json(getTeacherDashboardData());
};
