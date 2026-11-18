<script lang="ts">
  import { onMount } from 'svelte';
  import { createGameProgressService } from '$lib/orbis/persistence/game-services';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import { dailyMissionKey } from './gamification';
  import { awardConstruction, CONSTRUCTION_BADGES, EMPTY_CONSTRUCTION_PROGRESS, type ConstructionProgress } from './construction-progress';
  import { constructionTask, constructionTasksForLevel, dailyConstructionTask, evaluateConstruction, evaluateEdges, GRID_COLUMNS, GRID_ROWS, gridEdgeKey, sameGridPoint, type GridPoint } from './construction';
  import type { Level } from './types';

  export let studentName: string;
  export let level: Level;

  const points: GridPoint[] = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({ x: index % GRID_COLUMNS, y: Math.floor(index / GRID_COLUMNS) }));
  let activeLevel: Level = level;
  let activeStudentName = studentName;
  let progressLoadVersion = 0;
  let progressReady = false;
  let figureId = constructionTasksForLevel(level)[0].figureId;
  let progress: ConstructionProgress = { ...EMPTY_CONSTRUCTION_PROGRESS };
  let chosen: GridPoint[] = [];
  let drawnEdges: string[] = [];
  let firstEndpoint: number | null = null;
  let stage: 'vertices' | 'edges' | 'done' = 'vertices';
  let vertexAttempts = 0;
  let edgeAttempts = 0;
  let usedHint = false;
  let dailyActive = false;
  let reporting = false;
  let feedback = '';
  let reportMessage = '';
  let startedAt = Date.now();
  let errorFamilies: string[] = [];

  $: availableTasks = constructionTasksForLevel(level);
  $: task = constructionTask(figureId);
  $: dailyTask = dailyConstructionTask(level);
  $: expectedPoints = task.points.length - 1;
  $: drawnSegments = drawnEdges.map((key) => key.split('-').map(Number) as [number, number]);
  $: if (level !== activeLevel) {
    activeLevel = level;
    figureId = constructionTasksForLevel(level)[0].figureId;
    dailyActive = false;
    reset();
  }
  $: if (studentName !== activeStudentName) {
    activeStudentName = studentName;
    progress = { ...EMPTY_CONSTRUCTION_PROGRESS };
    reset();
    void loadProgress(studentName);
  }

  onMount(() => {
    void loadProgress(studentName);
  });

  async function loadProgress(name: string): Promise<void> {
    const version = ++progressLoadVersion;
    progressReady = false;
    try {
      const result = await createGameProgressService<ConstructionProgress>(name, 'geometrie-construction').loadProgress();
      if (version !== progressLoadVersion) return;
      if (!result.ok || !result.value) return;
      const saved = result.value.state;
      progress = {
        completedIds: Array.isArray(saved.completedIds) ? saved.completedIds.filter((id): id is string => typeof id === 'string') : [],
        bestAttempts: saved.bestAttempts && typeof saved.bestAttempts === 'object' ? saved.bestAttempts : {},
        xp: Number.isFinite(saved.xp) ? saved.xp : 0,
        badges: Array.isArray(saved.badges) ? saved.badges.filter((id): id is string => typeof id === 'string') : [],
        dailyKeys: Array.isArray(saved.dailyKeys) ? saved.dailyKeys.filter((id): id is string => typeof id === 'string') : []
      };
    } catch {
      reportMessage = 'La progression enregistrée est momentanément indisponible.';
    } finally {
      if (version === progressLoadVersion) progressReady = true;
    }
  }

  function reset(): void {
    chosen = [];
    drawnEdges = [];
    firstEndpoint = null;
    stage = 'vertices';
    vertexAttempts = 0;
    edgeAttempts = 0;
    usedHint = false;
    feedback = '';
    reportMessage = '';
    errorFamilies = [];
    startedAt = Date.now();
  }

  function chooseFigure(nextId: string): void {
    if (!availableTasks.some((item) => item.figureId === nextId)) return;
    figureId = nextId;
    dailyActive = false;
    reset();
  }

  function launchDaily(): void {
    figureId = dailyTask.figureId;
    dailyActive = true;
    reset();
  }

  function pointIndex(point: GridPoint): number {
    return task.points.findIndex((item) => sameGridPoint(item, point));
  }

  function handlePoint(point: GridPoint): void {
    if (stage === 'done' || reporting || !progressReady) return;
    if (stage === 'vertices') {
      if (sameGridPoint(point, task.points[0])) return;
      chosen = chosen.some((item) => sameGridPoint(item, point))
        ? chosen.filter((item) => !sameGridPoint(item, point))
        : chosen.length < expectedPoints ? [...chosen, point] : chosen;
      feedback = `${chosen.length} / ${expectedPoints} points placés. ${chosen.length === expectedPoints ? 'Vérifie les sommets.' : 'Touche un point choisi pour le retirer.'}`;
      return;
    }
    const index = pointIndex(point);
    if (index < 0) return;
    if (firstEndpoint === null) {
      firstEndpoint = index;
      feedback = `Sommet ${String.fromCharCode(65 + index)} choisi. Touche l’autre extrémité de l’arête.`;
      return;
    }
    if (index === firstEndpoint) { firstEndpoint = null; return; }
    const key = gridEdgeKey(firstEndpoint, index);
    drawnEdges = drawnEdges.includes(key)
      ? drawnEdges.filter((item) => item !== key)
      : drawnEdges.length < task.edges.length ? [...drawnEdges, key] : drawnEdges;
    firstEndpoint = null;
    feedback = `${drawnEdges.length} / ${task.edges.length} arêtes tracées. Touche à nouveau deux extrémités pour effacer une arête.`;
  }

  async function check(): Promise<void> {
    if (!progressReady || reporting || stage === 'done') return;
    if (stage === 'vertices') {
      if (chosen.length !== expectedPoints) return;
      vertexAttempts += 1;
      const result = evaluateConstruction(task, chosen);
      if (!result.correct) {
        errorFamilies = [...errorFamilies, `construction.${task.figureId}.sommets`];
        feedback = `${result.correctPoints} point${result.correctPoints > 1 ? 's' : ''} bien placé${result.correctPoints > 1 ? 's' : ''} sur ${expectedPoints}. Corrige les cases cochées, puis vérifie à nouveau.`;
        if (vertexAttempts >= 2) usedHint = true;
        return;
      }
      if (task.kind === 'solid') {
        stage = 'edges';
        feedback = 'Tous les sommets sont bien placés. Trace maintenant les arêtes du modèle : touche deux sommets par arête.';
        return;
      }
      await finish();
      return;
    }
    if (stage === 'edges') {
      if (drawnEdges.length !== task.edges.length) return;
      edgeAttempts += 1;
      const result = evaluateEdges(task, drawnEdges);
      if (!result.correct) {
        errorFamilies = [...errorFamilies, `construction.${task.figureId}.aretes`];
        feedback = `${result.correctEdges} arête${result.correctEdges > 1 ? 's' : ''} correcte${result.correctEdges > 1 ? 's' : ''} sur ${task.edges.length}. Compare avec le modèle, puis remplace les arêtes incorrectes.`;
        if (edgeAttempts >= 2) usedHint = true;
        return;
      }
      await finish();
    }
  }

  async function finish(): Promise<void> {
    stage = 'done';
    feedback = `Croquis terminé ! ${task.explanation}`;
    const attempts = vertexAttempts + edgeAttempts;
    const dailyKey = dailyActive ? dailyMissionKey() : '';
    progress = awardConstruction(progress, task.figureId, attempts, errorFamilies.length, usedHint, dailyKey);
    reporting = true;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    try {
      const saved = await createGameProgressService<ConstructionProgress>(studentName, 'geometrie-construction').saveProgress(progress, 1, { label: `Nexus : ${progress.completedIds.length} figures explorées`, completed: progress.completedIds.length, total: 19 });
      const submitted = await recordGameActivity({
          studentName, gameId: 'geometrie', activityId: `${level} croquis ${task.figureId}`,
          skillId: `geometrie.construction.${task.figureId}`, correctCount: task.kind === 'solid' ? 2 : 1, questionCount: task.kind === 'solid' ? 2 : 1,
          errorCount: errorFamilies.length, errorFamilies, hintsUsed: usedHint ? 1 : 0, durationSeconds,
          responseDetails: [
            { questionIndex: 0, questionId: `${task.figureId}-sommets`, skillId: `geometrie.construction.${task.figureId}`, category: 'Construction', prompt: task.instruction, response: chosen.map((point) => `(${point.x + 1},${point.y + 1})`).join(' ; '), expected: task.points.slice(1).map((point) => `(${point.x + 1},${point.y + 1})`).join(' ; '), correct: true, attempts: vertexAttempts, hintsUsed: usedHint ? 1 : 0 },
            ...(task.kind === 'solid' ? [{ questionIndex: 1, questionId: `${task.figureId}-aretes`, skillId: `geometrie.construction.${task.figureId}`, category: 'Vue de solide', prompt: 'Trace les arêtes visibles.', response: drawnEdges.join(' ; '), expected: task.edges.map(([a,b]) => gridEdgeKey(a,b)).join(' ; '), correct: true, attempts: edgeAttempts, hintsUsed: usedHint ? 1 : 0 }] : [])
          ],
          metadata: { figureId: task.figureId, constructionKind: task.kind, level, vertexAttempts, edgeAttempts, totalChecks: attempts, dailyChallenge: dailyActive, badges: progress.badges, xp: progress.xp }
        });
      reportMessage = [saved.ok ? '' : 'Progression locale indisponible.', submitted.message].filter(Boolean).join(' ');
    } catch {
      reportMessage = 'Croquis terminé. Le suivi ORBIS est momentanément indisponible.';
    } finally { reporting = false; }
  }
</script>

<section class="construction-lab" aria-labelledby="construction-title">
  <div class="lab-heading">
    <div><p class="eyebrow">ATELIER DES FIGURES · {level}</p><h3 id="construction-title">Construis et trace</h3></div>
    <div class="progress"><strong>{progress.completedIds.filter((id) => availableTasks.some((task) => task.figureId === id)).length}/{availableTasks.length}</strong><span>figures explorées · {progress.xp} XP</span></div>
  </div>
  <p class="intro">Choisis une figure, observe son modèle et reconstruis-la. Chaque case correspond à une position précise. L’ordre des clics ne compte pas.</p>
  {#if !progressReady}<p class="report" aria-live="polite">Chargement de ta progression…</p>{/if}
  <div class="chooser">
    <label for="construction-figure">Figure à construire</label>
    <select id="construction-figure" value={figureId} disabled={!progressReady} on:change={(event) => chooseFigure(event.currentTarget.value)}>
      {#each availableTasks as choice}<option value={choice.figureId}>{progress.completedIds.includes(choice.figureId) ? '✓ ' : ''}{choice.title}</option>{/each}
    </select>
    <button type="button" disabled={!progressReady} on:click={launchDaily}>Défi croquis du jour : {dailyTask.title}</button>
  </div>
  {#if progress.badges.length}
    <div class="badges" aria-label="Badges de construction">{#each progress.badges as badge}<span title={CONSTRUCTION_BADGES[badge]?.description ?? badge}>✦ {CONSTRUCTION_BADGES[badge]?.title ?? badge}</span>{/each}</div>
  {/if}

  <h4>{task.title}{dailyActive ? ' · défi du jour' : ''}</h4>
  <p class="instruction">{task.instruction}</p>
  {#if task.figureId === 'tri_equilateral'}<p class="precision">Le modèle sur grille est un croquis : les côtés ne sont pas mesurés exactement.</p>{/if}
  <div class="work-area">
    <div class="model-wrap">
      <strong>Modèle à observer</strong>
      <svg class="model" viewBox="0 0 600 600" role="img" aria-label={`Modèle de ${task.title}`}>
        {#each [0,1,2,3,4,5] as index}<line class="grid-line" x1={50 + index * 100} y1="0" x2={50 + index * 100} y2="600" /><line class="grid-line" x1="0" y1={50 + index * 100} x2="600" y2={50 + index * 100} />{/each}
        {#if task.kind === 'circle'}<circle class="figure-line" cx={50 + task.points[0].x * 100} cy={50 + task.points[0].y * 100} r={Math.abs(task.points[1].x - task.points[0].x) * 100} />{/if}
        {#each task.edges as [a,b]}<line class="figure-line" x1={50 + task.points[a].x * 100} y1={50 + task.points[a].y * 100} x2={50 + task.points[b].x * 100} y2={50 + task.points[b].y * 100} />{/each}
        {#each task.points as point, index}<circle class="vertex-dot" cx={50 + point.x * 100} cy={50 + point.y * 100} r="16" /><text x={66 + point.x * 100} y={42 + point.y * 100}>{String.fromCharCode(65 + index)}</text>{/each}
      </svg>
    </div>
    <div class="grid-wrap">
      <strong>{stage === 'edges' ? `Trace les arêtes · ${drawnEdges.length}/${task.edges.length}` : stage === 'done' ? 'Ton croquis terminé' : `Place les points · ${chosen.length}/${expectedPoints}`}</strong>
      <div class="point-grid" role="group" aria-label="Grille de construction, 6 colonnes et 6 lignes">
        <svg class="drawing" viewBox="0 0 600 600" aria-hidden="true" preserveAspectRatio="none">
          {#if stage === 'done' && task.kind === 'circle'}<circle class="figure-line" cx={50 + task.points[0].x * 100} cy={50 + task.points[0].y * 100} r={Math.abs(task.points[1].x - task.points[0].x) * 100} />{/if}
          {#if stage === 'done' && task.kind === 'plane'}{#each task.edges as [a,b]}<line class="figure-line" x1={50 + task.points[a].x * 100} y1={50 + task.points[a].y * 100} x2={50 + task.points[b].x * 100} y2={50 + task.points[b].y * 100} />{/each}{/if}
          {#if stage === 'edges' || stage === 'done'}{#each drawnSegments as [a,b]}<line class="figure-line" x1={50 + task.points[a].x * 100} y1={50 + task.points[a].y * 100} x2={50 + task.points[b].x * 100} y2={50 + task.points[b].y * 100} />{/each}{/if}
        </svg>
        {#each points as point}
          {@const anchor = sameGridPoint(point, task.points[0])}
          {@const index = task.points.findIndex((item) => sameGridPoint(item, point))}
          {@const marked = chosen.some((item) => sameGridPoint(item, point))}
          <button type="button" class:anchor class:marked class:endpoint={stage === 'edges' && firstEndpoint === index}
            aria-label={`Ligne ${point.y + 1}, colonne ${point.x + 1}${anchor ? ', point A déjà placé' : marked ? `, point ${String.fromCharCode(65 + index)} placé${stage === 'edges' && firstEndpoint === index ? ', première extrémité choisie' : ''}` : ''}`}
            aria-pressed={stage === 'edges' ? firstEndpoint === index : anchor || marked}
            disabled={!progressReady || stage === 'done' || reporting || (stage === 'vertices' ? anchor || (chosen.length === expectedPoints && !marked) : index < 0)}
            on:click={() => handlePoint(point)}>{anchor ? 'A' : (stage !== 'vertices' && index >= 0) ? String.fromCharCode(65 + index) : marked ? '✓' : '·'}</button>
        {/each}
      </div>
    </div>
  </div>
  {#if stage === 'edges'}<p class="help">Pour tracer une arête, touche deux sommets. Pour l’effacer, touche les mêmes deux sommets. Copie uniquement les arêtes dessinées sur le modèle.</p>{:else if stage === 'vertices'}<p class="help">A est déjà placé. Touche les autres cases indiquées par le modèle ; touche une case cochée pour la retirer.</p>{/if}
  {#if usedHint}<p class="clue"><strong>Indice :</strong> {task.clue}</p>{/if}
  {#if feedback}<p class:success={stage === 'done'} class="feedback" aria-live="polite">{feedback}</p>{/if}
  {#if reporting || reportMessage}<p class="report" aria-live="polite">{reporting ? 'Enregistrement dans ORBIS…' : reportMessage}</p>{/if}
  <div class="actions">
    <button class="check" type="button" disabled={!progressReady || reporting || stage === 'done' || (stage === 'vertices' ? chosen.length !== expectedPoints : drawnEdges.length !== task.edges.length)} on:click={() => void check()}>{stage === 'edges' ? 'Vérifier les arêtes' : 'Vérifier les sommets'}</button>
    {#if !usedHint && stage !== 'done'}<button type="button" disabled={!progressReady} on:click={() => (usedHint = true)}>Voir un indice</button>{/if}
    <button type="button" disabled={!progressReady} on:click={reset}>{stage === 'done' ? 'Recommencer' : 'Effacer mon croquis'}</button>
  </div>
</section>

<style>
  .construction-lab{margin-top:1.5rem;border:1px solid #39546a;border-radius:1rem;padding:1.2rem;background:#142334;color:#eaf2fb}
  h3{margin:.2rem 0;font-size:1.4rem}h4{margin:1.2rem 0 .35rem;font-size:1.15rem}p{line-height:1.5}.intro,.instruction,.help,.precision{max-width:70ch}.help,.precision{color:#d5e4f1}
  .lab-heading{display:flex;justify-content:space-between;align-items:start;gap:1rem}.progress{text-align:right;display:grid;gap:.15rem}.progress strong{color:#8af0c0;font-size:1.5rem}.progress span{font-size:.8rem;color:#b9cede}
  .chooser{display:flex;align-items:end;flex-wrap:wrap;gap:.7rem;margin:1rem 0}.chooser label{font-weight:700}.chooser select{display:block;min-height:44px;max-width:100%;padding:.5rem;border:1px solid #8dacbf;border-radius:.5rem;background:#1d344b;color:white;font:inherit}.chooser button{min-height:44px}
  .badges{display:flex;flex-wrap:wrap;gap:.4rem}.badges span{border:1px solid #aa8d4c;border-radius:999px;padding:.3rem .55rem;background:#54401c;color:#ffe8a1;font-size:.82rem;font-weight:700}
  .work-area{display:grid;grid-template-columns:minmax(190px,270px) minmax(280px,390px);gap:1.5rem;align-items:start}.model-wrap,.grid-wrap{display:grid;gap:.5rem}.model-wrap strong,.grid-wrap strong{color:#dcecf7}
  .model{width:min(100%,240px);aspect-ratio:1;border:1px solid #54718a;border-radius:.7rem;background:#1a3044}.model .grid-line{stroke:#415a6f;stroke-width:2}.figure-line{stroke:#60e3dc;stroke-width:9;stroke-linecap:round;fill:none}.vertex-dot{fill:#ffe6a7}.model text{fill:white;font-size:32px;font-weight:800}
  .point-grid{position:relative;display:grid;grid-template-columns:repeat(6,minmax(44px,1fr));gap:.25rem;width:min(100%,390px)}.drawing{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}.point-grid button{position:relative;z-index:1;min-width:44px;min-height:44px;aspect-ratio:1;border:2px solid #7d9bb3;border-radius:.5rem;background:#1d344b;color:#eaf2fb;font:inherit;font-size:1.2rem;font-weight:800;cursor:pointer;touch-action:manipulation}.point-grid button:not(:disabled):hover{background:#31576a;border-color:#54d8d5}.point-grid button.marked{background:#12575b;border-color:#54d8d5}.point-grid button.anchor{background:#68451c;border-color:#f3b64c}.point-grid button.endpoint{outline:3px solid #ffe6a7;outline-offset:2px}.point-grid button:disabled:not(.anchor,.marked){opacity:.65}
  .clue,.feedback{max-width:70ch;border-left:3px solid #f3b64c;padding:.55rem .7rem;background:#263647}.feedback.success{border-color:#8af0c0}.report{color:#d5e4f1;font-size:.9rem}.actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}.actions button,.chooser button{border:1px solid #54d8d5;border-radius:.6rem;padding:.55rem .8rem;background:transparent;color:#d7f8f7;font:inherit;font-weight:700;cursor:pointer}.actions .check{background:#177c80;color:white}.actions button:disabled{opacity:.5;cursor:not-allowed}.point-grid button:focus-visible,.actions button:focus-visible,.chooser select:focus-visible,.chooser button:focus-visible{outline:3px solid #f3b64c;outline-offset:3px}
  @media(max-width:760px){.work-area{grid-template-columns:1fr;gap:1rem}.lab-heading{flex-direction:column}.progress{text-align:left}.construction-lab{padding:.85rem}}
  @media(max-width:400px){.point-grid{gap:1px}}
</style>
