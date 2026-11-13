<script lang="ts">
  import { copyStudentSave, listRemoteActivityEvents, listRemoteGameSaves, type OrbisClass, type OrbisStudent, type RemoteActivityEvent, type RemoteGameSave } from './remote';

  let { classes, students, documents = [] }: { classes: OrbisClass[]; students: OrbisStudent[]; documents?: Array<{ student_id: string; document_kind: 'cv' | 'letter'; content: Record<string, string>; updated_at: string }> } = $props();
  let activities = $state<RemoteActivityEvent[]>([]);
  let saves = $state<RemoteGameSave[]>([]);
  let loading = $state(false);
  let initialized = $state(false);
  let message = $state('');
  let selectedClass = $state('all');
  let selectedGame = $state('all');
  let selectedPeriod = $state('30');
  let selectedStudentId = $state('all');
  let transferTargetId = $state('');
  let transferBusy = $state(false);
  let transferMessage = $state('');
  let pendingTransferGameId = $state('');

  const visibleStudents = $derived(selectedClass === 'all' ? students : students.filter((item) => item.class_id === selectedClass));
  const visibleStudentIds = $derived(new Set(visibleStudents.map((item) => item.user_id)));
  const filteredActivities = $derived(activities.filter((item) => {
    if (!visibleStudentIds.has(item.student_id)) return false;
    if (selectedStudentId !== 'all' && item.student_id !== selectedStudentId) return false;
    if (selectedGame !== 'all' && item.game_id !== selectedGame) return false;
    if (selectedPeriod === 'all') return true;
    return new Date(item.occurred_at).getTime() >= Date.now() - Number(selectedPeriod) * 86_400_000;
  }));
  const availableGames = $derived([...new Set(activities.map((item) => item.game_id))].sort());
  const visibleSaves = $derived(saves.filter((item) => visibleStudentIds.has(item.student_id)
    && (selectedStudentId === 'all' || item.student_id === selectedStudentId)
    && (selectedGame === 'all' || item.game_id === selectedGame)));
  const totalQuestions = $derived(filteredActivities.reduce((sum, item) => sum + item.question_count, 0));
  const totalCorrect = $derived(filteredActivities.reduce((sum, item) => sum + item.correct_count, 0));
  const successRate = $derived(totalQuestions ? Math.round(totalCorrect / totalQuestions * 100) : 0);
  const totalDuration = $derived(filteredActivities.reduce((sum, item) => sum + (item.duration_seconds ?? 0), 0));
  const totalErrors = $derived(filteredActivities.reduce((sum, item) => sum + item.error_count, 0));
  const totalHints = $derived(filteredActivities.reduce((sum, item) => sum + (item.hints_used ?? 0), 0));
  const successRing = $derived(`conic-gradient(#2b795b ${successRate}%, #dfe9df 0)`);
  const byStudent = $derived(visibleStudents.filter((student) => selectedStudentId === 'all' || student.user_id === selectedStudentId).map((student) => {
    const own = filteredActivities.filter((item) => item.student_id === student.user_id);
    const questions = own.reduce((sum, item) => sum + item.question_count, 0);
    const correct = own.reduce((sum, item) => sum + item.correct_count, 0);
    return { student, activities: own.length, questions, rate: questions ? Math.round(correct / questions * 100) : 0 };
  }));
  const byGame = $derived(Object.entries(filteredActivities.reduce<Record<string, { correct: number; total: number; count: number }>>((groups, item) => {
    const group = groups[item.game_id] ?? { correct: 0, total: 0, count: 0 };
    group.correct += item.correct_count; group.total += item.question_count; group.count += 1; groups[item.game_id] = group;
    return groups;
  }, {})).map(([game, values]) => ({ game, ...values, rate: values.total ? Math.round(values.correct / values.total * 100) : 0 })).sort((a, b) => b.count - a.count));
  const selectedStudent = $derived(students.find((item) => item.user_id === selectedStudentId) ?? null);
  const selectedStudentActivities = $derived(selectedStudent ? filteredActivities.filter((item) => item.student_id === selectedStudent.user_id) : []);
  const selectedStudentSaves = $derived(selectedStudent ? visibleSaves.filter((item) => item.student_id === selectedStudent.user_id) : []);
  const transferTargets = $derived(selectedStudent ? students.filter((item) => item.user_id !== selectedStudent.user_id) : []);
  const skillRows = $derived(Object.entries(selectedStudentActivities.reduce<Record<string, { correct: number; total: number; errors: number; hints: number }>>((groups, item) => {
    const key = item.skill_id || item.activity_id;
    const group = groups[key] ?? { correct: 0, total: 0, errors: 0, hints: 0 };
    group.correct += item.correct_count; group.total += item.question_count; group.errors += item.error_count; group.hints += item.hints_used ?? 0; groups[key] = group;
    return groups;
  }, {})).map(([skill, values]) => ({ skill, ...values, rate: values.total ? Math.round(values.correct / values.total * 100) : 0 })).sort((a, b) => a.rate - b.rate));
  const frequentErrors = $derived(Object.entries(selectedStudentActivities.flatMap((item) => item.error_families ?? []).reduce<Record<string, number>>((groups, family) => {
    groups[family] = (groups[family] ?? 0) + 1; return groups;
  }, {})).map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count).slice(0, 6));
  const selectedDocuments = $derived(selectedStudent ? documents.filter((item) => item.student_id === selectedStudent.user_id) : []);
  const selectedResponses = $derived(selectedStudentActivities.flatMap((activity) => activity.response_details ?? []).slice(0, 80));

  function studentName(id: string) { return students.find((item) => item.user_id === id)?.display_name ?? 'Élève'; }
  function gameName(id: string) { return id.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  function duration(seconds: number) { const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
  function chooseStudent(studentId: string) { selectedStudentId = studentId; }
  async function transferSave(save: RemoteGameSave) {
    if (!selectedStudent || !transferTargetId || transferBusy) return;
    const target = students.find((item) => item.user_id === transferTargetId);
    if (!target) return;
    if (pendingTransferGameId !== save.game_id) {
      pendingTransferGameId = save.game_id;
      transferMessage = `Clique encore sur « Confirmer » pour remplacer la sauvegarde ${gameName(save.game_id)} de ${target.display_name}.`;
      return;
    }
    transferBusy = true; transferMessage = '';
    try { await copyStudentSave(selectedStudent.user_id, target.user_id, save.game_id); pendingTransferGameId = ''; transferMessage = `Sauvegarde copiée vers ${target.display_name}.`; await refresh(); }
    catch (error) { transferMessage = `Copie impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}`; }
    finally { transferBusy = false; }
  }

  async function refresh() {
    loading = true; message = '';
    try { [activities, saves] = await Promise.all([listRemoteActivityEvents(), listRemoteGameSaves()]); }
    catch { message = 'Les résultats distants ne sont pas accessibles pour le moment.'; }
    finally { loading = false; initialized = true; }
  }

  $effect(() => { if (!initialized && !loading) void refresh(); });
</script>

<section class="remote-dashboard" aria-labelledby="remote-title">
  <header>
    <div><p class="eyebrow">SUIVI SUPABASE</p><h2 id="remote-title">Vue d’ensemble de la classe</h2><p>Résultats synchronisés depuis les appareils élèves.</p></div>
    <button onclick={refresh} disabled={loading}>{loading ? 'Actualisation…' : 'Actualiser'}</button>
  </header>
  <div class="filters" aria-label="Filtres du tableau">
    <label>Classe<select bind:value={selectedClass}><option value="all">Toutes les classes</option>{#each classes as classroom}<option value={classroom.id}>{classroom.name}</option>{/each}</select></label>
    <label>Élève<select bind:value={selectedStudentId}><option value="all">Tous les élèves</option>{#each visibleStudents as student}<option value={student.user_id}>{student.display_name}</option>{/each}</select></label>
    <label>Période<select bind:value={selectedPeriod}><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option><option value="all">Toute la période</option></select></label>
    <label>Jeu<select bind:value={selectedGame}><option value="all">Tous les jeux</option>{#each availableGames as game}<option value={game}>{gameName(game)}</option>{/each}</select></label>
  </div>
  {#if message}<p class="notice" role="alert">{message}</p>{/if}
  <div class="metric-grid">
    <article><span>Élèves</span><strong>{selectedStudent ? 1 : visibleStudents.length}</strong><small>{selectedStudent?.display_name ?? (selectedClass === 'all' ? `${classes.length} classe(s)` : 'classe filtrée')}</small></article>
    <article><span>Activités</span><strong>{filteredActivities.length}</strong><small>{visibleSaves.length} sauvegarde(s)</small></article>
    <article><span>Réussite</span><strong>{successRate}%</strong><small>{totalCorrect}/{totalQuestions} réponses</small></article>
    <article><span>Temps observé</span><strong>{duration(totalDuration)}</strong><small>{totalErrors} erreur(s) · {totalHints} indice(s)</small></article>
  </div>
  <div class="visual-summary">
    <article class="panel ring-panel">
      <div class="success-ring" style={`background:${successRing}`} role="img" aria-label={`${successRate}% de réussite`}><span>{successRate}%</span></div>
      <div><p class="eyebrow">INDICATEUR CENTRAL</p><h3>Réussite moyenne</h3><p>{totalCorrect} réponses justes sur {totalQuestions}.</p><small>Les données restent filtrables par classe, élève, période et jeu.</small></div>
    </article>
    <article class="panel quick-reading">
      <h3>Lecture rapide</h3>
      <div class="reading-grid"><div><strong>{byGame.length}</strong><span>jeu(x) pratiqué(s)</span></div><div><strong>{visibleSaves.length}</strong><span>sauvegarde(s)</span></div><div><strong>{totalErrors}</strong><span>erreur(s) à observer</span></div><div><strong>{totalHints}</strong><span>indice(s) utilisé(s)</span></div></div>
    </article>
  </div>
  <div class="dashboard-columns">
    <article class="panel">
      <h3>Progression par élève</h3>
      {#if byStudent.length === 0}<p class="empty">Aucun élève.</p>{:else}
        <div class="bars">{#each byStudent as row}<button class="student-row" class:active={selectedStudentId === row.student.user_id} onclick={() => chooseStudent(row.student.user_id)}><span><strong>{row.student.display_name}</strong><small>{row.activities} activité(s) · {row.questions} questions</small></span><span class="track" aria-label={`${row.rate}% de réussite`}><i style={`width:${row.rate}%`}></i></span><b>{row.rate}%</b></button>{/each}</div>
      {/if}
    </article>
    <article class="panel">
      <h3>Résultats par jeu</h3>
      {#if byGame.length === 0}<p class="empty">Aucune activité synchronisée.</p>{:else}
        <div class="bars">{#each byGame as row}<div class="bar-row"><div><strong>{gameName(row.game)}</strong><small>{row.count} activité(s)</small></div><div class="track games"><span style={`width:${row.rate}%`}></span></div><b>{row.rate}%</b></div>{/each}</div>
      {/if}
    </article>
  </div>
  {#if selectedStudent}
    <article class="panel student-detail">
      <div class="detail-heading"><div><p class="eyebrow">FICHE ÉLÈVE</p><h3>{selectedStudent.display_name}</h3><p>Code : {selectedStudent.login_id}</p></div><button class="secondary" onclick={() => chooseStudent('all')}>Fermer la fiche</button></div>
      <div class="detail-grid">
        <section><h4>Compétences et activités</h4>{#if skillRows.length}<div class="bars">{#each skillRows as row}<div class="skill-row"><span><strong>{gameName(row.skill)}</strong><small>{row.correct}/{row.total} · {row.errors} erreur(s) · {row.hints} indice(s)</small></span><span class="track"><i style={`width:${row.rate}%`}></i></span><b>{row.rate}%</b></div>{/each}</div>{:else}<p class="empty">Pas encore de résultat synchronisé.</p>{/if}</section>
        <section><h4>Points à observer</h4>{#if frequentErrors.length}<ul class="error-list">{#each frequentErrors as error}<li><span>{gameName(error.family)}</span><b>{error.count}</b></li>{/each}</ul>{:else}<p class="empty">Aucune famille d’erreur disponible.</p>{/if}<h4>Sauvegardes reprenables</h4>{#if selectedStudentSaves.length}<div class="transfer-choice"><label>Copier vers<select bind:value={transferTargetId} onchange={() => { pendingTransferGameId = ''; transferMessage = ''; }}><option value="">Choisir un élève</option>{#each transferTargets as target}<option value={target.user_id}>{target.display_name}</option>{/each}</select></label></div><ul class="save-list">{#each selectedStudentSaves as save}<li><span><strong>{gameName(save.game_id)}</strong><small>Révision {save.revision} · {new Date(save.updated_at).toLocaleDateString('fr-CH')}</small></span><button class="copy-button" class:confirm={pendingTransferGameId === save.game_id} disabled={!transferTargetId || transferBusy} onclick={() => transferSave(save)}>{pendingTransferGameId === save.game_id ? 'Confirmer' : 'Copier'}</button></li>{/each}</ul>{#if transferMessage}<p class="transfer-message" role="status">{transferMessage}</p>{/if}{:else}<p class="empty">Aucune sauvegarde distante.</p>{/if}<h4>Documents PCP</h4>{#if selectedDocuments.length}<ul class="document-list">{#each selectedDocuments as document}<li><strong>{document.document_kind === 'cv' ? 'CV' : 'Lettre de motivation'}</strong><small>Mis à jour le {new Date(document.updated_at).toLocaleDateString('fr-CH')}</small><details><summary>Afficher le contenu</summary><pre>{Object.entries(document.content).map(([key, value]) => `${key} : ${value}`).join('\\n\\n')}</pre></details></li>{/each}</ul>{:else}<p class="empty">Aucun document PCP synchronisé.</p>{/if}</section>
      </div>
    </article>
  {/if}
  <article class="panel recent">
    <h3>Activités récentes</h3>
    {#if filteredActivities.length === 0}<p class="empty">Aucun bilan pour ces filtres.</p>{:else}
      <div class="table-wrap"><table><thead><tr><th>Élève</th><th>Jeu</th><th>Résultat</th><th>Erreurs</th><th>Durée</th><th>Date</th></tr></thead><tbody>{#each filteredActivities.slice(0, 20) as item}<tr><td>{studentName(item.student_id)}</td><td>{gameName(item.game_id)}</td><td><strong>{item.correct_count}/{item.question_count}</strong></td><td>{item.error_count}</td><td>{item.duration_seconds ? duration(item.duration_seconds) : '—'}</td><td>{new Date(item.occurred_at).toLocaleDateString('fr-CH')}</td></tr>{/each}</tbody></table></div>
    {/if}
  </article>
  {#if selectedStudent && selectedResponses.length}
    <article class="panel response-detail-panel">
      <h3>Détail des réponses</h3>
      <p class="empty">Les traces servent à préparer un feedback ciblé ; elles ne remplacent pas l’observation de l’élève.</p>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Question</th><th>Réponse</th><th>Attendu</th><th>Résultat</th><th>Essais</th></tr></thead><tbody>{#each selectedResponses as response}<tr><td>{response.questionIndex + 1}</td><td>{response.prompt ?? '—'}</td><td>{response.response ?? '—'}</td><td>{response.expected ?? '—'}</td><td>{response.correct ? 'Juste' : 'À reprendre'}</td><td>{response.attempts ?? '—'}</td></tr>{/each}</tbody></table></div>
    </article>
  {/if}
</section>

<style>
  .remote-dashboard{color:#21332f;background:linear-gradient(145deg,#f9fbf5,#edf4ed);border:1px solid #ceddce;border-radius:24px;padding:clamp(1rem,3vw,2rem);margin:1.5rem 0;box-shadow:0 18px 45px #0d2b2012}.remote-dashboard>header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;border:0;margin:0 0 1.4rem;padding:0}.remote-dashboard h2{margin:.25rem 0;font-size:clamp(1.6rem,3vw,2.35rem);color:#173c31}.remote-dashboard h3{margin-top:0}.remote-dashboard h4{margin:0 0 .8rem;color:#274b40}.remote-dashboard p{margin:.35rem 0;color:#506760}.eyebrow{font-size:.72rem;font-weight:800;letter-spacing:.15em;color:#2c7158!important}.remote-dashboard button{border:1px solid #2b6b55;border-radius:10px;background:#265f4c;color:white;padding:.7rem 1rem;font-weight:700}.filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem;margin-bottom:1rem;padding:1rem;background:#e5eee5;border-radius:14px}.filters label{font-weight:700;font-size:.82rem;color:#38564c}.filters select,.transfer-choice select{display:block;width:100%;margin-top:.35rem;padding:.65rem;border:1px solid #9fb5a7;border-radius:9px;background:white;color:#21332f}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem}.metric-grid article,.panel{background:white;border:1px solid #d9e4d8;border-radius:16px;padding:1rem}.metric-grid span,.metric-grid small{display:block;color:#60736c}.metric-grid strong{display:block;font-size:clamp(1.7rem,4vw,2.5rem);color:#173c31;margin:.25rem 0}.dashboard-columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}.bars{display:grid;gap:1rem}.bar-row,.student-row,.skill-row{display:grid;grid-template-columns:minmax(120px,1.4fr) minmax(90px,2fr) 3rem;align-items:center;gap:.75rem}.bar-row small,.student-row small,.skill-row small{display:block;color:#6a7c75;margin-top:.2rem}.student-row{width:100%;text-align:left;background:#f7faf7!important;color:#21332f!important;border-color:#dbe7dc!important;padding:.75rem!important}.student-row.active{outline:3px solid #87b99e}.student-row strong,.skill-row strong{font-size:1rem!important;margin:0!important}.track{display:block;height:12px;border-radius:99px;background:#e5ece6;overflow:hidden}.track span,.track i{display:block;height:100%;background:linear-gradient(90deg,#2b795b,#63b878);border-radius:inherit}.track.games span{background:linear-gradient(90deg,#2d6f91,#65b5bb)}.bar-row b,.student-row b,.skill-row b{text-align:right;color:#214b3e}.student-detail{margin-top:1rem;border-color:#9dc3ac}.detail-heading{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.detail-heading h3{font-size:1.65rem;margin:.2rem 0}.secondary{background:white!important;color:#285f4d!important}.detail-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:1.5rem;margin-top:1.2rem}.error-list,.save-list{list-style:none;margin:0 0 1.4rem;padding:0;display:grid;gap:.5rem}.error-list li,.save-list li{display:flex;justify-content:space-between;align-items:center;gap:1rem;background:#f3f7f3;border-radius:10px;padding:.7rem}.error-list b{background:#f4d9c5;color:#783a1b;border-radius:99px;padding:.15rem .55rem}.save-list small{display:block}.transfer-choice{margin:.5rem 0 1rem}.transfer-choice label{font-weight:700;font-size:.82rem}.copy-button{padding:.4rem .65rem!important;font-size:.78rem}.copy-button.confirm{background:#9b4b24!important;border-color:#7d3718!important}.transfer-message{padding:.65rem;background:#e5f4e8;border-radius:9px}.recent{margin-top:1rem}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:.9rem}th,td{padding:.8rem;border-bottom:1px solid #e1e9e1}th{color:#52665f;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}.notice{background:#fff3d8;padding:.8rem;border-left:4px solid #b77720}.empty{padding:1rem 0}@media(max-width:800px){.filters{grid-template-columns:1fr}.metric-grid{grid-template-columns:repeat(2,1fr)}.dashboard-columns,.detail-grid{grid-template-columns:1fr}.remote-dashboard>header,.detail-heading{flex-direction:column}.bar-row,.student-row,.skill-row{grid-template-columns:1fr 3rem}.track{grid-column:1/3}}
  .visual-summary{display:grid;grid-template-columns:1.2fr 1fr;gap:1rem;margin-top:1rem}.ring-panel{display:flex;align-items:center;gap:1.2rem}.success-ring{width:116px;height:116px;flex:0 0 116px;border-radius:50%;display:grid;place-items:center;position:relative}.success-ring::before{content:"";position:absolute;inset:10px;border-radius:50%;background:white}.success-ring span{position:relative;font-weight:800;font-size:1.35rem;color:#173c31}.ring-panel h3{margin:.25rem 0}.ring-panel small{display:block;color:#718078;margin-top:.65rem;line-height:1.4}.quick-reading h3{margin-bottom:1rem}.reading-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.8rem}.reading-grid div{background:#f3f8f3;border-radius:12px;padding:.7rem}.reading-grid strong,.reading-grid span{display:block}.reading-grid strong{font-size:1.4rem;color:#285f4d}.reading-grid span{font-size:.78rem;color:#60736c;margin-top:.2rem}@media(max-width:800px){.visual-summary{grid-template-columns:1fr}}
</style>
