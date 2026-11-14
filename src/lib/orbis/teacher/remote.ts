import { getSupabasePublicConfig } from '$lib/orbis/persistence/supabase-rest';
import { currentSession } from '$lib/orbis/auth/client';

export type OrbisClass = { id: string; name: string; created_at: string };
export type OrbisStudent = { user_id: string; login_id: string; display_name: string; class_id: string };
export type RemoteActivityEvent = {
  event_id: string;
  student_id: string;
  game_id: string;
  activity_id: string;
  skill_id: string | null;
  correct_count: number;
  question_count: number;
  error_count: number;
  error_families: string[];
  hints_used: number | null;
  duration_seconds: number | null;
  response_details: Array<{ questionIndex: number; prompt?: string; response?: string; expected?: string; correct: boolean; attempts?: number; hintsUsed?: number; errorFamily?: string }>;
  occurred_at: string;
};
export type RemoteStudentDocument = { student_id: string; document_kind: 'cv' | 'letter'; content: Record<string, string>; updated_at: string };
export type RemoteGameSave = {
  student_id: string;
  game_id: string;
  revision: number;
  updated_at: string;
};

export type StudentDataExport = {
  format: 'orbis-student-export-v1';
  exportedAt: string;
  profile: Record<string, unknown> | null;
  memberships: unknown[];
  saves: unknown[];
  activities: unknown[];
  documents: unknown[];
};

function getHeaders() {
  const config = getSupabasePublicConfig();
  const session = currentSession();
  if (!config || !session) return null;
  return { config, session, headers: {
    apikey: config.publicKey,
    authorization: `Bearer ${session.accessToken}`,
    'content-type': 'application/json'
  } };
}

async function fetchAllRows<T>(path: string, errorPrefix: string): Promise<T[]> {
  const context = getHeaders();
  if (!context) return [];
  const pageSize = 500;
  const rows: T[] = [];
  for (let offset = 0; offset < 50_000; offset += pageSize) {
    const response = await fetch(`${context.config.url}/rest/v1/${path}`, {
      headers: { ...context.headers, Range: `${offset}-${offset + pageSize - 1}` }
    });
    if (!response.ok) throw new Error(`${errorPrefix}-${response.status}`);
    const page = await response.json() as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
  throw new Error(`${errorPrefix}-too-many-rows`);
}

export async function listTeacherClasses(): Promise<OrbisClass[]> {
  const context = getHeaders();
  if (!context) return [];
  const response = await fetch(`${context.config.url}/rest/v1/classes?select=id,name,created_at&order=created_at.asc`, { headers: context.headers });
  if (!response.ok) throw new Error(`classes-${response.status}`);
  return await response.json() as OrbisClass[];
}

export async function createTeacherClass(name: string): Promise<OrbisClass> {
  const context = getHeaders();
  if (!context) throw new Error('session-required');
  const response = await fetch(`${context.config.url}/rest/v1/classes`, {
    method: 'POST',
    headers: { ...context.headers, prefer: 'return=representation' },
    body: JSON.stringify({ teacher_id: context.session.userId, name: name.trim() })
  });
  if (!response.ok) throw new Error(`class-create-${response.status}`);
  const rows = await response.json() as OrbisClass[];
  if (!rows[0]) throw new Error('class-create-empty');
  return rows[0];
}

export async function createStudent(input: { loginId: string; displayName: string; password: string; classId: string }): Promise<{ studentId: string }> {
  const context = getHeaders();
  if (!context) throw new Error('session-required');
  const response = await fetch(`${context.config.url}/functions/v1/orbis-admin`, {
    method: 'POST',
    headers: context.headers,
    body: JSON.stringify({ action: 'create_student', ...input })
  });
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json() as { error?: string; message?: string };
      detail = body.error ?? body.message ?? detail;
    } catch { /* réponse non JSON */ }
    throw new Error(detail);
  }
  return await response.json() as { studentId: string };
}

export async function listTeacherStudents(classes: OrbisClass[]): Promise<OrbisStudent[]> {
  if (classes.length === 0) return [];
  const [memberships, profiles] = await Promise.all([
    fetchAllRows<Array<{ class_id: string; student_id: string }>[number]>('class_memberships?select=class_id,student_id&order=created_at.asc', 'memberships'),
    fetchAllRows<Array<Omit<OrbisStudent, 'class_id'>>[number]>('student_profiles?select=user_id,login_id,display_name&order=created_at.asc', 'student-profiles')
  ]);
  const allowedClasses = new Set(classes.map((item) => item.id));
  const profileById = new Map(profiles.map((profile) => [profile.user_id, profile]));
  return memberships.flatMap((membership) => {
    const profile = profileById.get(membership.student_id);
    return allowedClasses.has(membership.class_id) && profile ? [{ ...profile, class_id: membership.class_id }] : [];
  });
}

export async function resetStudentPassword(studentId: string, password: string): Promise<void> {
  const context = getHeaders();
  if (!context) throw new Error('session-required');
  const response = await fetch(`${context.config.url}/functions/v1/orbis-admin`, {
    method: 'POST', headers: context.headers,
    body: JSON.stringify({ action: 'reset_student_password', studentId, password })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
}

export async function copyStudentSave(sourceStudentId: string, targetStudentId: string, gameId: string): Promise<void> {
  const context = getHeaders();
  if (!context) throw new Error('session-required');
  const response = await fetch(`${context.config.url}/functions/v1/orbis-admin`, {
    method: 'POST', headers: context.headers,
    body: JSON.stringify({ action: 'copy_student_save', sourceStudentId, targetStudentId, gameId })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
}

async function callStudentAdmin(action: 'export_student_data' | 'delete_student', studentId: string): Promise<Response> {
  const context = getHeaders();
  if (!context) throw new Error('session-required');
  const response = await fetch(`${context.config.url}/functions/v1/orbis-admin`, {
    method: 'POST', headers: context.headers, body: JSON.stringify({ action, studentId })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  return response;
}

export async function exportStudentData(studentId: string): Promise<StudentDataExport> {
  return await (await callStudentAdmin('export_student_data', studentId)).json() as StudentDataExport;
}

export async function deleteStudent(studentId: string): Promise<void> {
  await callStudentAdmin('delete_student', studentId);
}

export async function listRemoteActivityEvents(): Promise<RemoteActivityEvent[]> {
  return fetchAllRows<RemoteActivityEvent>('activity_events?select=event_id,student_id,game_id,activity_id,skill_id,correct_count,question_count,error_count,error_families,hints_used,duration_seconds,response_details,occurred_at&order=occurred_at.desc', 'activities');
}

export async function listTeacherStudentDocuments(): Promise<RemoteStudentDocument[]> {
  return fetchAllRows<RemoteStudentDocument>('student_documents?select=student_id,document_kind,content,updated_at&order=updated_at.desc', 'documents');
}

export async function listRemoteGameSaves(): Promise<RemoteGameSave[]> {
  return fetchAllRows<RemoteGameSave>('game_saves?select=student_id,game_id,revision,updated_at&order=updated_at.desc', 'saves');
}
