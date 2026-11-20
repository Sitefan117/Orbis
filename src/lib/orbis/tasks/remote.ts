import { getSupabasePublicConfig } from '$lib/orbis/persistence/supabase-rest';
import { currentSession } from '$lib/orbis/auth/client';

export type StudentTask = {
  id: string;
  class_id: string;
  student_id: string | null;
  title: string;
  body: string;
  target_game_id: string | null;
  due_at: string | null;
  active: boolean;
  created_at: string;
};

function context() {
  const config = getSupabasePublicConfig();
  const session = currentSession();
  if (!config || !session) return null;
  return { config, session, headers: { apikey: config.publicKey, authorization: `Bearer ${session.accessToken}`, 'content-type': 'application/json' } };
}

export async function listStudentTasks(): Promise<StudentTask[]> {
  const current = context();
  if (!current) return [];
  const response = await fetch(`${current.config.url}/rest/v1/student_tasks?select=id,class_id,student_id,title,body,target_game_id,due_at,active,created_at&active=eq.true&order=created_at.desc`, { headers: current.headers });
  if (!response.ok) throw new Error(`tasks-${response.status}`);
  return await response.json() as StudentTask[];
}

export async function listTeacherTasks(): Promise<StudentTask[]> {
  const current = context();
  if (!current) return [];
  const response = await fetch(`${current.config.url}/rest/v1/student_tasks?select=id,class_id,student_id,title,body,target_game_id,due_at,active,created_at&teacher_id=eq.${encodeURIComponent(current.session.userId)}&order=created_at.desc`, { headers: current.headers });
  if (!response.ok) throw new Error(`teacher-tasks-${response.status}`);
  return await response.json() as StudentTask[];
}

export async function createTeacherTask(input: { classId: string; studentIds?: string[]; title: string; body: string; targetGameId?: string; dueAt?: string }): Promise<StudentTask> {
  const current = context();
  if (!current) throw new Error('session-required');
  const studentIds = input.studentIds?.length ? input.studentIds : [null];
  const response = await fetch(`${current.config.url}/rest/v1/student_tasks`, {
    method: 'POST', headers: { ...current.headers, prefer: 'return=representation' },
    body: JSON.stringify(studentIds.map((studentId) => ({ teacher_id: current.session.userId, class_id: input.classId, student_id: studentId, title: input.title.trim(), body: input.body.trim(), target_game_id: input.targetGameId || null, due_at: input.dueAt || null })))
  });
  if (!response.ok) throw new Error(`task-create-${response.status}`);
  const rows = await response.json() as StudentTask[];
  if (!rows[0]) throw new Error('task-create-empty');
  return rows[0];
}

export async function archiveTeacherTask(taskId: string): Promise<void> {
  const current = context();
  if (!current) throw new Error('session-required');
  const response = await fetch(`${current.config.url}/rest/v1/student_tasks?id=eq.${encodeURIComponent(taskId)}`, {
    method: 'PATCH', headers: { ...current.headers, prefer: 'return=minimal' }, body: JSON.stringify({ active: false })
  });
  if (!response.ok) throw new Error(`task-archive-${response.status}`);
}
