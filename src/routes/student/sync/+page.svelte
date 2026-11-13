<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { syncPendingOrbisData, type SyncReport } from '$lib/orbis/persistence/sync';

  let report = $state<SyncReport | null>(null);
  let loading = $state(false);

  async function synchronize() {
    loading = true;
    report = await syncPendingOrbisData();
    loading = false;
  }

  onMount(() => { void synchronize(); });
</script>

<svelte:head><title>Synchronisation · Orbis</title></svelte:head>
<main>
  <section>
    <p class="eyebrow">ORBIS · DIAGNOSTIC</p>
    <h1>Mes données</h1>
    <p>Cette page vérifie les résultats et sauvegardes qui attendent encore leur envoi.</p>
    <button onclick={synchronize} disabled={loading}>{loading ? 'Synchronisation…' : 'Synchroniser maintenant'}</button>
    {#if report}
      <div class="report" class:ok={report.pending === 0}>
        <strong>{report.message}</strong>
        <p>{report.eventsSynced} activité(s) envoyée(s) · {report.savesSynced} sauvegarde(s) envoyée(s) · {report.pending} élément(s) en attente.</p>
        {#if report.errors.length}<ul>{#each report.errors as error}<li>{error}</li>{/each}</ul>{/if}
      </div>
    {/if}
    <a href={`${base}/`}>← Retour à Orbis</a>
  </section>
</main>

<style>
  :global(body){margin:0;font-family:Arial,sans-serif;background:#f3f6ef;color:#20332e}main{min-height:100vh;display:grid;place-items:center;padding:1.5rem}section{width:min(100%,38rem);background:#fffdf7;border:2px solid #d4dfd3;border-radius:18px;padding:2rem;box-sizing:border-box}.eyebrow{font-weight:700;color:#285f4c;letter-spacing:.1em}button{padding:.8rem 1rem;border:0;border-radius:10px;background:#285f4c;color:white;font-weight:700}.report{margin:1.25rem 0;padding:1rem;border-left:5px solid #b05b35;background:#fff0df}.report.ok{border-color:#2b7655;background:#e5f3e8}a{color:#285f4c}
</style>
