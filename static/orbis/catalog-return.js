/* Restore the course catalogue when returning from a standalone HTML document. */
(() => {
  const script = document.currentScript;
  if (!script?.src) return;

  // Tous les cours HTML partagent ce correctif d'impression. Une page sans
  // marge navigateur ne réserve plus d'espace aux en-têtes automatiques
  // (date, titre, URL). Le padding cloné redonne une marge propre au contenu
  // sur chaque feuille imprimée.
  const printStyle = document.createElement('style');
  printStyle.dataset.orbisPrintClean = 'true';
  printStyle.textContent = `
    @page { size: auto; margin: 0 !important; }
    @media print {
      html { margin: 0 !important; padding: 0 !important; }
      body {
        margin: 0 !important;
        padding: 10mm !important;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
      }
    }
  `;
  document.head.append(printStyle);

  const root = new URL('../', script.src);
  const fallback = new URL('?vue=cours', root);
  let destination = fallback;
  try {
    const saved = JSON.parse(sessionStorage.getItem('orbis-catalog-cours') || 'null');
    if (typeof saved?.href === 'string') {
      const candidate = new URL(saved.href, location.origin);
      if (candidate.origin === root.origin && candidate.pathname === root.pathname && candidate.searchParams.get('vue') === 'cours') destination = candidate;
    }
  } catch { /* The explicit fallback also works without browser storage. */ }
  const student = new URLSearchParams(location.search).get('eleve');
  if (student) destination.searchParams.set('eleve', student);
  document.querySelectorAll('a[data-orbis-catalog-return]').forEach((link) => {
    link.href = `${destination.pathname}${destination.search}`;
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      event.preventDefault();
      location.replace(link.href);
    });
  });

  // Suivi commun des cours HTML : les cours historiques partagent ce script.
  // Le contenu libre reste dans la sauvegarde de l'élève ; Supabase ne reçoit
  // que la progression, les champs remplis et des métadonnées pédagogiques.
  const SUPABASE_URL = 'https://tnoyoleonpnwjujktpdc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ZbvCrE0wm-FLqUCww-VvRg_gSMTTakX';
  const SESSION_KEY = 'orbis:supabase-session:v1';
  const slug = location.pathname.replace(/\/$/, '').split('/').filter(Boolean).slice(-1)[0] || 'course';
  const courseGameId = `course-${slug}`.slice(0, 80);
  const courseActivityId = `static-${slug}`.slice(0, 120);
  const session = (() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      const value = raw ? JSON.parse(raw) : null;
      return value?.accessToken && value?.userId ? value : null;
    } catch { return null; }
  })();
  let remoteRevision = 0;
  let saveTimer;
  const storageKey = `orbis:course-progress:${courseGameId}`;
  const questions = () => Array.from(document.querySelectorAll('[data-digital-exercise], .task, .checkrow'));
  const collectState = () => {
    const values = Array.from(document.querySelectorAll('input, textarea, select')).map((element, index) => ({
      index, value: element.value, checked: 'checked' in element ? Boolean(element.checked) : undefined
    }));
    const completed = questions().map((element, index) => ({ index, completed: element.dataset.completed === 'true' }));
    return { version: 1, path: location.pathname, scrollY: Math.round(window.scrollY), values, completed, updatedAt: new Date().toISOString() };
  };
  const applyState = (state) => {
    if (!state || typeof state !== 'object') return;
    for (const item of state.values || []) {
      const element = document.querySelectorAll('input, textarea, select')[item.index];
      if (!element) continue;
      element.value = item.value || '';
      if ('checked' in element && typeof item.checked === 'boolean') element.checked = item.checked;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    for (const item of state.completed || []) {
      const element = questions()[item.index];
      if (element && item.completed) element.dataset.completed = 'true';
    }
    if (Number.isFinite(state.scrollY)) window.scrollTo({ top: state.scrollY, behavior: 'instant' });
  };
  const localRestore = () => {
    try { applyState(JSON.parse(localStorage.getItem(storageKey) || 'null')); } catch { /* progression locale indisponible */ }
  };
  const headers = () => ({ apikey: SUPABASE_KEY, authorization: `Bearer ${session.accessToken}`, 'content-type': 'application/json' });
  const remoteRestore = async () => {
    if (!session) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?student_id=eq.${encodeURIComponent(session.userId)}&game_id=eq.${encodeURIComponent(courseGameId)}&select=state,revision&limit=1`, { headers: headers() });
      if (!response.ok) return;
      const row = (await response.json())[0];
      if (row) { remoteRevision = Number(row.revision) || 0; applyState(row.state); }
    } catch { /* le cours reste utilisable hors ligne */ }
  };
  const saveProgress = async () => {
    const state = collectState();
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* stockage local plein ou bloqué */ }
    if (!session) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/orbis_save_game_state`, {
        method: 'POST', headers: headers(), keepalive: true,
        body: JSON.stringify({ p_game_id: courseGameId, p_format_version: 1, p_state: state, p_expected_revision: remoteRevision, p_updated_at: state.updatedAt })
      });
      if (response.ok) remoteRevision = Number(await response.json()) || remoteRevision + 1;
    } catch { /* la prochaine ouverture resynchronisera la progression locale */ }
  };
  const sendCourseEvent = async () => {
    if (!session) return;
    const state = collectState();
    const items = questions();
    const completed = items.filter((item) => item.dataset.completed === 'true').length;
    const details = items.slice(0, 200).map((item, index) => ({ questionIndex: index, questionId: `${courseActivityId}-${index + 1}`, category: item.closest('[data-section]')?.getAttribute('data-section') || 'Cours', prompt: (item.querySelector('h3,h4,.question,.prompt')?.textContent || `Activité ${index + 1}`).trim().slice(0, 500), response: '', expected: '', correct: item.dataset.completed === 'true', attempts: 1 }));
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/activity_events`, { method: 'POST', keepalive: true, headers: { ...headers(), prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ event_id: crypto.randomUUID(), student_id: session.userId, game_id: courseGameId, activity_id: courseActivityId, skill_id: `course.${slug}`, correct_count: Math.max(0, completed), question_count: Math.max(1, items.length), error_count: 0, error_families: [], hints_used: null, duration_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)), response_details: details, metadata: { staticCourse: true, path: location.pathname, completionRate: items.length ? Math.round(completed / items.length * 100) : 0, valuesSaved: state.values.length }, activity_kind: 'course', session_id: crypto.randomUUID(), occurred_at: new Date().toISOString() }))
    } catch { /* un bilan manqué ne doit pas bloquer la sortie du cours */ }
  };
  const startedAt = Date.now();
  const initializeCourseTracking = () => {
    localRestore();
    void remoteRestore();
    document.addEventListener('input', () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => void saveProgress(), 1200); });
    document.addEventListener('change', () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => void saveProgress(), 1200); });
    window.addEventListener('pagehide', () => { void saveProgress(); void sendCourseEvent(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCourseTracking, { once: true });
  else initializeCourseTracking();
})();
