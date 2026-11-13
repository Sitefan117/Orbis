-- Traces structurées des réponses et brouillons PCP.
-- Les réponses libres PCP restent dans une table séparée, accessible uniquement
-- à l'élève concerné et à l'enseignant de sa classe.

alter table public.activity_events
  add column if not exists response_details jsonb not null default '[]'::jsonb;

alter table public.activity_events
  add constraint activity_events_response_details_object
  check (jsonb_typeof(response_details) = 'array'
    and octet_length(response_details::text) <= 100000);

create table if not exists public.student_documents (
  student_id uuid not null references public.student_profiles (user_id) on delete cascade,
  document_kind text not null check (document_kind in ('cv', 'letter')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (student_id, document_kind),
  constraint student_documents_size check (octet_length(content::text) <= 100000)
);

alter table public.student_documents enable row level security;

create policy student_documents_read_self_or_teacher on public.student_documents
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.orbis_teacher_can_view_student(student_id))
  );

create policy student_documents_student_insert on public.student_documents
  for insert to authenticated
  with check (student_id = (select auth.uid()));

create policy student_documents_student_update on public.student_documents
  for update to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

grant select, insert, update on public.student_documents to authenticated;
