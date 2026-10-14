<script lang="ts">
    /**
     * [Activité] BossBattle.svelte
     * Version unifiée avec l'interface soignée (style Boss 1) pour tous les étages.
     */
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import { ExerciseGenerator } from '$lib/fractionstower2/engines/ExerciseGenerator';

    let { 
        floorId = 'floor-1', 
        onComplete, 
        onClose, 
        game 
    } = $props<{
        floorId?: string;
        onComplete: (score?: number) => void;
        onClose?: () => void;
        game?: { markBossDefeated?: (floorId: string) => void };
    }>();

    let activeFloor = $derived(String(floorId).startsWith('floor-') ? floorId : `floor-${floorId}`);
    let isBilan = $derived(['floor-5', 'floor-8', 'floor-9'].includes(activeFloor));
    
    // 3 phases de 6 questions pour les boss standards (18 total), ou format adapté pour les bilans
    const QUESTIONS_PER_PHASE = 6;
    const TOTAL_PHASES = 3;
    let phase = $state(1);
    let questionIndex = $state(0);
    let score = $state(0);
    
    const MAX_BOSS_LIVES = 18;
    const MAX_PLAYER_LIVES = 5;
    let bossLives = $state(MAX_BOSS_LIVES);
    let playerLives = $state(MAX_PLAYER_LIVES);
    
    let answer = $state('');
    let feedback = $state('');
    let locked = $state(false);

    // Génération dynamique basée sur l'ExerciseGenerator pour supporter tous les étages
    function loadCurrentExercise() {
        if (activeFloor === 'floor-1') {
            // Logique spécifique étage 1
            return {
                question: 'Observe la barre. Écris la fraction coloriée sous la forme numérateur/dénominateur.',
                type: 'standard',
                ...ExerciseGenerator.generate({ floorId: 'floor-1', difficulty: 'medium' })
            };
        } else if (isBilan) {
            // Bilan renforcé pour les étages 5 et 8
            const randomPrevFloor = `floor-${Math.floor(Math.random() * 5) + 1}`;
            return ExerciseGenerator.generate({ floorId: randomPrevFloor, difficulty: 'medium' });
        } else {
            return ExerciseGenerator.generate({ floorId: activeFloor, difficulty: 'medium' });
        }
    }

    let currentExercise = $state(loadCurrentExercise());

    function normalize(value: string) {
        return value.toLowerCase().trim().replace(/\s+/g, '').replace(',', '.');
    }

    function submit(value?: string) {
        if (locked || phase >= 4) return;
        
        const submitted = normalize(value ?? answer);
        const expected = normalize(String(currentExercise.correctAnswer));
        
        let correct = submitted === expected;

        if (!correct) {
            playerLives = Math.max(0, playerLives - 1);
            feedback = playerLives === 0
                ? 'Tu n’as plus de vies. Le boss a gagné cette fois.'
                : `Pas tout à fait. Tu perds une vie. Il t’en reste ${playerLives}. Réessaie !`;
            AudioManager.play?.('wrong') ?? AudioManager.playClick?.();
            if (playerLives === 0) phase = 5;
            return;
        }

        locked = true;
        score += 1;
        bossLives = Math.max(0, bossLives - 1);
        feedback = 'Bravo ! C’est juste.';
        AudioManager.play?.('success') ?? AudioManager.playClick?.();

        setTimeout(() => {
            if (questionIndex < QUESTIONS_PER_PHASE - 1) {
                questionIndex += 1;
                answer = '';
                feedback = '';
                locked = false;
                currentExercise = loadCurrentExercise();
            } else if (phase < TOTAL_PHASES) {
                phase += 1;
                questionIndex = 0;
                answer = '';
                feedback = '';
                locked = false;
                currentExercise = loadCurrentExercise();
            } else {
                phase = 4; // Victoire
                feedback = '';
            }
        }, 900);
    }

    function readInstruction() {
        AudioManager.speak?.(currentExercise.question);
    }

    function finishBoss() {
        game?.markBossDefeated?.(activeFloor);
        onComplete(score);
    }

    function restartBoss() {
        phase = 1;
        questionIndex = 0;
        score = 0;
        bossLives = MAX_BOSS_LIVES;
        playerLives = MAX_PLAYER_LIVES;
        answer = '';
        feedback = '';
        locked = false;
        currentExercise = loadCurrentExercise();
    }
</script>

<div class="boss-overlay" role="presentation">
<div class="boss-container" role="dialog" aria-modal="true" aria-label="Combat de Boss">
    <header class="boss-header">
        <div>
            <p class="eyebrow">Défi final · {activeFloor.toUpperCase()}</p>
            <h2>Boss de l’{activeFloor}</h2>
            {#if phase < 4}
                <p class="player-lives" aria-label={`Vies restantes : ${playerLives}`}>Tes vies : {#each Array(playerLives) as _}<span>❤️</span>{/each}{#each Array(MAX_PLAYER_LIVES - playerLives) as _}<span class="empty-heart">♡</span>{/each}</p>
            {/if}
        </div>
        <div class="header-actions">
            {#if phase < 4}
                <div class="score">Phase {phase}/{TOTAL_PHASES} · Question {questionIndex + 1}/{QUESTIONS_PER_PHASE}</div>
            {:else if phase === 4}
                <div class="score">Boss vaincu</div>
            {:else}
                <div class="score">Combat terminé</div>
            {/if}
            <button class="close-btn" onclick={() => onClose?.()} aria-label="Fermer le combat" title="Fermer (Échap)">✕</button>
        </div>
    </header>

    {#if phase < 4}
        <div class="boss-lives-line"><span>Vies du boss : ❤️ {bossLives}/{MAX_BOSS_LIVES}</span><span>Progression : {score}/18</span></div>
        <div class="progress-track" aria-label={`Vies restantes du boss : ${bossLives} sur ${MAX_BOSS_LIVES}`}>
            <div class="progress-fill" style={`width: ${(bossLives / MAX_BOSS_LIVES) * 100}%`}></div>
        </div>
        <div class="boss-body">
            <div class="phase-title">
                <h3>Phase {phase} — Défi de la tour</h3>
                <button class="audio-btn" onclick={readInstruction} aria-label="Lire la consigne">🔊</button>
            </div>

            <p>{currentExercise.question}</p>

            {#if currentExercise.fractions && currentExercise.fractions.length > 0}
                <div class="visual">
                    <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} width={260} showLabel={false} />
                </div>
            {/if}

            {#if currentExercise.type === 'comparison'}
                <div class="flex gap-4 my-4">
                    <button class="primary" onclick={() => submit('<')}>&lt;</button>
                    <button class="primary" onclick={() => submit('=')}>=</button>
                    <button class="primary" onclick={() => submit('>')}>&gt;</button>
                </div>
            {:else}
                <label for="boss-answer">Ta réponse (ex. 3/4)</label>
                <input id="boss-answer" bind:value={answer} onkeydown={(e) => e.key === 'Enter' && submit()} placeholder="ex. 3/4" autocomplete="off" />
                <button class="primary" onclick={() => submit()}>Valider</button>
            {/if}

            {#if feedback}<p class:success={locked} class="feedback" role="status">{feedback}</p>{/if}
        </div>
    {:else if phase === 4}
        <div class="victory">
            <div class="trophy">🏆</div>
            <h3>Boss vaincu !</h3>
            <p>Tu as réussi les épreuves de cet étage.</p>
            <p class="final-score">Score : {score}/18</p>
            <button class="primary" onclick={finishBoss}>Retourner dans la tour</button>
        </div>
    {:else}
        <div class="victory defeat">
            <div class="trophy">💔</div>
            <h3>Le boss a gagné cette fois</h3>
            <p>Tu peux reprendre ton souffle et retenter le combat.</p>
            <p class="final-score">Vies du boss restantes : {bossLives}/{MAX_BOSS_LIVES}</p>
            <button class="primary" onclick={restartBoss}>Réessayer</button>
            <button class="secondary" onclick={() => onClose?.()}>Retourner dans la tour</button>
        </div>
    {/if}
</div>
</div>

<style>
    .boss-overlay { position: fixed; inset: 0; z-index: 4000; display: flex; justify-content: center; align-items: center; padding: 1rem; background: rgba(2, 6, 23, .86); backdrop-filter: blur(6px); overflow-y: auto; }
    .boss-container { width: min(100%, 720px); margin: 0 auto; padding: 1.25rem; border-radius: 1.25rem; color: #f8fafc; background: #0f172a; border: 2px solid #0891b2; box-shadow: 0 18px 45px #0003; font-family: sans-serif; max-height: 94vh; overflow-y: auto; }
    .boss-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
    .header-actions { display: flex; align-items: center; gap: .65rem; }
    .close-btn { width: 2.4rem; height: 2.4rem; border-radius: 50%; border: 1px solid #475569; background: #1e293b; color: white; cursor: pointer; font-size: 1.15rem; }
    .player-lives { margin: .5rem 0 0; display: flex; gap: .2rem; align-items: center; }
    .empty-heart { color: #64748b; }
    .eyebrow { margin: 0 0 .25rem; color: #67e8f9; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
    h2, h3, p { margin-top: 0; }
    h2 { margin-bottom: 0; font-size: 1.5rem; }
    .score { background: #1e293b; padding: .5rem .75rem; border-radius: .6rem; font-size: .9rem; white-space: nowrap; }
    .boss-lives-line { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; font-size: .9rem; color: #cbd5e1; }
    .progress-track { height: .65rem; background: #334155; border-radius: 99px; overflow: hidden; margin: .5rem 0 1rem; }
    .progress-fill { height: 100%; background: #fb7185; transition: width .2s ease; }
    .boss-body { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; padding: 1rem .25rem; }
    .phase-title { display: flex; align-items: center; gap: .75rem; }
    .phase-title h3 { margin: 0; font-size: 1.2rem; }
    .audio-btn { border: 1px solid #475569; border-radius: 50%; width: 2.5rem; height: 2.5rem; background: #1e293b; cursor: pointer; }
    .visual { width: 100%; display: flex; justify-content: center; padding: 1rem; border-radius: .75rem; background: white; }
    label { align-self: center; font-weight: 600; }
    input { width: min(100%, 18rem); padding: .8rem; color: #0f172a; background: white; border: 2px solid #94a3b8; border-radius: .6rem; text-align: center; font-size: 1.1rem; }
    button { color: inherit; }
    .primary { padding: .8rem 1.4rem; border: 0; border-radius: .65rem; background: #0891b2; color: white; font-weight: 700; cursor: pointer; }
    .primary:hover { background: #0e7490; }
    .secondary { padding: .8rem 1.4rem; border: 1px solid #64748b; border-radius: .65rem; background: #1e293b; color: white; font-weight: 700; cursor: pointer; }
    .defeat h3 { color: #fda4af; }
    .feedback { margin: 0; padding: .75rem 1rem; border-radius: .65rem; background: #4c1d1d; color: #fecaca; }
    .feedback.success { background: #064e3b; color: #a7f3d0; }
    .victory { display: flex; flex-direction: column; align-items: center; gap: .8rem; text-align: center; padding: 2rem 1rem; }
    .trophy { font-size: 3rem; }
    .victory h3 { margin: 0; font-size: 1.8rem; color: #67e8f9; }
    .final-score { font-weight: 800; font-size: 1.2rem; }
</style>