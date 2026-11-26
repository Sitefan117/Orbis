<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { MISSION_GAME_INFO, type MissionGame } from './catalog';

  export let game: MissionGame;
  export let configuration: unknown;
  export let onMission: (mission: ResolvedMission) => void;

  interface ResolvedMission {
    id: string;
    code: string;
    portalCode: string;
    gameCode: string;
    game: MissionGame;
    configuration: unknown;
    summary: string[];
  }

  let codeInput = '';
  let message = '';
  let busy = false;
  let teacherOpen = false;
  let teacherAuthenticated = false;
  let password = '';
  let generatedCode = '';
  let scope: 'portal' | 'game' = 'game';

  $: info = MISSION_GAME_INFO[game];

  onMount(() => {
    const code = new URLSearchParams(window.location.search).get('mission');
    if (code) void loadMission(code, false);
  });

  async function loadMission(value = codeInput, requirePrefix = true) {
    const code = value.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) { message = 'Entre le code donné par ton enseignant.'; return; }
    if (requirePrefix && !code.startsWith(`${info.prefix}-`)) {
      message = `Dans ${info.label}, le code commence par ${info.prefix}-. Le code court se saisit dans le portail Orbis.`;
      return;
    }
    busy = true;
    message = '';
    try {
      const response = await fetch(`${base}/api/learning-missions/${encodeURIComponent(code)}`);
      const data = await response.json();
      if (!response.ok || !data.mission) throw new Error(data.message || 'Code introuvable.');
      if (data.mission.game !== game) throw new Error(`Ce code concerne ${MISSION_GAME_INFO[data.mission.game as MissionGame]?.label ?? 'un autre jeu'}.`);
      codeInput = data.mission.gameCode;
      onMission(data.mission as ResolvedMission);
      message = `Mission chargée : ${data.mission.summary.join(' · ')}`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Impossible de charger cette mission.';
    } finally { busy = false; }
  }

  async function toggleTeacher() {
    teacherOpen = !teacherOpen;
    generatedCode = '';
    if (!teacherOpen) return;
    try {
      const response = await fetch(`${base}/api/teacher/session`);
      const data = await response.json();
      teacherAuthenticated = data.authenticated === true;
    } catch { message = 'Le serveur enseignant ne répond pas.'; }
  }

  async function login() {
    busy = true;
    try {
      const response = await fetch(`${base}/api/teacher/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Connexion impossible.');
      teacherAuthenticated = true;
      password = '';
      message = 'Accès enseignant activé.';
    } catch (error) { message = error instanceof Error ? error.message : 'Connexion impossible.'; }
    finally { busy = false; }
  }

  async function generate() {
    busy = true;
    generatedCode = '';
    try {
      const response = await fetch(`${base}/api/teacher/learning-missions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope, game, configuration }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Création impossible.');
      generatedCode = data.mission.code;
      message = 'Le code est prêt.';
    } catch (error) { message = error instanceof Error ? error.message : 'Création impossible.'; }
    finally { busy = false; }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(generatedCode); message = `Code ${generatedCode} copié.`; }
    catch { message = `Code à recopier : ${generatedCode}`; }
  }
</script>

<section class="mission-tools" aria-label={`Codes mission ${info.label}`}>
  <div class="mission-row">
    <form on:submit|preventDefault={() => loadMission()}>
      <label for={`mission-code-${game}`}>Code mission</label>
      <div><input id={`mission-code-${game}`} bind:value={codeInput} placeholder={`${info.prefix}-ABC234`} autocomplete="off" /><button type="submit" disabled={busy}>Appliquer</button></div>
    </form>
    <button class="teacher-toggle" type="button" on:click={toggleTeacher} aria-expanded={teacherOpen}>Créer un code enseignant</button>
  </div>
  {#if message}<p class="mission-message" role="status">{message}</p>{/if}
  {#if teacherOpen}
    <div class="teacher-box">
      {#if !teacherAuthenticated}
        <label for={`teacher-password-${game}`}>Mot de passe enseignant</label>
        <div class="inline"><input id={`teacher-password-${game}`} type="password" bind:value={password} autocomplete="current-password" /><button type="button" on:click={login} disabled={busy}>Connexion</button></div>
      {:else}
        <p>Le code utilisera les réglages actuellement sélectionnés dans le jeu.</p>
        <div class="scope"><label><input type="radio" bind:group={scope} value="portal" /> Portail</label><label><input type="radio" bind:group={scope} value="game" /> {info.prefix}-</label></div>
        <button class="generate" type="button" on:click={generate} disabled={busy}>{busy ? 'Création…' : 'Générer le code'}</button>
        {#if generatedCode}<div class="generated"><strong>{generatedCode}</strong><button type="button" on:click={copyCode}>Copier</button></div>{/if}
      {/if}
    </div>
  {/if}
</section>

<style>
  .mission-tools{margin:0 0 16px;padding:14px;border:1px solid #4b5a70;border-radius:12px;background:#101827;color:#eef4ff;text-align:left;font-family:Inter,system-ui,sans-serif}.mission-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.mission-tools form,.teacher-box{display:grid;gap:7px}.mission-tools label{font-size:.82rem;font-weight:800}.mission-tools form>div,.inline,.generated{display:flex;gap:8px}.mission-tools input{min-width:0;min-height:42px;flex:1;padding:0 11px;border:1px solid #718096;border-radius:8px;background:#07101d;color:white;font:inherit}.mission-tools button{min-height:42px;padding:8px 13px;border:1px solid #7dd3fc;border-radius:8px;background:#13334a;color:white;font-weight:800;cursor:pointer}.mission-tools button:focus-visible,.mission-tools input:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}.teacher-toggle{white-space:nowrap}.mission-message{margin:9px 0 0;color:#d6e6fa;line-height:1.45}.teacher-box{margin-top:12px;padding-top:12px;border-top:1px solid #435068}.teacher-box p{margin:0;color:#c5d1e1}.scope{display:flex;gap:14px;flex-wrap:wrap}.scope label{display:flex;gap:6px;align-items:center}.scope input{min-height:auto;flex:none}.generate{justify-self:start}.generated{align-items:center}.generated strong{font:900 1.25rem ui-monospace,monospace;letter-spacing:.08em;color:#7dd3fc}@media(max-width:650px){.mission-row{grid-template-columns:1fr}.teacher-toggle{white-space:normal}.mission-tools form>div{flex-direction:column}}
</style>
