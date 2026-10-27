<script lang="ts">
  import { onMount } from 'svelte';
  import { worldLabels } from '$lib/orbis/catalog/games';
  import { clearLocalActivityEvents, getLocalActivityEvents, getLocalGameSaves, type LocalSaveEnvelope } from '$lib/orbis/persistence/local-store';
  import type { ActivityEvent } from '$lib/orbis/results/contract';

  let events = $state<ActivityEvent[]>([]);
  let saves = $state<LocalSaveEnvelope[]>([]);

  const totals = $derived.by(() => {
    const questions = events.reduce((sum, event) => sum + event.questionCount, 0);
    const correct = events.reduce((sum, event) => sum + event.correctCount, 0);
    return {
      activities: events.length,
      students: new Set([
        ...events.map((event) => event.studentName.toLocaleLowerCase()),
        ...saves.map((save) => (save.studentName || save.studentScope).toLocaleLowerCase())
      ]).size,
      questions,
      success: questions ? Math.round((correct / questions) * 100) : 0,
      pending: events.filter((event) => event.syncState !== 'synced').length
        + saves.filter((save) => save.syncState !== 'synced').length
    };
  });

  const sortedEvents = $derived([...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  const sortedSaves = $derived([...saves].sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt)));

  onMount(refresh);

  function refresh(): void {
    events = getLocalActivityEvents();
    saves = getLocalGameSaves();
  }

  function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' });
  }

  function percentage(event: ActivityEvent): number {
    return event.questionCount ? Math.round((event.correctCount / event.questionCount) * 100) : 0;
  }

  function csvCell(value: unknown): string {
    return `"${String(value ?? '').replaceAll('"', '""')}"`;
  }

  function exportCsv(): void {
    if (!events.length) return;
    const header = ['Élève', 'Jeu', 'Activité', 'Notion', 'Date', 'Durée (s)', 'Questions', 'Réussites', 'Erreurs', 'Types d’erreurs', 'Aides', 'Synchronisation'];
    const rows = sortedEvents.map((event) => [
      event.studentName,
      worldLabels[event.gameId],
      event.activityId,
      event.skillId ?? '',
      event.occurredAt,
      event.durationSeconds ?? '',
      event.questionCount,
      event.correctCount,
      event.errorCount,
      event.errorFamilies.join(' | '),
      event.hintsUsed ?? '',
      event.syncState
    ].map(csvCell).join(','));
    const blob = new Blob([`\uFEFF${header.map(csvCell).join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbis-suivi-local-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearEvents(): void {
    if (!window.confirm('Effacer les bilans Orbis stockés sur ce navigateur ?')) return;
    clearLocalActivityEvents();
    refresh();
  }
</script>

<section class="panel" aria-labelledby="local-tracking-title">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Premier suivi gratuit</p>
      <h2 id="local-tracking-title">Activités enregistrées sur cet appareil</h2>
      <p class="explanation">Ces données restent dans ce navigateur. Les anciennes sauvegardes des jeux continuent de fonctionner.</p>
    </div>
    <div class="panel-actions">
      <button class="secondary" onclick={refresh}>Actualiser</button>
      <button class="export" onclick={exportCsv} disabled={!events.length}>Exporter en CSV</button>
      <button class="danger" onclick={clearEvents} disabled={!events.length}>Effacer</button>
    </div>
  </div>

  {#if saves.length}
    <div class="resume-block">
      <h3>Reprises disponibles</h3>
      <div class="resume-grid">
        {#each sortedSaves as save (`${save.studentScope}-${save.gameId}`)}
          <article>
            <strong>{save.studentName || save.studentScope}</strong>
            <span>{worldLabels[save.gameId as keyof typeof worldLabels] ?? save.gameId}</span>
            <small>{save.progressSummary?.label ?? 'Sauvegarde disponible'} · {formatDate(save.record.updatedAt)}</small>
            {#if save.syncState === 'conflict'}<small class="conflict">Conflit distant à résoudre</small>{/if}
          </article>
        {/each}
      </div>
    </div>
  {/if}

  <div class="summary" aria-label="Résumé du suivi">
    <article><strong>{totals.students}</strong><span>élève(s)</span></article>
    <article><strong>{totals.activities}</strong><span>activité(s)</span></article>
    <article><strong>{totals.questions}</strong><span>question(s)</span></article>
    <article><strong>{totals.success}%</strong><span>de réussite</span></article>
    <article><strong>{totals.pending}</strong><span>en attente de synchro</span></article>
  </div>

  {#if !events.length}
    <div class="empty">
      <strong>Aucun bilan enregistré pour l’instant.</strong>
      <span>Un bilan apparaîtra ici après une activité compatible jouée sur ce navigateur.</span>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Élève</th><th>Jeu / activité</th><th>Date</th><th>Résultat</th><th>Erreurs et aides</th><th>État</th></tr></thead>
        <tbody>
          {#each sortedEvents as event (event.eventId)}
            <tr>
              <td><strong>{event.studentName}</strong></td>
              <td><strong>{worldLabels[event.gameId]}</strong><small>{event.activityId}{event.skillId ? ` · ${event.skillId}` : ''}</small></td>
              <td>{formatDate(event.occurredAt)}{#if event.durationSeconds !== undefined}<small>{event.durationSeconds} s</small>{/if}</td>
              <td><strong class:low={percentage(event) < 60}>{event.correctCount}/{event.questionCount} · {percentage(event)}%</strong></td>
              <td>{event.errorCount} erreur(s){#if event.hintsUsed !== undefined}<small>{event.hintsUsed} aide(s)</small>{/if}{#if event.errorFamilies.length}<small>{event.errorFamilies.join(', ')}</small>{/if}</td>
              <td><span class:pending={event.syncState !== 'synced'} class="sync-badge">{event.syncState === 'synced' ? 'Synchronisé' : 'Local'}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .panel { background: #1e1e1e; border: 1px solid #3a3a3a; border-radius: 16px; padding: 1.25rem; margin-bottom: 2rem; box-shadow: 0 8px 25px rgb(0 0 0 / .22); }
  .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .eyebrow { margin: 0 0 .25rem; color: #ffcc00; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: .75rem; }
  h2 { margin: 0; color: white; }
  .explanation { margin: .45rem 0 0; color: #bdbdbd; }
  .panel-actions { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: flex-end; }
  button { border: 0; border-radius: 8px; padding: .65rem .85rem; color: white; font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  .secondary { background: #555; } .export { background: #2e7d32; } .danger { background: #a72c2c; }
  .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .75rem; margin: 1.2rem 0; }
  .summary article { display: flex; flex-direction: column; background: #292929; border-radius: 10px; padding: .85rem; }
  .summary strong { color: #ffcc00; font-size: 1.35rem; } .summary span, small { color: #aaa; font-size: .78rem; }
  .empty { display: flex; flex-direction: column; gap: .35rem; padding: 2rem; text-align: center; color: #bbb; background: #181818; border-radius: 10px; }
  .resume-block { margin: 1rem 0 1.25rem; }
  .resume-block h3 { margin: 0 0 .65rem; }
  .resume-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: .65rem; }
  .resume-grid article { display: flex; flex-direction: column; gap: .2rem; padding: .75rem; border: 1px solid #3c3c3c; border-radius: 10px; background: #252525; }
  .resume-grid span { color: #ffcc00; }
  .resume-grid .conflict { color: #ff7770; font-weight: 700; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th, td { padding: .8rem; border-bottom: 1px solid #383838; vertical-align: top; }
  th { color: #aaa; text-transform: uppercase; font-size: .72rem; }
  td small { display: block; margin-top: .25rem; max-width: 32ch; }
  .low { color: #ff7770; }
  .sync-badge { display: inline-block; border-radius: 999px; padding: .25rem .5rem; background: #1f6841; font-size: .75rem; white-space: nowrap; }
  .sync-badge.pending { background: #6f5510; }
  @media (max-width: 850px) { .panel-heading { flex-direction: column; } .panel-actions { justify-content: flex-start; } .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
