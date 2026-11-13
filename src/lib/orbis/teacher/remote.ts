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
  const context = getHeaders();
  if (!context || classes.length === 0) return [];
  const output: OrbisStudent[] = [];
  for (const classroom of classes) {
    const membershipResponse = await fetch(`${context.config.url}/rest/v1/class_memberships?class_id=eq.${encodeURIComponent(classroom.id)}&select=student_id`, { headers: context.headers });
    if (!membershipResponse.ok) throw new Error(`memberships-${membershipResponse.status}`);
    const memberships = await membershipResponse.json() as Array<{ student_id: string }>;
    for (const membership of memberships) {
      const profileResponse = await fetch(`${context.config.url}/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(membership.student_id)}&select=user_id,login_id,display_name&limit=1`, { headers: context.headers });
      if (!profileResponse.ok) throw new Error(`student-profile-${profileResponse.status}`);
      const profiles = await profileResponse.json() as Array<Omit<OrbisStudent, 'class_id'>>;
      if (profiles[0]) output.push({ ...profiles[0], class_id: classroom.id });
    }
  }
  return output;
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

export async function listRemoteActivityEvents(): Promise<RemoteActivityEvent[]> {
  const context = getHeaders();
  if (!context) return [];
  const response = await fetch(`${context.config.url}/rest/v1/activity_events?select=event_id,student_id,game_id,activity_id,skill_id,correct_count,question_count,error_count,error_families,hints_used,duration_seconds,response_details,occurred_at&order=occurred_at.desc&limit=500`, { headers: context.headers });
  if (!response.ok) throw new Error(`activities-${response.status}`);
  return await response.json() as RemoteActivityEvent[];
}

export async function listTeacherStudentDocuments(): Promise<RemoteStudentDocument[]> {
  const context = getHeaders();
  if (!context) return [];
  const response = await fetch(`${context.config.url}/rest/v1/student_documents?select=student_id,document_kind,content,updated_at&order=updated_at.desc&limit=500`, { headers: context.headers });
  if (!response.ok) throw new Error(`documents-${response.status}`);
  return await response.json() as RemoteStudentDocument[];
}

export async function listRemoteGameSaves(): Promise<RemoteGameSave[]> {
  const context = getHeaders();
  if (!context) return [];
  const response = await fetch(`${context.config.url}/rest/v1/game_saves?select=student_id,game_id,revision,updated_at&order=updated_at.desc&limit=500`, { headers: context.headers });
  if (!response.ok) throw new Error(`saves-${response.status}`);
  return await response.json() as RemoteGameSave[];
}
