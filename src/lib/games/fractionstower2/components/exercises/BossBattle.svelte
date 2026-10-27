<script lang="ts">
/**
   * Combat de boss de FractionTower2.
   * Réutilise les mêmes types d'exercices, interactions et règles de réponse
   * que TrainingSession, avec 18 questions, trois phases et les vies existantes.
   */
  import { AudioManager } from '$lib/games/fractionstower2/audio/AudioManager';
  import FractionBar from '$lib/games/fractionstower2/components/fraction/FractionBar.svelte';
  import VisualFractionModel from '$lib/games/fractionstower2/components/fraction/VisualFractionModel.svelte';
  import { ExerciseGenerator, type Exercise } from '$lib/games/fractionstower2/engines/ExerciseGenerator';
let {
  floorId = 'floor-1',
  onComplete,
  onClose,
  game
}: {
  floorId?: string;
  onComplete: (score?: number) => void;
  onClose?: () => void;
  game?: {
    markBossDefeated?: (floorId: string) => void;
  };
} = $props();
let activeFloor = $derived(String(floorId).startsWith('floor-') ? floorId : `floor-${floorId}`);
const QUESTIONS_PER_PHASE = 6;
const TOTAL_PHASES = 3;
const TOTAL_QUESTIONS = QUESTIONS_PER_PHASE * TOTAL_PHASES;
const MAX_BOSS_LIVES = TOTAL_QUESTIONS;
const MAX_PLAYER_LIVES = 5;
let phase = $state(1);
let questionIndex = $state(0);
let score = $state(0);
let bossLives = $state(MAX_BOSS_LIVES);
let playerLives = $state(MAX_PLAYER_LIVES);
let answer = $state('');
let feedback = $state('');
let locked = $state(false);
let questions = $state<Exercise[]>([]);
let lastLoadedFloorId = '';
// Le bilan de l'étage 5 privilégie les étages récents dans les révisions.
// Le bilan de l'étage 8 révise les étages 5 à 7. L'étage 9 porte uniquement
// sur son propre contenu. Les autres boss utilisent leur étage uniquement.
function getQuestionPlan(bossFloor: string): Array<{ floor: number; count: number }> {
const number = Number.parseInt(bossFloor.match(/(\d+)/)?.[1] ?? '1', 10);
    if (number === 5) {
      return [
        { floor: 1, count: 1 },
        { floor: 2, count: 1 },
        { floor: 3, count: 2 },
        { floor: 4, count: 2 },
        { floor: 5, count: 12 }
      ];
    }
    if (number === 8) {
      return [
        { floor: 5, count: 2 },
        { floor: 6, count: 2 },
        { floor: 7, count: 2 },
        { floor: 8, count: 12 }
      ];
    }
    if (number === 9) return [{ floor: 9, count: TOTAL_QUESTIONS }];
    return [{ floor: Number.isFinite(number) ? Math.min(9, Math.max(1, number)) : 1, count: TOTAL_QUESTIONS }];
  }
function questionSignature(exercise: Exercise): string {
    return `${exercise.question.trim().toLowerCase().replace(/\s+/g, ' ')}|${exercise.correctAnswer.trim().toLowerCase()}`;
  }
/** Génère des variantes jusqu'à obtenir le nombre demandé sans doublons exacts. */
function collectUniqueExercises(
    floorNumber: number,
    requestedCount: number,
    usedQuestions: Set<string>
  ): Exercise[] {
const selected: Exercise[] = [];
const floor = `floor-${floorNumber}`;
    for (let attempt = 0; attempt < 20 && selected.length < requestedCount; attempt++) {
const remaining = requestedCount - selected.length;
const batchCount = Math.min(30, Math.max(12, remaining * 3));
const candidates = ExerciseGenerator.generateSession(floor, batchCount);
      for (const candidate of candidates) {
const signature = questionSignature(candidate);
        if (usedQuestions.has(signature)) continue;
        usedQuestions.add(signature);
        selected.push({ ...candidate, id: `boss-${floorNumber}-${selected.length + 1}-${candidate.id}` });
        if (selected.length >= requestedCount) break;
      }
    }
    return selected;
  }
function buildBossQuestions(bossFloor: string): Exercise[] {
const usedQuestions = new Set<string>();
const result: Exercise[] = [];
    for (const item of getQuestionPlan(bossFloor)) {
      result.push(...collectUniqueExercises(item.floor, item.count, usedQuestions));
    }
// Les banques actuelles sont assez grandes pour fournir 18 questions uniques.
// Si un futur étage n'en contient plus assez, on garde le combat jouable en
// complétant avec de nouvelles variantes de l'étage concerné.
    if (result.length < TOTAL_QUESTIONS) {
const fallbackFloor = Number.parseInt(bossFloor.match(/(\d+)/)?.[1] ?? '1', 10);
      result.push(...collectUniqueExercises(fallbackFloor, TOTAL_QUESTIONS - result.length, usedQuestions));
    }
    return result.slice(0, TOTAL_QUESTIONS).map((exercise, index) => ({
      ...exercise,
      id: `${bossFloor}-boss-question-${index + 1}`
    }));
  }
let activeQuestionIndex = $derived((phase - 1) * QUESTIONS_PER_PHASE + questionIndex);
let currentExercise = $derived(questions[activeQuestionIndex] ?? {
    id: 'loading',
    question: 'Préparation des exercices…',
    correctAnswer: '',
    type: 'input' as const,
    hint: ''
  });
let phaseTitle = $derived(phase === 1 ? 'Révisions et bases' : phase === 2 ? 'Application' : 'Raisonnement');
// Recharge le combat si le composant reçoit un autre étage.
  $effect(() => {
const requestedFloor = activeFloor;
    if (requestedFloor && requestedFloor !== lastLoadedFloorId) {
      lastLoadedFloorId = requestedFloor;
      restartBoss(requestedFloor);
    }
  });
function restartBoss(bossFloor: string = activeFloor) {
    questions = buildBossQuestions(bossFloor);
    phase = 1;
    questionIndex = 0;
    score = 0;
    bossLives = MAX_BOSS_LIVES;
    playerLives = MAX_PLAYER_LIVES;
    answer = '';
    feedback = '';
    locked = false;
  }
function normalizeAnswer(value: string): string {
const cleaned = value.trim().toLowerCase().replace(/\s+/g, '');
    if (/^-?\d+[.,]\d+$/.test(cleaned)) return cleaned.replace('.', ',');
    return cleaned;
  }
function fractionParts(value: string): { numerator: number; denominator: number } | null {
const match = value.match(/^(-?\d+)\/(-?\d+)$/);
    if (!match) return null;
const numerator = Number.parseInt(match[1], 10);
const denominator = Number.parseInt(match[2], 10);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return { numerator, denominator };
  }
// Même politique de correction que TrainingSession : format exact si demandé,
// sinon fractions équivalentes acceptées pour les réponses saisies.
function answersMatch(userValue: string, correctValue: string): boolean {
const normalizedUser = normalizeAnswer(userValue);
const normalizedCorrect = normalizeAnswer(correctValue);
    if (normalizedUser === normalizedCorrect) return true;
const decimalPattern = /^-?\d+[,.]\d+$/;
    if (decimalPattern.test(userValue.trim()) && decimalPattern.test(correctValue.trim())) {
const userDecimal = Number(userValue.trim().replace(',', '.'));
const correctDecimal = Number(correctValue.trim().replace(',', '.'));
      if (Number.isFinite(userDecimal) && Number.isFinite(correctDecimal) && Math.abs(userDecimal - correctDecimal) < 1e-10) return true;
    }
    if (currentExercise.answerMode === 'exact' || currentExercise.type !== 'input') return false;
const userFraction = fractionParts(normalizedUser);
const correctFraction = fractionParts(normalizedCorrect);
    if (userFraction && correctFraction) {
      return userFraction.numerator * correctFraction.denominator ===
        correctFraction.numerator * userFraction.denominator;
    }
    return false;
  }
function submit(value?: string) {
    if (locked || phase >= 4) return;
    if (value !== undefined) answer = value;
const submitted = value ?? answer;
const effectiveAnswer = submitted;
    if (!effectiveAnswer.trim()) {
      feedback = currentExercise.type === 'number_line'
        ? 'Choisis d’abord une graduation sur la droite.'
        : currentExercise.type === 'color_interactive'
          ? 'Clique sur une case pour commencer à colorier.'
          : currentExercise.type === 'visual_select'
            ? 'Sélectionne au moins une image, puis vérifie.'
          : 'Écris ou sélectionne une réponse avant de vérifier.';
      return;
    }
    if (!answersMatch(effectiveAnswer, currentExercise.correctAnswer)) {
      playerLives = Math.max(0, playerLives - 1);
      feedback = playerLives === 0
        ? 'Tu n’as plus de vies. Le boss a gagné cette fois.'
        : `Pas tout à fait. Tu perds une vie. Il t’en reste ${playerLives}. Piste : ${currentExercise.hint || 'Relis les informations utiles et vérifie ta méthode.'}`;
      if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('error');
      if (playerLives === 0) phase = 5;
      return;
    }
    locked = true;
    score += 1;
    bossLives = Math.max(0, bossLives - 1);
    feedback = 'Bravo ! C’est juste.';
    if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('success');
    setTimeout(() => {
      if (questionIndex < QUESTIONS_PER_PHASE - 1) {
        questionIndex += 1;
      } else if (phase < TOTAL_PHASES) {
        phase += 1;
        questionIndex = 0;
      } else {
        phase = 4;
      }
      answer = '';
      feedback = '';
      locked = false;
    }, 900);
  }
function appendToInput(char: string) {
    if (locked) return;
    if (char === '⌫') answer = answer.slice(0, -1);
    else if (char === 'Effacer') answer = '';
    else answer += char;
  }
function selectNumberLineTick(tick: number) {
    if (locked) return;
const total = currentExercise.interactiveData?.totalParts ?? 1;
    answer = `${tick}/${total}`;
    feedback = '';
  }
/** Sélection multiple des dessins qui répondent à la fraction demandée. */
function toggleVisualOption(index: number) {
    if (locked) return;
const selected = new Set(answer ? answer.split(',').map(Number) : []);
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    answer = [...selected].sort((a, b) => a - b).join(',');
    feedback = '';
}
function readInstruction() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
const utterance = new SpeechSynthesisUtterance(currentExercise.question);
    utterance.lang = 'fr-CH';
    window.speechSynthesis.speak(utterance);
  }
function finishBoss() {
    game?.markBossDefeated?.(activeFloor);
    onComplete(score);
  }
</script>
<div class="boss-overlay" role="presentation">
  <div class="boss-container" role="dialog" aria-modal="true" aria-label="Combat de Boss">
    <header class="boss-header">
      <div>
        <p class="eyebrow">Défi final · {activeFloor.toUpperCase()}</p>
        <h2>Boss de l’étage {activeFloor.replace('floor-', '')}</h2>
        {#if phase < 4}
          <p class="player-lives" aria-label={`Vies restantes : ${playerLives}`}>
            Tes vies :
            {#each Array(playerLives) as _}<span>❤️</span>{/each}
            {#each Array(MAX_PLAYER_LIVES - playerLives) as _}<span class="empty-heart">♡</span>{/each}
          </p>
        {/if}
      </div>
      <div class="header-actions">
        {#if phase < 4}
          <div class="score">Phase {phase}/{TOTAL_PHASES} · Q {questionIndex + 1}/{QUESTIONS_PER_PHASE}</div>
        {:else if phase === 4}
          <div class="score">Boss vaincu</div>
        {:else}
          <div class="score">Combat terminé</div>
        {/if}
        <button class="close-btn" onclick={() => onClose?.()} aria-label="Fermer le combat" title="Fermer (Échap)">✕</button>
      </div>
    </header>
    {#if phase < 4}
      <div class="boss-lives-line">
        <span>Vies du boss : ❤️ {bossLives}/{MAX_BOSS_LIVES}</span>
        <span>Progression : {score}/{TOTAL_QUESTIONS}</span>
      </div>
      <div class="progress-track" aria-label={`Vies restantes du boss : ${bossLives} sur ${MAX_BOSS_LIVES}`}>
        <div class="progress-fill" style={`width: ${(bossLives / MAX_BOSS_LIVES) * 100}%`}></div>
      </div>
      {#if questions.length > 0}
        <div class="boss-body">
          <div class="phase-title">
            <h3>Phase {phase} — {phaseTitle}</h3>
            <button class="audio-btn" onclick={readInstruction} aria-label="Lire la consigne" title="Écouter">🔊</button>
          </div>
          <p class="question-text">{currentExercise.question}</p>
          {#if currentExercise.type === 'qcm' || currentExercise.type === 'comparison'}
            <div class="options-grid">
              {#each currentExercise.options ?? [] as option}
                <button
                  type="button"
                  class="option-btn"
                  class:selected={answer === option}
                  onclick={() => submit(option)}
                  disabled={locked}
                >{option}</button>
              {/each}
            </div>
          {/if}
          {#if currentExercise.type === 'input' || (currentExercise.type === 'number_line' && !currentExercise.interactiveData?.totalParts)}
            <div class="input-section">
              <label class="sr-only" for="boss-answer">Ta réponse</label>
              <input
                id="boss-answer"
                type="text"
                inputmode="none"
                readonly
                bind:value={answer}
                placeholder="Ta réponse…"
                autocomplete="off"
                onkeydown={(event) => event.key === 'Enter' && submit()}
                disabled={locked}
              />
              <div class="virtual-keypad" aria-label="Pavé numérique">
                {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '/', ',', '.', '⌫', 'Effacer'] as key}
                  <button
                    type="button"
                    class="key-btn {key === 'Effacer' ? 'clear-key' : ''}"
                    onclick={() => appendToInput(key)}
                    disabled={locked}
                    aria-label={key === '⌫' ? 'Effacer le dernier caractère' : key === 'Effacer' ? 'Effacer toute la réponse' : key}
                  >{key}</button>
                {/each}
              </div>
            </div>
          {/if}
          {#if currentExercise.type === 'number_line' && currentExercise.interactiveData?.totalParts}
            {@const totalParts = currentExercise.interactiveData?.totalParts ?? 1}
            <section class="interactive-box number-line-box">
              <p class="instruction-mini">Clique sur la graduation qui correspond à la fraction.</p>
              <div class="number-line-scroll">
                <div class="number-line-visual" style={`min-width: ${Math.max(360, totalParts * 44)}px`}>
                  <div class="number-line-track"></div>
                  {#each Array(totalParts + 1) as _, tick}
                    <button
                      type="button"
                      class="number-line-tick"
                      class:selected={answer === `${tick}/${totalParts}`}
                      style={`left: ${(tick / totalParts) * 100}%`}
                      onclick={() => selectNumberLineTick(tick)}
                      disabled={locked}
                      aria-label={tick === 0 ? 'Zéro' : tick === totalParts ? 'Un' : `Graduation ${tick} sur ${totalParts}`}
                      aria-pressed={answer === `${tick}/${totalParts}`}
                    >
                      <span class="tick-mark"></span>
                      {#if tick === 0}<span class="tick-label endpoint">0</span>{:else if tick === totalParts}<span class="tick-label endpoint">1</span>{/if}
                    </button>
                  {/each}
                </div>
              </div>
            </section>
          {/if}
          {#if currentExercise.type === 'color_interactive'}
            {@const totalParts = currentExercise.interactiveData?.totalParts ?? 4}
            {@const coloredCount = answer ? Number.parseInt(answer.split('/')[0], 10) || 0 : 0}
            <section class="interactive-box">
              <p class="instruction-mini">Clique sur une case pour régler le nombre de parts coloriées.</p>
              <div class="visual-bar-wrapper clickable" role="group" aria-label="Choisir le nombre de parts coloriées">
                {#each Array(totalParts) as _, i}
                  <button
                    type="button"
                    class="bar-segment-interactive {i < coloredCount ? 'colored' : 'empty'}"
                    onclick={() => {
                      if (locked) return;
const nextCount = coloredCount === i + 1 ? i : i + 1;
                      answer = `${nextCount}/${totalParts}`;
                      feedback = '';
                    }}
                    disabled={locked}
                    aria-label={`Colorier ${i + 1} part(s) sur ${totalParts}`}
                    aria-pressed={i < coloredCount}
                  ><span>{i + 1}</span></button>
                {/each}
              </div>
              <p class="visual-caption">Parts coloriées : {coloredCount} / {totalParts}</p>
            </section>
          {/if}
          {#if currentExercise.type === 'visual_select' && currentExercise.interactiveData?.visualOptions}
            <section class="interactive-box visual-selection">
              <p class="instruction-mini">Sélectionne toutes les images qui conviennent.</p>
              <div class="visual-selection-grid">
                {#each currentExercise.interactiveData.visualOptions as model, index}
                  {@const selected = answer.split(',').includes(String(index))}
                  <button
                    type="button"
                    class="visual-option"
                    class:selected
                    onclick={() => toggleVisualOption(index)}
                    disabled={locked}
                    aria-pressed={selected}
                    aria-label={`Image ${index + 1}. ${model.description}`}
                  >
                    <span class="visual-option-number">Image {index + 1}</span>
                    <VisualFractionModel model={model} />
                  </button>
                {/each}
              </div>
            </section>
          {/if}
          {#if ['input', 'number_line', 'color_interactive', 'visual_select'].includes(currentExercise.type)}
            <button type="button" class="primary verify-btn" onclick={() => submit()} disabled={locked}>Vérifier ma réponse</button>
          {/if}
          {#if feedback}
            <p class:success={locked} class="feedback" role="status" aria-live="polite">{feedback}</p>
          {/if}
        </div>
      {:else}
        <p class="loading-text">Préparation des exercices…</p>
      {/if}
    {:else if phase === 4}
      <div class="victory">
        <div class="trophy">🏆</div>
        <h3>Boss vaincu !</h3>
        <p>Tu as réussi les épreuves de cet étage.</p>
        <p class="final-score">Score : {score}/{TOTAL_QUESTIONS}</p>
        <button class="primary" onclick={finishBoss}>Retourner dans la tour</button>
      </div>
    {:else}
      <div class="victory defeat">
        <div class="trophy">💔</div>
        <h3>Le boss a gagné cette fois</h3>
        <p>Tu peux reprendre ton souffle et retenter le combat.</p>
        <p class="final-score">Vies du boss restantes : {bossLives}/{MAX_BOSS_LIVES}</p>
        <button class="primary" onclick={() => restartBoss()}>Réessayer</button>
        <button class="secondary" onclick={() => onClose?.()}>Retourner dans la tour</button>
      </div>
    {/if}
  </div>
</div>
<style>
  .boss-overlay { position: fixed; inset: 0; z-index: 4000; display: flex; justify-content: center; align-items: center; padding: 1rem; background: rgba(2, 6, 23, .86); backdrop-filter: blur(6px); overflow-y: auto; }
  .boss-container { width: min(100%, 760px); margin: 0 auto; padding: 1.25rem; border-radius: 1.25rem; color: #f8fafc; background: #0f172a; border: 2px solid #0891b2; box-shadow: 0 18px 45px #0003; font-family: system-ui, sans-serif; max-height: 94vh; overflow-y: auto; }
  .boss-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
  .header-actions { display: flex; align-items: center; gap: .65rem; }
  .close-btn { width: 2.4rem; height: 2.4rem; border-radius: 50%; border: 1px solid #475569; background: #1e293b; color: white; cursor: pointer; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; }
  .player-lives { margin: .5rem 0 0; display: flex; gap: .2rem; align-items: center; }
  .empty-heart { color: #64748b; }
  .eyebrow { margin: 0 0 .25rem; color: #67e8f9; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
  h2, h3, p { margin-top: 0; }
  h2 { margin-bottom: 0; font-size: 1.5rem; }
  .score { background: #1e293b; padding: .5rem .75rem; border-radius: .6rem; font-size: .9rem; white-space: nowrap; }
  .boss-lives-line { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; font-size: .9rem; color: #cbd5e1; }
  .progress-track { height: .65rem; background: #334155; border-radius: 99px; overflow: hidden; margin: .5rem 0 1rem; }
  .progress-fill { height: 100%; background: #fb7185; transition: width .2s ease; }
  .boss-body { display: flex; flex-direction: column; align-items: stretch; gap: 1rem; padding: 1rem .25rem; }
  .phase-title { display: flex; align-items: center; justify-content: center; gap: .75rem; }
  .phase-title h3 { margin: 0; font-size: 1.2rem; }
  .audio-btn { border: 1px solid #475569; border-radius: 50%; width: 2.5rem; height: 2.5rem; background: #1e293b; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .question-text { font-size: 1.15rem; line-height: 1.5; max-width: 680px; margin: 0 auto; text-align: center; font-weight: 700; }
  .options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .75rem; }
  .option-btn { min-height: 3.2rem; padding: .8rem; color: #f8fafc; background: #1e293b; border: 1px solid #475569; border-radius: .65rem; font-weight: 700; cursor: pointer; }
  .option-btn:hover:not(:disabled), .option-btn.selected { background: #164e63; border-color: #22d3ee; }
  .input-section { display: flex; flex-direction: column; gap: .8rem; width: 100%; max-width: 480px; margin: 0 auto; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  label { font-weight: 600; color: #cbd5e1; }
  input { width: 100%; box-sizing: border-box; padding: .8rem; color: #0f172a; background: white; border: 2px solid #94a3b8; border-radius: .6rem; text-align: center; font-size: 1.1rem; outline: none; }
  input:focus { border-color: #38bdf8; }
  .virtual-keypad { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .35rem; }
  .key-btn { padding: .55rem .2rem; color: #f8fafc; background: #1e293b; border: 1px solid #475569; border-radius: .4rem; font-weight: 700; cursor: pointer; }
  .key-btn.clear-key { grid-column: span 2; background: #7f1d1d; }
  .interactive-box { padding: 1rem; background: #1e293b; border: 1px solid #0891b2; border-radius: .75rem; display: flex; flex-direction: column; gap: .75rem; }
  .instruction-mini { margin: 0; color: #7dd3fc; font-size: .9rem; font-weight: 800; }
  .number-line-box { overflow: hidden; }
  .number-line-scroll { overflow-x: auto; padding: .5rem .25rem 1.25rem; }
  .number-line-visual { position: relative; height: 78px; margin: 0 .75rem; }
  .number-line-track { position: absolute; left: 0; right: 0; top: 31px; height: 3px; border-radius: 3px; background: #94a3b8; }
  .number-line-tick { position: absolute; top: 15px; transform: translateX(-50%); width: 28px; height: 48px; padding: 0; border: 0; background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; }
  .tick-mark { width: 3px; height: 22px; flex-shrink: 0; border-radius: 3px; background: #cbd5e1; }
  .number-line-tick.selected .tick-mark { height: 27px; width: 5px; background: #fbbf24; }
  .tick-label { position: absolute; top: 30px; min-width: 20px; color: #cbd5e1; font-size: .75rem; }
  .tick-label.endpoint { color: #f8fafc; font-weight: 800; }
  .visual-bar-wrapper { display: flex; width: 100%; min-height: 40px; overflow: hidden; border: 1px solid #64748b; border-radius: .45rem; }
  .bar-segment-interactive { flex: 1 1 0; min-width: 0; padding: .5rem .1rem; border: 0; border-right: 1px solid #64748b; font-weight: 800; cursor: pointer; }
  .bar-segment-interactive:last-child { border-right: 0; }
  .bar-segment-interactive.colored { background: #0284c7; color: white; }
  .bar-segment-interactive.empty { background: #1e293b; color: #cbd5e1; }
  .visual-caption { margin: 0; color: #cbd5e1; font-size: .82rem; }
  .primary { padding: .8rem 1.4rem; border: 0; border-radius: .65rem; background: #0891b2; color: white; font-weight: 700; cursor: pointer; }
  .primary:hover:not(:disabled) { background: #0e7490; }
  .primary:disabled, .option-btn:disabled, .key-btn:disabled, .number-line-tick:disabled, .bar-segment-interactive:disabled, .visual-option:disabled { opacity: .6; cursor: not-allowed; }
  .verify-btn { align-self: center; }
  .secondary { padding: .8rem 1.4rem; border: 1px solid #64748b; border-radius: .65rem; background: #1e293b; color: white; font-weight: 700; cursor: pointer; }
  .feedback { margin: 0; padding: .75rem 1rem; border-radius: .65rem; background: #4c1d1d; color: #fecaca; font-weight: bold; text-align: center; }
  .feedback.success { background: #064e3b; color: #a7f3d0; }
  .victory { display: flex; flex-direction: column; align-items: center; gap: .8rem; text-align: center; padding: 2rem 1rem; }
  .victory h3 { margin: 0; font-size: 1.8rem; color: #67e8f9; }
  .defeat h3 { color: #fda4af; }
  .trophy { font-size: 3rem; }
  .final-score { font-weight: 800; font-size: 1.2rem; }
  .loading-text { padding: 2rem; text-align: center; color: #cbd5e1; }
  @media (max-width: 520px) {
    .boss-container { padding: .9rem; }
    .boss-header { align-items: flex-start; }
    h2 { font-size: 1.15rem; }
    .score { font-size: .75rem; padding: .45rem; }
    .boss-lives-line { font-size: .8rem; }
  }
  .boss-container { color: var(--fraction-ink); background: var(--fraction-paper); border-color: var(--fraction-gold); }
  .boss-header { border-color: var(--fraction-line); }
  .close-btn, .audio-btn { border-color: var(--fraction-line); color: var(--fraction-ink); background: #f2e8d3; }
  .eyebrow { color: #8a642a; }
  .score { color: var(--fraction-ink); background: #f3ead9; }
  .boss-lives-line, label { color: #665a49; }
  .progress-track { background: #e5dcc9; }
  .progress-fill { background: var(--fraction-boss); }
  .boss-body, .phase-title h3, .question-text { color: var(--fraction-ink); }
  .option-btn, .key-btn { color: var(--fraction-ink); background: #fffdf7; border-color: var(--fraction-line); }
  .option-btn:hover:not(:disabled), .option-btn.selected { background: #f3e7d0; border-color: var(--fraction-gold); }
  input { border-color: var(--fraction-line); }
  input:focus { border-color: var(--fraction-boss); }
  .key-btn.clear-key { color: #743d34; background: #f7e9e2; }
  .interactive-box { background: #fbf7ed; border-color: #cbbd9f; }
  .instruction-mini { color: var(--fraction-forest); }
  .number-line-track { background: #75664f; }
  .number-line-tick .tick-mark { background: var(--fraction-forest); }
  .tick-label { color: #655a49; }
  .number-line-tick.selected .tick-mark { background: var(--fraction-gold); }
  .number-line-tick.selected .tick-label { color: #8a642a; }
  .bar-segment-interactive { border-color: #d9c8a5; }
  .bar-segment-interactive.colored { background: var(--fraction-teal); color: white; }
  .bar-segment-interactive.empty { color: var(--fraction-ink); background: #f0e9dc; }
  .visual-selection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
  .visual-option { display: grid; align-content: center; gap: .4rem; min-width: 0; padding: .65rem; border: 2px solid var(--fraction-line); border-radius: 10px; background: #fffdf7; cursor: pointer; }
  .visual-option.selected { border-color: var(--fraction-training); background: #e6f0e2; }
  .visual-option-number { color: var(--fraction-forest); font-size: .8rem; font-weight: 850; text-align: left; }
  .primary { background: var(--fraction-forest); color: #fff8e8; }
  .primary:hover:not(:disabled) { background: #243e3a; }
  .secondary { color: var(--fraction-ink); background: #f2e8d3; border-color: var(--fraction-line); }
  .feedback { color: #743d34; background: #f7e9e2; }
  .feedback.success { color: #315a38; background: #e5f0df; }
  .victory h3 { color: var(--fraction-forest); }
  .defeat h3 { color: var(--fraction-boss); }
  @media (prefers-reduced-motion: reduce) { .progress-fill { transition: none; } }
</style>
