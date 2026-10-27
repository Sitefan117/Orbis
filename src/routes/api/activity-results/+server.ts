/** Route serveur qui filtre un bilan avant de le transmettre au stockage. */
import { json, type RequestHandler } from '@sveltejs/kit';
import { recordActivityResult, type ActivityResultInput } from '$lib/server/activity-results';
import type { WorldId } from '$lib/orbis/catalog/games';

const allowedWorlds = new Set<WorldId>(['livrets', 'geometrie', 'calculs', 'numeria', 'pcp', 'conju_lab']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value);
}

// Vérifie le format et les bornes des données avant tout accès à la base.
export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Corps JSON invalide.', { status: 400 });
  }
  if (!isRecord(body)) return new Response('Corps JSON invalide.', { status: 400 });
  const raw = body;

  const studentName = readString(raw.studentName);
  const world = readString(raw.world) as WorldId;
  const mission = readString(raw.mission);
  const score = readNumber(raw.score);
  const total = readNumber(raw.total);

  if (studentName.length < 2) {
    return new Response('Le prénom élève est obligatoire.', { status: 400 });
  }

  if (!allowedWorlds.has(world)) {
    return new Response('Monde inconnu.', { status: 400 });
  }

  if (!mission || !Number.isFinite(score) || score < 0 || !Number.isFinite(total) || total <= 0 || score > total) {
    return new Response('Rapport d’activité incomplet.', { status: 400 });
  }

  const errorCount = raw.errorCount === undefined ? undefined : readNumber(raw.errorCount);
  if (errorCount !== undefined && (!Number.isFinite(errorCount) || errorCount < 0)) {
    return new Response('Nombre d’erreurs invalide.', { status: 400 });
  }
  const errorFamilies = raw.errorFamilies;
  if (errorFamilies !== undefined && (!Array.isArray(errorFamilies)
    || errorFamilies.length > 30
    || !errorFamilies.every((value) => typeof value === 'string'
      ? value.length <= 80
      : isRecord(value)))) {
    return new Response('Familles d’erreurs invalides.', { status: 400 });
  }
  const metadata = raw.metadata;
  if (metadata !== undefined && !isRecord(metadata)) {
    return new Response('Métadonnées invalides.', { status: 400 });
  }

  // Seules les propriétés attendues sont transmises au service de stockage.
  const input: ActivityResultInput = {
    studentName,
    world,
    mission,
    score,
    total,
    scoreBasis: raw.scoreBasis === 'best' ? 'best' : 'last',
    errorCount,
    errorFamilies: errorFamilies as Array<string | object> | undefined,
    metadata: metadata as Record<string, unknown> | undefined
  };

  const { result, student } = recordActivityResult(input);
  return json({ ok: true, resultId: result.id, studentId: student.id });
};
