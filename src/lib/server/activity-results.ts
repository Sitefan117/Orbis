/** Services serveur de suivi : relie un nom local aux résultats et au tableau enseignant. */
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './db/client';
import { activityResults, students, teacherNotes, worldProgress } from './db/schema';

export type ScoreBasis = 'last' | 'best';

export type ActivityResultInput = {
  studentName: string;
  world: string;
  mission: string;
  score: number;
  total: number;
  scoreBasis?: ScoreBasis;
  errorCount?: number;
  errorFamilies?: Array<string | object>;
  metadata?: Record<string, unknown>;
};

export type TeacherDashboardData = {
  students: Array<{
    id: number;
    displayName: string;
    lastSeenAt: number;
  }>;
  results: Array<{
    id: number;
    studentId: number;
    studentName: string;
    world: string;
    mission: string;
    score: number;
    total: number;
    scoreBasis: string;
    errorCount: number;
    errorFamilies: string | null;
    createdAt: number;
  }>;
  progress: Array<{
    id: number;
    studentId: number;
    studentName: string;
    world: string;
    mission: string;
    bestScore: number;
    lastScore: number;
    total: number;
    completions: number;
    updatedAt: number;
  }>;
  notes: Array<{
    id: number;
    studentName: string | null;
    world: string | null;
    body: string;
    createdAt: number;
  }>;
};

// Normalise le prénom pour retrouver le même profil malgré les accents ou espaces.
export function normalizeStudentName(name: string): string {
  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9-]+/g, '-');

  return normalized.replace(/^-+|-+$/g, '') || 'anonyme';
}

function serializeUnknown(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

function clampScore(value: number, min = 0): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.round(value));
}

// Enregistre l’élève, l’événement de résultat et le résumé de progression de la mission.
export function recordActivityResult(input: ActivityResultInput) {
  const db = getDb();
  const now = Date.now();
  const displayName = input.studentName.trim().slice(0, 80) || 'Anonyme';
  const normalizedName = normalizeStudentName(displayName);
  const score = clampScore(input.score);
  const total = Math.max(1, clampScore(input.total, 1));
  const errorCount = Math.max(0, input.errorCount === undefined ? total - score : clampScore(input.errorCount));
  const world = input.world.trim().slice(0, 80);
  const mission = input.mission.trim().slice(0, 140);
  const scoreBasis = input.scoreBasis ?? 'last';

  const student = db
    .insert(students)
    .values({ displayName, normalizedName, createdAt: now, lastSeenAt: now })
    .onConflictDoUpdate({
      target: students.normalizedName,
      set: { displayName, lastSeenAt: now }
    })
    .returning()
    .get();

  const result = db
    .insert(activityResults)
    .values({
      studentId: student.id,
      world,
      mission,
      score,
      total,
      scoreBasis,
      errorCount,
      errorFamiliesJson: serializeUnknown(input.errorFamilies),
      metadataJson: serializeUnknown(input.metadata),
      createdAt: now
    })
    .returning()
    .get();

  const existingProgress = db
    .select()
    .from(worldProgress)
    .where(
      and(
        eq(worldProgress.studentId, student.id),
        eq(worldProgress.world, world),
        eq(worldProgress.mission, mission)
      )
    )
    .get();

  if (existingProgress) {
    db.update(worldProgress)
      .set({
        bestScore: Math.max(existingProgress.bestScore, score),
        lastScore: score,
        total,
        completions: existingProgress.completions + 1,
        updatedAt: now
      })
      .where(eq(worldProgress.id, existingProgress.id))
      .run();
  } else {
    db.insert(worldProgress)
      .values({
        studentId: student.id,
        world,
        mission,
        bestScore: score,
        lastScore: score,
        total,
        completions: 1,
        updatedAt: now
      })
      .run();
  }

  return { result, student };
}

// Prépare une vue bornée aux informations utiles au tableau enseignant.
export function getTeacherDashboardData(): TeacherDashboardData {
  const db = getDb();

  const studentRows = db
    .select({ id: students.id, displayName: students.displayName, lastSeenAt: students.lastSeenAt })
    .from(students)
    .orderBy(desc(students.lastSeenAt))
    .all();

  const resultRows = db
    .select({
      id: activityResults.id,
      studentId: students.id,
      studentName: students.displayName,
      world: activityResults.world,
      mission: activityResults.mission,
      score: activityResults.score,
      total: activityResults.total,
      scoreBasis: activityResults.scoreBasis,
      errorCount: activityResults.errorCount,
      errorFamilies: activityResults.errorFamiliesJson,
      createdAt: activityResults.createdAt
    })
    .from(activityResults)
    .innerJoin(students, eq(activityResults.studentId, students.id))
    .orderBy(desc(activityResults.createdAt))
    .limit(250)
    .all();

  const progressRows = db
    .select({
      id: worldProgress.id,
      studentId: students.id,
      studentName: students.displayName,
      world: worldProgress.world,
      mission: worldProgress.mission,
      bestScore: worldProgress.bestScore,
      lastScore: worldProgress.lastScore,
      total: worldProgress.total,
      completions: worldProgress.completions,
      updatedAt: worldProgress.updatedAt
    })
    .from(worldProgress)
    .innerJoin(students, eq(worldProgress.studentId, students.id))
    .orderBy(desc(worldProgress.updatedAt))
    .all();

  const noteRows = db
    .select({
      id: teacherNotes.id,
      studentName: students.displayName,
      world: teacherNotes.world,
      body: teacherNotes.body,
      createdAt: teacherNotes.createdAt
    })
    .from(teacherNotes)
    .leftJoin(students, eq(teacherNotes.studentId, students.id))
    .orderBy(desc(teacherNotes.createdAt))
    .limit(80)
    .all();

  return {
    students: studentRows,
    results: resultRows,
    progress: progressRows,
    notes: noteRows
  };
}

// Ajoute une note courte, éventuellement rattachée à un élève et à un jeu.
export function addTeacherNote(input: { studentId?: number; world?: string; body: string }): void {
  const body = input.body.trim();
  if (!body) return;

  getDb()
    .insert(teacherNotes)
    .values({
      studentId: input.studentId,
      world: input.world?.trim() || null,
      body: body.slice(0, 1200),
      createdAt: Date.now()
    })
    .run();
}
