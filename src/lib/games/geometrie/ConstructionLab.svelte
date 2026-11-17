<script lang="ts">
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import { constructionTask, evaluateConstruction, GRID_COLUMNS, GRID_ROWS, sameGridPoint, type GridPoint } from './construction';
  import type { Level } from './types';

  export let studentName: string;
  export let level: Level;

  const points: GridPoint[] = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({ x: index % GRID_COLUMNS, y: Math.floor(index / GRID_COLUMNS) }));
  let activeLevel: Level = level;
  let chosen: GridPoint[] = [];
  let attempts = 0;
  let completed = false;
  let showClue = false;
  let checking = false;
  let feedback = '';
  let reportMessage = '';
  $: task = constructionTask(level);
  $: if (level !== activeLevel) {
    activeLevel = level;
    reset();
  }

  function selected(point: GridPoint): boolean {
    return chosen.some((item) => sameGridPoint(item, point));
  }

  function togglePoint(point: GridPoint): void {
    if (completed || checking || sameGridPoint(point, task.anchor)) return;
    chosen = selected(point)
      ? chosen.filter((item) => !sameGridPoint(item, point))
      : chosen.length < 3 ? [...chosen, point] : chosen;
    feedback = chosen.length === 3
      ? 'Trois sommets choisis. Appuie sur « Vérifier ma figure ».'
      : `${chosen.length} sommet${chosen.length > 1 ? 's' : ''} choisi${chosen.length > 1 ? 's' : ''} sur 3. Tu peux toucher une case choisie pour l’enlever.`;
  }

  async function checkAnswer(): Promise<void> {
    if (chosen.length !== 3 || completed || checking) return;
    attempts += 1;
    const result = evaluateConstruction(task, chosen);
    if (!result.correct) {
      feedback = `${result.correctPoints} sommet${result.correctPoints > 1 ? 's' : ''} bien placé${result.correctPoints > 1 ? 's' : ''} sur 3. Touche une case choisie pour la retirer, puis essaie encore.`;
      if (attempts >= 2) showClue = true;
      return;
    }
    completed = true;
    feedback = `Figure correcte ! ${task.explanation}`;
    checking = true;
    try {
      const submission = await recordGameActivity({
        studentName, gameId: 'geometrie', activityId: `${level} construction ${task.id}`,
        skillId: 'geometrie.construction', correctCount: 1, questionCount: 1, errorCount: attempts - 1,
        errorFamilies: [],
        responseDetails: [{ questionIndex: 0, prompt: task.instruction, response: chosen.map((point) => `(${point.x + 1},${point.y + 1})`).join(' ; '), expected: task.answer.map((point) => `(${point.x + 1},${point.y + 1})`).join(' ; '), correct: true, attempts, hintsUsed: showClue ? 1 : 0 }],
        metadata: { level, attempts, activity: task.id }
      });
      reportMessage = submission.message;
    } catch {
      reportMessage = 'Figure réussie. Le suivi ORBIS est momentanément indisponible.';
    } finally {
      checking = false;
    }
  }

  function reset(): void {
    chosen = [];
    attempts = 0;
    completed = false;
    showClue = false;
    feedback = '';
    reportMessage = '';
  }
</script>

<section class="construction-lab" aria-labelledby="construction-title">
  <p class="eyebrow">ATELIER DE CONSTRUCTION · {level}</p>
  <h3 id="construction-title">{task.title}</h3>
  <p class="instruction">{task.instruction}</p>
  <p class="grid-help">Chaque case représente un sommet possible. <strong>A est déjà placé.</strong> Avancer de 1 case signifie toucher la case voisine. Choisis exactement trois autres cases, dans l’ordre que tu veux.</p>

  <div class="point-grid" role="group" aria-label="Grille de construction, 5 colonnes et 4 lignes">
    {#each points as point}
      {@const anchor = sameGridPoint(point, task.anchor)}
      <button
        type="button"
        class:anchor
        class:selected={chosen.some((item) => sameGridPoint(item, point))}
        class:solution={completed && task.answer.some((answer) => sameGridPoint(answer, point))}
        aria-label={`Ligne ${point.y + 1}, colonne ${point.x + 1}${anchor ? ', sommet A déjà placé' : chosen.some((item) => sameGridPoint(item, point)) ? ', sommet choisi' : ''}`}
        aria-pressed={anchor || chosen.some((item) => sameGridPoint(item, point))}
        disabled={anchor || completed || checking || (chosen.length === 3 && !chosen.some((item) => sameGridPoint(item, point)))}
        on:click={() => togglePoint(point)}
      >{anchor ? 'A' : chosen.some((item) => sameGridPoint(item, point)) ? '✓' : '·'}</button>
    {/each}
  </div>

  <p class="selection-count" aria-live="polite">{chosen.length} / 3 sommets choisis</p>
  {#if showClue}<p class="clue"><strong>Indice :</strong> {task.clue}</p>{/if}
  {#if feedback}<p class:success={completed} class="feedback" aria-live="polite">{feedback}</p>{/if}
  {#if checking || reportMessage}<p class="report" aria-live="polite">{checking ? 'Enregistrement dans ORBIS…' : reportMessage}</p>{/if}
  <div class="actions">
    <button class="check" type="button" disabled={chosen.length !== 3 || completed || checking} on:click={checkAnswer}>Vérifier ma figure</button>
    {#if !showClue && !completed}<button class="reset" type="button" on:click={() => (showClue = true)}>Voir un indice</button>{/if}
    <button class="reset" type="button" on:click={reset}>{completed ? 'Recommencer une construction' : 'Effacer mes choix'}</button>
  </div>
</section>

<style>
  .construction-lab { margin-top: 1.5rem; border: 1px solid #39546a; border-radius: 1rem; padding: 1.2rem; background: #142334; color: #eaf2fb; }
  h3 { margin: .2rem 0 .5rem; font-size: 1.3rem; }
  p { line-height: 1.5; }
  .instruction { max-width: 60ch; font-size: 1.02rem; }
  .grid-help { max-width: 60ch; color: #d5e4f1; }
  .point-grid { display: grid; grid-template-columns: repeat(5, minmax(44px, 1fr)); gap: .45rem; width: min(100%, 360px); margin: 1rem 0 .55rem; }
  .point-grid button { min-width: 44px; min-height: 52px; border: 2px solid #7d9bb3; border-radius: .55rem; background: #1d344b; color: #eaf2fb; font: inherit; font-size: 1.4rem; font-weight: 800; cursor: pointer; touch-action: manipulation; }
  .point-grid button:not(:disabled):hover { border-color: #54d8d5; background: #31576a; }
  .point-grid button.selected, .point-grid button.solution { border-color: #54d8d5; background: #12575b; color: white; }
  .point-grid button.anchor { border-color: #f3b64c; background: #68451c; color: white; }
  .point-grid button:focus-visible, .actions button:focus-visible { outline: 3px solid #f3b64c; outline-offset: 3px; }
  .point-grid button:disabled:not(.anchor, .selected, .solution) { opacity: .6; cursor: default; }
  .selection-count { margin: 0 0 .65rem; font-weight: 700; }
  .feedback, .clue { max-width: 60ch; border-left: 3px solid #f3b64c; padding: .5rem .7rem; background: #263647; }
  .feedback.success { border-color: #8af0c0; }
  .report { color: #d5e4f1; font-size: .9rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: .8rem; }
  .actions button { min-height: 44px; border: 1px solid #54d8d5; border-radius: .6rem; padding: .55rem .8rem; font: inherit; font-weight: 700; cursor: pointer; }
  .check { background: #177c80; color: white; }
  .reset { background: transparent; color: #d7f8f7; }
  .actions button:disabled { opacity: .5; cursor: not-allowed; }
  @media (max-width: 400px) { .construction-lab { padding: .85rem; } .point-grid { gap: .3rem; } }
</style>
