import { currentSession } from '$lib/orbis/auth/client';
import { getSupabasePublicConfig } from '$lib/orbis/persistence/supabase-rest';
import type { CvFields, LetterFields } from '$lib/games/pcp/types';

export type PcpDocumentKind = 'cv' | 'letter';
export type RemotePcpDocument = { document_kind: PcpDocumentKind; content: Record<string, string>; updated_at: string };

function context() {
  const config = getSupabasePublicConfig();
  const session = currentSession();
  if (!config || !session) return null;
  return { config, session, headers: { apikey: config.publicKey, authorization: `Bearer ${session.accessToken}`, 'content-type': 'application/json' } };
}

export async function loadPcpDocuments(): Promise<Partial<Record<PcpDocumentKind, Record<string, string>>>> {
  const ctx = context();
  if (!ctx) return {};
  const response = await fetch(`${ctx.config.url}/rest/v1/student_documents?student_id=eq.${encodeURIComponent(ctx.session.userId)}&select=document_kind,content`, { headers: ctx.headers });
  if (!response.ok) return {};
  const rows = await response.json() as RemotePcpDocument[];
  return Object.fromEntries(rows.map((row) => [row.document_kind, row.content]));
}

export async function savePcpDocument(kind: PcpDocumentKind, content: Partial<CvFields> | Partial<LetterFields>): Promise<boolean> {
  const ctx = context();
  if (!ctx) return false;
  const response = await fetch(`${ctx.config.url}/rest/v1/student_documents?on_conflict=student_id,document_kind`, {
    method: 'POST',
    headers: { ...ctx.headers, prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ student_id: ctx.session.userId, document_kind: kind, content })
  });
  return response.ok;
}
