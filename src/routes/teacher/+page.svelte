<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { RACE_NOTIONS, type RaceGameMode, type RaceNotion, type RacePracticeLevel } from '$lib/missions/race';
  import { MISSION_GAME_INFO, MISSION_GAMES, type MissionGame } from '$lib/missions/catalog';
  import type { MathHuntDifficulty } from '$lib/missions/mathhunt';
  import type { DecimalOperation } from '$lib/missions/calculs';
  import { getTensesForGrade } from '$lib/conju-lab/curriculum';
  import type { ActivityFocus, AnswerStyle, Grade, PlayPath, TenseId, VerbGroup } from '$lib/conju-lab/types';
  import { SHIFT_DIFFICULTIES, SHIFT_DIFFICULTY_LABELS, SHIFT_MISSION_IDS, SHIFT_MISSION_LABELS, type ShiftDifficulty, type ShiftMissionId, type ShiftPlayStyle } from '$lib/missions/shift';

  type Mission = { id: string; code: string; portalCode: string; gameCode: string; scope: 'portal' | 'game'; game: MissionGame; summary: string[]; createdAt: number; expiresAt: number | null };
  type RecentResult = { id: number; studentName: string; world: string; mission: string; score: number; total: number; errorCount: number; createdAt: number };
  const notionLabels: Record<RaceNotion, string> = {
    livrets: 'Livrets', doubles: 'Doubles / moitiés', triples: 'Triples', quadruples: 'Quadruples',
    complements10: 'Compléments à 10', complements100: 'Compléments à 100', complements1000: 'Compléments à 1 000',
    dizaineSuivante: 'Dizaine suivante', centaineSuivante: 'Centaine suivante', millierSuivant: 'Millier suivant',
    trous: 'Facteur manquant', divisions: 'Divisions liées'
  };
  const tables = Array.from({ length: 12 }, (_, index) => index + 1);
  let ready = false;
  let authenticated = false;
  let password = '';
  let message = '';
  let busy = false;
  let missions: Mission[] = [];
  let recentResults: RecentResult[] = [];
  let generatedMission: Mission | null = null;
  let scope: 'portal' | 'game' = 'portal';
  let selectedGame: MissionGame = 'race';
  let selectedNotions: RaceNotion[] = ['livrets', 'complements10', 'complements100'];
  let selectedTables: number[] = [4];
  let practiceLevel: RacePracticeLevel = 'guided';
  let gameMode: RaceGameMode = 'training';
  let questionCount = 12;
  let livretsTables: number[] = [2, 3, 4, 5];
  let livretsQuestionCount = 10;
  let huntTables: number[] = [2, 3, 4, 5];
  let huntDifficulty: MathHuntDifficulty = 'FACILE';
  let huntMovement = true;
  let calculLevels: number[] = [1];
  let calculOperations: DecimalOperation[] = ['+', '-'];
  let calculQuestionCount = 10;
  let conjuGrade: Grade = '6H';
  let conjuPath: PlayPath = 'guide';
  let conjuFocus: ActivityFocus = 'mixte';
  let conjuAnswerStyle: AnswerStyle = 'mixte';
  let conjuTenses: TenseId[] = ['present', 'imparfait', 'futurSimple', 'passeCompose'];
  let conjuGroups: VerbGroup[] = [1, 2, 3];
  let shiftMission: ShiftMissionId = 'factory';
  let shiftDifficulty: ShiftDifficulty = 'starter';
  let shiftPlayStyle: ShiftPlayStyle = 'practice';
  $: conjuAvailableTenses = getTensesForGrade(conjuGrade);

  function chooseConjuGrade(grade: Grade) {
    conjuGrade = grade;
    conjuTenses = getTensesForGrade(grade).map((tense) => tense.id);
  }

  function currentConfiguration(): unknown {
    if (selectedGame === 'race') return { schemaVersion: 1, selectedNotions, selectedTables, practiceLevel, gameMode, questionCount };
    if (selectedGame === 'livrets') return { schemaVersion: 1, selectedTables: livretsTables, questionCount: livretsQuestionCount };
    if (selectedGame === 'mathhunt') return { schemaVersion: 1, selectedTables: huntTables, difficulty: huntDifficulty, movementOn: huntMovement };
    if (selectedGame === 'calculs') return { schemaVersion: 1, activeLevels: calculLevels, operations: calculOperations, questionCount: calculQuestionCount };
    if (selectedGame === 'conju_lab') return { schemaVersion: 1, grade: conjuGrade, playPath: conjuPath, focus: conjuFocus, answerStyle: conjuAnswerStyle, selectedTenses: conjuTenses, selectedGroups: conjuGroups };
    return { schemaVersion: 1, missionId: shiftMission, difficulty: shiftDifficulty, playStyle: shiftPlayStyle };
  }

  onMount(() => { void refreshSession(); });

  async function refreshSession() {
    try {
      const response = await fetch(`${base}/api/teacher/session`);
      const data = await response.json();
      authenticated = data.authenticated === true;
      if (authenticated) await loadMissions();
    } catch { message = 'Le serveur local ne répond pas. Lance Orbis avec npm run dev.'; }
    finally { ready = true; }
  }

  async function login() {
    busy = true; message = '';
    try {
      const response = await fetch(`${base}/api/teacher/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Connexion impossible.');
      authenticated = true; password = ''; await loadMissions();
    } catch (error) { message = error instanceof Error ? error.message : 'Connexion impossible.'; }
    finally { busy = false; }
  }

  async function logout() {
    await fetch(`${base}/api/teacher/session`, { method: 'DELETE' });
    authenticated = false; missions = []; generatedMission = null;
  }

  async function loadMissions() {
    const [missionResponse, dashboardResponse] = await Promise.all([
      fetch(`${base}/api/teacher/learning-missions`),
      fetch(`${base}/api/teacher/dashboard`)
    ]);
    if (missionResponse.ok) {
      const data = await missionResponse.json();
      missions = data.missions ?? [];
    }
    if (dashboardResponse.ok) {
      const data = await dashboardResponse.json();
      recentResults = (data.results ?? []).slice(0, 8);
    }
  }

  async function createMission() {
    message = ''; generatedMission = null;
    if (selectedGame === 'race' && selectedNotions.length === 0) { message = 'Choisis au moins une compétence.'; return; }
    if (selectedGame === 'race' && selectedNotions.includes('livrets') && selectedTables.length === 0) { message = 'Choisis au moins une table pour les livrets.'; return; }
    busy = true;
    try {
      const response = await fetch(`${base}/api/teacher/learning-missions`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope, game: selectedGame, configuration: currentConfiguration() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Création impossible.');
      generatedMission = data.mission; message = 'Le code est prêt.'; await loadMissions();
    } catch (error) { message = error instanceof Error ? error.message : 'Création impossible.'; }
    finally { busy = false; }
  }

  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(code); message = `Code ${code} copié.`; }
    catch { message = `Code à recopier : ${code}`; }
  }
</script>

<svelte:head><title>Espace enseignant — Orbis</title></svelte:head>
<main class="teacher-page">
  <header class="topbar">
    <div><p class="eyebrow">ORBIS</p><h1>Espace enseignant</h1></div>
    <div class="top-actions"><a href={`${base}/`}>Retour à Orbis</a>{#if authenticated}<button on:click={logout}>Se déconnecter</button>{/if}</div>
  </header>

  {#if !ready}
    <section class="panel"><p>Chargement de l’espace enseignant…</p></section>
  {:else if !authenticated}
    <section class="panel login-panel">
      <p class="eyebrow">ACCÈS PROTÉGÉ</p><h2>Connexion enseignant</h2>
      <p>Utilise le mot de passe configuré dans <code>TEACHER_PASSWORD</code> ou <code>TEACHER_PASSWORD_HASH</code>.</p>
      <form on:submit|preventDefault={login}>
        <label for="teacher-password">Mot de passe</label>
        <input id="teacher-password" type="password" bind:value={password} required autocomplete="current-password" />
        <button class="primary" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      {#if message}<p class="message" role="alert">{message}</p>{/if}
    </section>
  {:else}
    <div class="teacher-grid">
      <section class="panel generator">
        <p class="eyebrow">GÉNÉRATEUR MULTI-JEUX</p><h2>Créer une mission</h2>
        <p>Le code portail ouvre automatiquement le bon jeu. Le code jeu commence par son préfixe.</p>
        <label class="game-select">Jeu<select bind:value={selectedGame}>{#each MISSION_GAMES as game}<option value={game}>{MISSION_GAME_INFO[game].label}</option>{/each}</select></label>
        <fieldset><legend>Type de code</legend><div class="two-cols">
          <label class:chosen={scope === 'portal'}><input type="radio" bind:group={scope} value="portal" /> Code portail</label>
          <label class:chosen={scope === 'game'}><input type="radio" bind:group={scope} value="game" /> Code {MISSION_GAME_INFO[selectedGame].prefix}-</label>
        </div></fieldset>
        {#if selectedGame === 'race'}
          <fieldset><legend>Compétences</legend><div class="skills-grid">{#each RACE_NOTIONS as notion}<label class:chosen={selectedNotions.includes(notion)}><input type="checkbox" bind:group={selectedNotions} value={notion} /> {notionLabels[notion]}</label>{/each}</div></fieldset>
          {#if selectedNotions.includes('livrets')}<fieldset><legend>Tables</legend><div class="tables-grid">{#each tables as table}<label class:chosen={selectedTables.includes(table)}><input type="checkbox" bind:group={selectedTables} value={table} /> {table}</label>{/each}</div></fieldset>{/if}
          <div class="form-grid"><label>Niveau<select bind:value={practiceLevel}><option value="guided">Guidé</option><option value="standard">Standard</option><option value="challenge">Défi</option></select></label><label>Mode<select bind:value={gameMode}><option value="training">Entraînement</option><option value="arcade">Arcade</option></select></label><label>Questions<input type="number" bind:value={questionCount} min="6" max="15" /></label></div>
        {:else if selectedGame === 'livrets'}
          <fieldset><legend>Tables</legend><div class="tables-grid">{#each tables as table}<label class:chosen={livretsTables.includes(table)}><input type="checkbox" bind:group={livretsTables} value={table} /> {table}</label>{/each}</div></fieldset>
          <div class="form-grid"><label>Questions<input type="number" bind:value={livretsQuestionCount} min="5" max="20" /></label></div>
        {:else if selectedGame === 'mathhunt'}
          <fieldset><legend>Tables</legend><div class="tables-grid">{#each tables as table}<label class:chosen={huntTables.includes(table)}><input type="checkbox" bind:group={huntTables} value={table} /> {table}</label>{/each}</div></fieldset>
          <div class="form-grid"><label>Difficulté<select bind:value={huntDifficulty}><option value="FACILE">Facile</option><option value="ACCRUE">Accrue</option></select></label><label class="check-line"><input type="checkbox" bind:checked={huntMovement} /> Cibles mobiles</label></div>
        {:else if selectedGame === 'calculs'}
          <fieldset><legend>Niveaux</legend><div class="two-cols">{#each [1, 2, 3] as level}<label class:chosen={calculLevels.includes(level)}><input type="checkbox" bind:group={calculLevels} value={level} /> Niveau {level}</label>{/each}</div></fieldset>
          <fieldset><legend>Opérations</legend><div class="two-cols"><label class:chosen={calculOperations.includes('+')}><input type="checkbox" bind:group={calculOperations} value="+" /> Additions</label><label class:chosen={calculOperations.includes('-')}><input type="checkbox" bind:group={calculOperations} value="-" /> Soustractions</label></div></fieldset>
          <div class="form-grid"><label>Questions<input type="number" bind:value={calculQuestionCount} min="5" max="20" /></label></div>
        {:else if selectedGame === 'conju_lab'}
          <div class="form-grid"><label>Degré<select value={conjuGrade} on:change={(event) => chooseConjuGrade((event.currentTarget as HTMLSelectElement).value as Grade)}>{#each ['6H','7H','8H','9H'] as grade}<option value={grade}>{grade}</option>{/each}</select></label><label>Parcours<select bind:value={conjuPath}><option value="guide">Guidé</option><option value="libre">Libre</option></select></label><label>Réponses<select bind:value={conjuAnswerStyle}><option value="mixte">Variées</option><option value="qcm">Choix multiples</option><option value="saisie">Réponse écrite</option></select></label></div>
          <fieldset><legend>Temps</legend><div class="skills-grid">{#each conjuAvailableTenses as tense}<label class:chosen={conjuTenses.includes(tense.id)}><input type="checkbox" bind:group={conjuTenses} value={tense.id} /> {tense.shortLabel}</label>{/each}</div></fieldset>
          <fieldset><legend>Groupes</legend><div class="two-cols">{#each [1,2,3] as group}<label class:chosen={conjuGroups.includes(group as VerbGroup)}><input type="checkbox" bind:group={conjuGroups} value={group} /> Groupe {group}</label>{/each}</div></fieldset>
          <div class="form-grid"><label>Activité<select bind:value={conjuFocus}><option value="mixte">Mixte</option><option value="conjuguer">Conjuguer</option><option value="identifier">Identifier</option><option value="groupes">Groupes</option><option value="radicaux">Radicaux</option></select></label></div>
        {:else}
          <div class="form-grid"><label>Mission<select bind:value={shiftMission}>{#each SHIFT_MISSION_IDS as mission}<option value={mission}>{SHIFT_MISSION_LABELS[mission]}</option>{/each}</select></label><label>Difficulté<select bind:value={shiftDifficulty}>{#each SHIFT_DIFFICULTIES as difficulty}<option value={difficulty}>{SHIFT_DIFFICULTY_LABELS[difficulty]}</option>{/each}</select></label><label>Mode<select bind:value={shiftPlayStyle}><option value="practice">Entraînement</option><option value="challenge">Défi · 3 vies</option></select></label></div>
        {/if}
        <button class="primary create" type="button" on:click={createMission} disabled={busy}>{busy ? 'Création…' : 'Générer le code'}</button>
        {#if message}<p class="message" role="status">{message}</p>{/if}
        {#if generatedMission}
          <div class="generated"><span>CODE CRÉÉ</span><strong>{generatedMission.code}</strong><p>{generatedMission.summary.join(' · ')}</p><button on:click={() => copyCode(generatedMission!.code)}>Copier le code</button></div>
        {/if}
      </section>
      <section class="panel history">
        <p class="eyebrow">HISTORIQUE LOCAL</p><h2>Codes récents</h2>
        {#if missions.length === 0}<p>Aucun code créé.</p>{:else}
          <div class="mission-list">{#each missions as mission}
            <article><div><span>{MISSION_GAME_INFO[mission.game].label} · Portail : {mission.portalCode}</span><strong>{mission.gameCode}</strong></div><p>{mission.summary.join(' · ')}</p><small>{new Date(mission.createdAt).toLocaleString('fr-CH')}</small><button on:click={() => copyCode(mission.scope === 'portal' ? mission.portalCode : mission.gameCode)}>Copier</button></article>
          {/each}</div>
        {/if}
        <div class="results-heading"><p class="eyebrow">SUIVI</p><h2>Résultats récents</h2></div>
        {#if recentResults.length === 0}<p>Aucun résultat transmis.</p>{:else}
          <div class="result-list">{#each recentResults as result}
            <article><div><strong>{result.studentName}</strong><span>{result.world}</span></div><p>{result.mission}</p><b>{result.score}/{result.total}</b><small>{new Date(result.createdAt).toLocaleString('fr-CH')}</small></article>
          {/each}</div>
        {/if}
      </section>
    </div>
  {/if}
</main>

<style>
  :global(body){margin:0;background:#f2f5f8;color:#172033;font-family:Inter,system-ui,sans-serif}.teacher-page{min-height:100vh;padding:24px}.topbar{max-width:1240px;margin:0 auto 22px;display:flex;justify-content:space-between;align-items:center}.topbar h1{margin:0;font-size:clamp(1.6rem,4vw,2.5rem)}.eyebrow{margin:0 0 5px;color:#2458a6;font-size:.75rem;font-weight:900;letter-spacing:.13em}.top-actions{display:flex;gap:10px}.top-actions a,.top-actions button,.generated button,.mission-list button{border:1px solid #bac7d8;border-radius:9px;padding:10px 13px;background:white;color:#172033;text-decoration:none;cursor:pointer}.teacher-grid{max-width:1240px;margin:auto;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.75fr);gap:20px}.panel{max-width:720px;margin:50px auto;padding:clamp(20px,4vw,34px);border:1px solid #d5dde8;border-radius:18px;background:white;box-shadow:0 14px 40px #243b5a12}.teacher-grid .panel{max-width:none;margin:0}.panel h2{margin:4px 0 8px;font-size:1.5rem}.panel>p{line-height:1.6;color:#516078}.login-panel form{display:grid;gap:10px;margin-top:22px}.login-panel input,.form-grid input,.form-grid select,.game-select select{min-height:46px;padding:0 12px;border:1px solid #aebbd0;border-radius:9px;font:inherit}.game-select{display:grid;gap:6px;margin:18px 0;font-weight:800}.primary{min-height:48px;border:0;border-radius:9px;background:#2458a6;color:white;font-weight:800;cursor:pointer}.primary:disabled{opacity:.55}.message{padding:11px 13px;border-radius:9px;background:#edf4ff;color:#174e91!important}fieldset{margin:20px 0;padding:14px;border:1px solid #d6deea;border-radius:12px}legend{padding:0 7px;font-weight:800}.two-cols,.skills-grid,.tables-grid{display:grid;gap:8px}.two-cols{grid-template-columns:1fr 1fr}.skills-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tables-grid{grid-template-columns:repeat(6,1fr)}fieldset label{display:flex;align-items:center;gap:8px;min-height:42px;padding:8px;border:1px solid #d7dfeb;border-radius:8px;background:#f8fafc;cursor:pointer}fieldset label.chosen{border-color:#2458a6;background:#eaf2ff}.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.form-grid label{display:grid;gap:6px;font-weight:700}.form-grid .check-line{display:flex;align-items:center;padding-top:24px}.form-grid .check-line input{min-height:auto}.create{width:100%;margin-top:18px}.generated{margin-top:16px;padding:18px;border:2px solid #2458a6;border-radius:12px;background:#f1f6ff}.generated span{display:block;font-size:.7rem;font-weight:900;color:#2458a6}.generated strong{display:block;margin:6px 0;font:900 1.8rem ui-monospace,monospace;letter-spacing:.06em}.generated p{line-height:1.5}.mission-list,.result-list{display:grid;gap:10px}.mission-list article,.result-list article{padding:14px;border:1px solid #d8e0ea;border-radius:10px}.mission-list article>div,.result-list article>div{display:flex;justify-content:space-between;gap:10px}.mission-list span,.mission-list small,.result-list span,.result-list small{color:#68788e;font-size:.75rem}.mission-list strong{font-family:ui-monospace,monospace}.mission-list p,.result-list p{font-size:.88rem;line-height:1.5}.mission-list button{padding:7px 10px;margin-top:8px}.results-heading{margin-top:28px;padding-top:22px;border-top:1px solid #d8e0ea}.result-list article{display:grid;grid-template-columns:1fr auto;gap:4px 10px}.result-list article>div,.result-list article>p{grid-column:1/-1}.result-list b{color:#2458a6}code{padding:2px 5px;border-radius:4px;background:#edf1f5}@media(max-width:850px){.teacher-grid{grid-template-columns:1fr}.skills-grid{grid-template-columns:1fr}.tables-grid{grid-template-columns:repeat(4,1fr)}.form-grid{grid-template-columns:1fr}.topbar{align-items:flex-start;gap:15px;flex-direction:column}}@media(max-width:480px){.teacher-page{padding:14px}.two-cols{grid-template-columns:1fr}.top-actions{width:100%;flex-wrap:wrap}}
</style>
