<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getStudentName, submitActivityResult } from '$lib/client/activity';
  import MissionCodeTools from '$lib/missions/MissionCodeTools.svelte';
  import { normalizeCalculsConfiguration, type CalculsMissionConfiguration, type DecimalOperation } from '$lib/missions/calculs';

  type Phase = 'setup' | 'play' | 'done';
  type DecimalQuestion = { left: string; right: string; operation: '+' | '-'; answer: number; level: number };

  let studentName = 'Explorateur';
  let phase: Phase = 'setup';
  let activeLevels: number[] = [1];
  let operations: DecimalOperation[] = ['+', '-'];
  let questionCount = 10;
  let activeMissionId: string | null = null;
  let question = 1;
  let score = 0;
  let current: DecimalQuestion = { left: '12', right: '4.5', operation: '+', answer: 16.5, level: 1 };
  let answerInput = '';
  let feedback = '';
  let blocked = false;
  let sentMessage = '';
  let errorFamilies: string[] = [];
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let drawing = false;
  $: missionConfiguration = { schemaVersion: 1, activeLevels, operations, questionCount } satisfies CalculsMissionConfiguration;

  onMount(() => {
    studentName = getStudentName();
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  });

  function setupCanvas() {
    if (!canvas) return;
    const previous = document.createElement('canvas');
    previous.width = canvas.width;
    previous.height = canvas.height;
    previous.getContext('2d')?.drawImage(canvas, 0, 0);

    canvas.width = canvas.clientWidth;
    canvas.height = Math.max(300, canvas.clientHeight);
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.drawImage(previous, 0, 0);
  }

  function pointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: PointerEvent) {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    draw(event);
  }

  function stopDraw() {
    drawing = false;
    ctx?.beginPath();
  }

  function draw(event: PointerEvent) {
    if (!drawing || !ctx) return;
    event.preventDefault();
    const pos = pointerPosition(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function clearCanvas() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function startMission() {
    if (activeLevels.length === 0) {
      feedback = 'Activation impossible : choisis au moins un niveau.';
      return;
    }
    if (operations.length === 0) {
      feedback = 'Activation impossible : choisis au moins une opération.';
      return;
    }

    phase = 'play';
    question = 1;
    score = 0;
    errorFamilies = [];
    nextQuestion();
  }

  function decimal(min: number, max: number, digits: number): string {
    return (Math.random() * (max - min) + min).toFixed(digits);
  }

  function nextQuestion() {
    if (question > questionCount) {
      finishMission();
      return;
    }

    blocked = false;
    feedback = '';
    answerInput = '';
    const level = activeLevels[Math.floor(Math.random() * activeLevels.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let left = '0';
    let right = '0';

    if (level === 1) {
      left = Math.random() > 0.5 ? decimal(10, 60, 1) : Math.floor(Math.random() * 80 + 20).toString();
      right = Math.random() > 0.5 ? decimal(1, 20, 1) : Math.floor(Math.random() * 40 + 5).toString();
    } else if (level === 2) {
      left = decimal(10, 60, 1);
      right = decimal(5, 45, 1);
    } else {
      left = decimal(10, 60, 2);
      right = decimal(5, 45, 2);
    }

    if (operation === '-' && Number(left) < Number(right)) {
      [left, right] = [right, left];
    }

    const precision = level === 3 ? 2 : 1;
    const answer = operation === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
    current = { left, right, operation, answer: Number(answer.toFixed(precision)), level };
    clearCanvas();
  }

  function validateAnswer() {
    if (blocked || answerInput.trim() === '') return;
    const value = Number(answerInput.replace(',', '.'));
    if (!Number.isFinite(value)) return;

    blocked = true;
    if (Math.abs(value - current.answer) < 0.001) {
      score += 1;
      feedback = '⚡ Analyse correcte ! +1 alignement.';
    } else {
      errorFamilies = [...errorFamilies, `niveau ${current.level}`];
      feedback = `❌ Anomalie détectée. La cible était ${current.answer}.`;
    }

    question += 1;
    window.setTimeout(nextQuestion, 1700);
  }

  async function finishMission() {
    phase = 'done';
    const report = await submitActivityResult({
      studentName,
      world: 'calculs',
      mission: `Niveaux ${activeLevels.join(', ')}`,
      score,
      total: questionCount,
      scoreBasis: 'last',
      errorCount: questionCount - score,
      errorFamilies: Array.from(new Set(errorFamilies)),
      missionId: activeMissionId ?? undefined
    });
    sentMessage = report.message;
  }

  function applyMission(mission: { id: string; configuration: unknown }) {
    const configuration = normalizeCalculsConfiguration(mission.configuration);
    if (!configuration) return;
    activeLevels = [...configuration.activeLevels];
    operations = [...configuration.operations];
    questionCount = configuration.questionCount;
    activeMissionId = mission.id;
  }
</script>

<svelte:head>
  <title>Le Calcul Décimal — Classe Numérique</title>
</svelte:head>

<div class="dark-page page">
  <header class="dark-header">
    <div class="header-inner">
      <div class="brand"><span class="brand-icon">⚡</span><div><h1 class="brand-title">Noyau : Calcul Décimal</h1><p class="brand-subtitle">Agent : {studentName}</p></div></div>
      <a class="btn dark" href="{base}/">↩ QG</a>
    </div>
  </header>

  <main class="main split">
    <section class="stack">
      <MissionCodeTools game="calculs" configuration={missionConfiguration} onMission={applyMission} />
      {#if phase === 'setup'}
        <div class="dark-card stack">
          <h2>🛰️ Configuration des paramètres de vol</h2>
          <p class="muted">Sélectionne un ou plusieurs niveaux de difficulté.</p>
          {#each [1, 2, 3] as level}
            <label class="dark-option" class:selected={activeLevels.includes(level)}>
              <input type="checkbox" bind:group={activeLevels} value={level} />
              <strong>Niveau {level}</strong>
              <span class="muted small">
                {level === 1 ? 'Un nombre entier et un nombre à virgule.' : level === 2 ? 'Deux nombres à une décimale.' : 'Deux nombres à deux décimales.'}
              </span>
            </label>
          {/each}
          <fieldset class="stack"><legend>Opérations</legend>
            <label class="dark-option" class:selected={operations.includes('+')}><input type="checkbox" bind:group={operations} value="+" /> Addition</label>
            <label class="dark-option" class:selected={operations.includes('-')}><input type="checkbox" bind:group={operations} value="-" /> Soustraction</label>
          </fieldset>
          {#if feedback}<p class="feedback bad">{feedback}</p>{/if}
          <button class="btn primary" type="button" on:click={startMission}>Enclencher la propulsion 🚀</button>
        </div>
      {:else if phase === 'play'}
        <div class="dark-card stack">
          <div class="mission-top"><span class="badge">Question {Math.min(question, questionCount)} / {questionCount}</span><span class="badge">Score : {score}</span></div>
          <div class="center">
            <p class="kicker">Résous l’opération suivante</p>
            <div style="font-size: 2.7rem; font-weight: 1000; font-family: ui-monospace, monospace; background: #090d16; display: inline-block; padding: 1rem 2rem; border-radius: 1rem; border: 1px solid #25314a;">
              {current.left} {current.operation} {current.right}
            </div>
          </div>
          <label class="label" style="color: #cbd5e1; text-align: center;">
            Saisis ta réponse de précision
            <input class="dark-input" style="text-align: center; font-size: 1.7rem; font-weight: 1000;" bind:value={answerInput} on:keydown={(event) => event.key === 'Enter' && validateAnswer()} inputmode="decimal" placeholder="0.00" />
          </label>
          <button class="btn warn" disabled={blocked} type="button" on:click={validateAnswer}>Soumettre le calcul ⚔️</button>
          <p class:good={feedback.startsWith('⚡')} class:bad={!feedback.startsWith('⚡')} class="feedback">{feedback}</p>
        </div>
      {:else}
        <div class="dark-card stack center">
          <h2>🏁 Mission Terminée !</h2>
          <p class="muted">Votre rapport d’exactitude a été transmis à la console maître.</p>
          <p style="font-size: 3rem; font-weight: 1000; color: var(--amber);">{score} / {questionCount}</p>
          <p>{score >= 8 ? '🏆 Victoire éclatante ! Excellents calculs.' : '⚔️ Objectif incomplet. Poursuis l’entraînement.'}</p>
          <p class="muted small">{sentMessage}</p>
          <div class="actions" style="justify-content: center;"><button class="btn primary" type="button" on:click={startMission}>Rejouer</button><a class="btn dark" href="{base}/">Retour au QG</a></div>
        </div>
      {/if}
    </section>

    <aside class="stack">
      <div class="mission-top"><h3 class="kicker">📝 Ardoise tactique</h3><button class="btn dark" type="button" on:click={clearCanvas}>Effacer ×</button></div>
      <canvas bind:this={canvas} class="canvas-board" on:pointerdown={startDraw} on:pointerup={stopDraw} on:pointerleave={stopDraw} on:pointermove={draw}></canvas>
    </aside>
  </main>
</div>
