import { json, type RequestHandler } from '@sveltejs/kit';
import { findActiveLearningMission } from '$lib/server/learning-missions';

export const prerender = false;

export const GET: RequestHandler = ({ params }) => {
  const mission = findActiveLearningMission(params.code ?? '');
  if (!mission) return json({ valid: false, message: 'Ce code est inconnu, expiré ou désactivé.' }, { status: 404 });
  return json({ valid: true, mission });
};
