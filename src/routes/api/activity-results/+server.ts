import { json, type RequestHandler } from '@sveltejs/kit';
import { recordActivityResult, type ActivityResultInput } from '$lib/server/activity-results';
import type { WorldId } from '$lib/worlds';

const allowedWorlds = new Set<WorldId>(['livrets', 'nexus', 'calculs', 'numeria', 'pcp', 'conju_lab']);

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value);
}

export const POST: RequestHandler = async ({ request }) => {
  const raw = (await request.json()) as Record<string, unknown>;

  const studentName = readString(raw.studentName);
  const world = readString(raw.world) as WorldId;
  const mission = readString(raw.mission);
  const score = readNumber(raw.score);
  const total = readNumber(raw.total);

  if (studentName.length < 2 || studentName.length > 80) {
    return new Response('Le prénom élève est obligatoire.', { status: 400 });
  }

  if (!allowedWorlds.has(world)) {
    return new Response('Monde inconnu.', { status: 400 });
  }

  if (
    !mission ||
    mission.length > 140 ||
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total <= 0 ||
    total > 10000 ||
    score < 0 ||
    score > total
  ) {
    return new Response('Rapport d’activité incomplet.', { status: 400 });
  }

  const metadata = raw.metadata;
  if (metadata !== undefined && JSON.stringify(metadata).length > 10000) {
    return new Response('Métadonnées trop volumineuses.', { status: 400 });
  }

  const input: ActivityResultInput = {
    studentName,
    world,
    mission,
    score,
    total,
    scoreBasis: raw.scoreBasis === 'best' ? 'best' : 'last',
    errorCount: raw.errorCount === undefined ? undefined : readNumber(raw.errorCount),
    errorFamilies: raw.errorFamilies,
    metadata
  };

  const { result, student } = recordActivityResult(input);
  return json({ ok: true, resultId: result.id, studentId: student.id });
};
