// Cette fonction tourne sur les serveurs Supabase, pas dans le navigateur.
// Elle sert de « coffre-fort » pour les opérations qui nécessitent la clé
// secrète Supabase. Cette clé ne doit jamais arriver dans GitHub Pages.
//
// Pour la mettre à jour : Supabase > Edge Functions > orbis-admin > Code >
// remplacer ce fichier > Deploy updates.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Le type liste toutes les commandes que le navigateur a le droit de demander.
// TypeScript nous aide à repérer une commande ou un champ mal orthographié.
type AdminAction =
  | { action: 'create_student'; loginId: string; displayName: string; password: string; classId: string }
  | { action: 'reset_student_password'; studentId: string; password: string }
  | { action: 'copy_student_save'; sourceStudentId: string; targetStudentId: string; gameId: string }
  | { action: 'export_student_data'; studentId: string }
  | { action: 'delete_student'; studentId: string };

// GitHub Pages et Supabase ont deux domaines différents. CORS autorise donc
// le navigateur à appeler cette fonction. La vraie sécurité vient ensuite de
// la session, du rôle enseignant et des règles RLS.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Petite fonction utilitaire : toutes les réponses ont le même format JSON
// et les mêmes en-têtes. Exemple : { ok: true } ou { error: 'teacher_required' }.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

// Ces deux fonctions refusent des entrées trop longues ou inattendues avant
// toute écriture dans Auth ou PostgreSQL. Le mot de passe n'est jamais logué.
function validLoginId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{3,40}$/.test(value);
}

function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 10 && value.length <= 200;
}

// Supabase injecte ces variables secrètes au démarrage de l'Edge Function.
// SUPABASE_URL indique le projet ; la clé secrète autorise les opérations
// administratives comme créer ou supprimer un compte Auth.
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// Supabase's current secret-key variable is plural; keep the legacy fallback
// so the function also works during the platform's key migration.
const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
const serviceRoleKey = secretKeys
  ? (JSON.parse(secretKeys) as Record<string, string>).default
  : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase admin secret is not configured.');
const authClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
// Separate client so validating the caller's token cannot replace the
// privileged Authorization header used for database administration.

// Vérifie qu'un élève appartient à une classe de l'enseignant connecté.
// La requête contient la clé serveur, mais aussi le Bearer de l'enseignant :
// les politiques RLS restent donc la source de vérité pour cette relation.
async function teacherCanViewStudent(accessToken: string, studentId: string): Promise<boolean> {
  // Cette lecture passe volontairement avec le jeton enseignant : la politique
  // RLS student_profiles_read_self_or_teacher constitue la source de vérité.
  const response = await fetch(
    `${supabaseUrl}/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(studentId)}&select=user_id&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ user_id: string }>;
  return rows.length === 1;
}

// PostgREST peut limiter une réponse. Cette boucle récupère les données par
// paquets de 500 afin qu'un export ancien ne soit pas tronqué silencieusement.
async function teacherRows(accessToken: string, path: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  const pageSize = 500;
  for (let from = 0; from < 50_000; from += pageSize) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${accessToken}`,
        Range: `${from}-${from + pageSize - 1}`
      }
    });
    if (!response.ok) throw new Error(`student_export_failed_${response.status}`);
    const page = await response.json() as unknown[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
  throw new Error('student_export_too_large');
}

// Point d'entrée HTTP : chaque clic du tableau enseignant arrive ici.
// L'ordre est volontaire : méthode HTTP, session, rôle enseignant, action,
// validation des paramètres, puis opération demandée.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const bearer = request.headers.get('Authorization');
  if (!bearer?.startsWith('Bearer ')) return json({ error: 'missing_session' }, 401);
  const accessToken = bearer.slice('Bearer '.length);
  const { data: actorData, error: actorError } = await authClient.auth.getUser(accessToken);
  if (actorError || !actorData.user) return json({ error: 'invalid_session' }, 401);

  // Vérification directe avec la clé secrète : elle doit contourner les RLS
  // pour l'opération d'administration, sans exposer cette clé au navigateur.
  const teacherResponse = await fetch(
    `${supabaseUrl}/rest/v1/teacher_accounts?user_id=eq.${encodeURIComponent(actorData.user.id)}&select=user_id&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}` } }
  );
  if (!teacherResponse.ok) {
    const detail = (await teacherResponse.text()).slice(0, 240);
    return json({ error: `teacher_lookup_failed_${teacherResponse.status}`, detail }, 500);
  }
  const teachers = await teacherResponse.json() as Array<{ user_id: string }>;
  if (teachers.length === 0) return json({ error: 'teacher_required' }, 403);

  let body: AdminAction;
  try { body = await request.json() as AdminAction; } catch { return json({ error: 'invalid_json' }, 400); }

  if (body.action === 'create_student') {
    // 1) Vérifier le format, puis la classe possédée par l'enseignant.
    // 2) Créer uniquement le compte Auth côté serveur.
    // 3) Appeler la fonction SQL qui crée le profil et l'inscription.
    // Si l'étape 3 échoue, on supprime le compte Auth créé pour éviter
    // un compte « orphelin » sans profil Orbis.
    if (!validLoginId(body.loginId) || typeof body.displayName !== 'string' || body.displayName.trim().length < 1
      || !validPassword(body.password) || !/^[0-9a-f-]{36}$/.test(body.classId)) {
      return json({ error: 'invalid_student_payload' }, 400);
    }
    const classResponse = await fetch(
      `${supabaseUrl}/rest/v1/classes?id=eq.${encodeURIComponent(body.classId)}&teacher_id=eq.${encodeURIComponent(actorData.user.id)}&select=id&limit=1`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}` } }
    );
    if (!classResponse.ok) return json({ error: `class_lookup_failed_${classResponse.status}` }, 500);
    const ownedClasses = await classResponse.json() as Array<{ id: string }>;
    if (ownedClasses.length === 0) return json({ error: 'class_not_owned' }, 403);

    const { data: created, error: createError } = await authClient.auth.admin.createUser({
      email: `${body.loginId.toLowerCase()}@orbis.local`, password: body.password, email_confirm: true
    });
    if (createError || !created.user) return json({ error: createError?.message ?? 'user_creation_failed' }, 400);

    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/orbis_admin_add_student`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        p_student_id: created.user.id,
        p_login_id: body.loginId,
        p_display_name: body.displayName.trim(),
        p_class_id: body.classId
      })
    });
    if (!rpcResponse.ok) {
      const detail = (await rpcResponse.text()).slice(0, 240);
      await authClient.auth.admin.deleteUser(created.user.id);
      return json({ error: `student_profile_create_failed_${rpcResponse.status}`, detail }, 400);
    }
    return json({ ok: true, studentId: created.user.id });
  }

  if (body.action === 'reset_student_password') {
    // Le navigateur ne possède jamais de clé administrateur. Il transmet
    // seulement la session de l'enseignant ; cette fonction vérifie ensuite
    // que l'élève appartient bien à l'une de ses classes.
    if (!/^[0-9a-f-]{36}$/.test(body.studentId) || !validPassword(body.password)) return json({ error: 'invalid_reset_payload' }, 400);
    if (!await teacherCanViewStudent(accessToken, body.studentId)) return json({ error: 'student_not_in_teacher_class' }, 403);
    const { error } = await authClient.auth.admin.updateUserById(body.studentId, { password: body.password });
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  if (body.action === 'copy_student_save') {
    // Même principe pour une sauvegarde : les deux élèves doivent être
    // visibles par le même enseignant avant que la fonction SQL copie l'état.
    const validUuid = (value: string) => /^[0-9a-f-]{36}$/.test(value);
    if (!validUuid(body.sourceStudentId) || !validUuid(body.targetStudentId)
      || typeof body.gameId !== 'string' || body.gameId.length < 1 || body.gameId.length > 80
      || body.sourceStudentId === body.targetStudentId) return json({ error: 'invalid_copy_payload' }, 400);
    if (!await teacherCanViewStudent(accessToken, body.sourceStudentId)
      || !await teacherCanViewStudent(accessToken, body.targetStudentId)) return json({ error: 'student_not_in_teacher_class' }, 403);

    const copyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/orbis_admin_copy_student_save`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        p_source_student_id: body.sourceStudentId,
        p_target_student_id: body.targetStudentId,
        p_game_id: body.gameId
      })
    });
    if (!copyResponse.ok) {
      const detail = (await copyResponse.json().catch(() => ({}))) as { message?: string };
      return json({ error: detail.message ?? `copy_failed_${copyResponse.status}` }, copyResponse.status === 404 ? 404 : 400);
    }
    return json({ ok: true });
  }

  if (body.action === 'export_student_data') {
    // L'export rassemble les données applicatives, mais ne renvoie jamais
    // les mots de passe Auth. Les lectures sont paginées dans teacherRows().
    if (!/^[0-9a-f-]{36}$/.test(body.studentId)) return json({ error: 'invalid_student_id' }, 400);
    if (!await teacherCanViewStudent(accessToken, body.studentId)) return json({ error: 'student_not_in_teacher_class' }, 403);
    const studentFilter = encodeURIComponent(body.studentId);
    try {
      const [profile, memberships, saves, activities, documents] = await Promise.all([
        teacherRows(accessToken, `student_profiles?user_id=eq.${studentFilter}&select=user_id,login_id,display_name,created_at`),
        teacherRows(accessToken, `class_memberships?student_id=eq.${studentFilter}&select=class_id,created_at`),
        teacherRows(accessToken, `game_saves?student_id=eq.${studentFilter}&select=game_id,format_version,state,revision,updated_at&order=updated_at.asc`),
        teacherRows(accessToken, `activity_events?student_id=eq.${studentFilter}&select=event_id,game_id,activity_id,skill_id,correct_count,question_count,error_count,error_families,hints_used,duration_seconds,response_details,occurred_at,created_at&order=occurred_at.asc`),
        teacherRows(accessToken, `student_documents?student_id=eq.${studentFilter}&select=document_kind,content,updated_at&order=updated_at.asc`)
      ]);
      return json({ format: 'orbis-student-export-v1', exportedAt: new Date().toISOString(), profile: profile[0] ?? null, memberships, saves, activities, documents });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'student_export_failed' }, 500);
    }
  }

  if (body.action === 'delete_student') {
    // Suppression volontairement irréversible : Auth supprime l'utilisateur,
    // puis les relations « on delete cascade » suppriment ses données Orbis.
    if (!/^[0-9a-f-]{36}$/.test(body.studentId)) return json({ error: 'invalid_student_id' }, 400);
    if (!await teacherCanViewStudent(accessToken, body.studentId)) return json({ error: 'student_not_in_teacher_class' }, 403);
    const { error } = await authClient.auth.admin.deleteUser(body.studentId);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
