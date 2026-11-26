import { json, type RequestHandler } from '@sveltejs/kit';
import { createLearningMission, listLearningMissions } from '$lib/server/learning-missions';
import { isMissionGame } from '$lib/missions/catalog';
import { getTeacherSession, TEACHER_SESSION_COOKIE } from '$lib/server/teacher-auth';

export const prerender = false;

function isTeacher(cookies: Parameters<RequestHandler>[0]['cookies']): boolean {
  return Boolean(getTeacherSession(cookies.get(TEACHER_SESSION_COOKIE)));
}

export const GET: RequestHandler = ({ cookies }) => {
  if (!isTeacher(cookies)) return json({ message: 'Authentification enseignant requise.' }, { status: 401 });
  return json({ missions: listLearningMissions() });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!isTeacher(cookies)) return json({ message: 'Authentification enseignant requise.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (body.scope !== 'portal' && body.scope !== 'game') {
    return json({ message: 'Type de code invalide.' }, { status: 400 });
  }
  if (!isMissionGame(body.game)) return json({ message: 'Jeu non pris en charge.' }, { status: 400 });
  try {
    const mission = createLearningMission({
      scope: body.scope,
      game: body.game,
      configuration: body.configuration
    });
    return json({ mission }, { status: 201 });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Création impossible.' }, { status: 400 });
  }
};
