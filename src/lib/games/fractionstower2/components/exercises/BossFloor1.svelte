<script lang="ts">
    /** Boss de l’étage 1 : 3 phases, 6 réussites par phase, uniquement sur le partage équitable. */
    import { AudioManager } from '$lib/games/fractionstower2/audio/AudioManager';
    import FractionBar from '$lib/games/fractionstower2/components/fraction/FractionBar.svelte';
    import VisualFractionModel from '$lib/games/fractionstower2/components/fraction/VisualFractionModel.svelte';
    import { ExerciseGenerator, type VisualFractionOption } from '$lib/games/fractionstower2/engines/ExerciseGenerator';

    let { onComplete, onClose, game } = $props<{
        onComplete: () => void;
        onClose?: () => void;
        game: { markBossDefeated?: (floorId: string) => void };
    }>();

    const QUESTIONS_PER_PHASE = 6;
    let phase = $state(1);
    let questionIndex = $state(0);
    let score = $state(0);
    const MAX_BOSS_LIVES = 18;
    const MAX_PLAYER_LIVES = 5;
    let bossLives = $state(MAX_BOSS_LIVES);
    let playerLives = $state(MAX_PLAYER_LIVES);
    let phase3Options = $state<string[]>([]);
    const usedRandomFractions = new Set<string>();
    let answer = $state('');
    let feedback = $state('');
    let locked = $state(false);
    let exercise = $state<BossExercise>(makePhase1Question());

    type Fraction = { numerator: number; denominator: number };
    type Phase1Exercise = { kind: 'read'; fraction: Fraction };
    type Phase2Exercise = { kind: 'match'; target: Fraction; options: VisualFractionOption[]; correctAnswer: string };
    type Phase3Exercise = { kind: 'situation'; question: string; answer: string; explanation: string };
    type BossExercise = Phase1Exercise | Phase2Exercise | Phase3Exercise;

    const situations: Phase3Exercise[] = [
        { kind: 'situation', question: 'On prend 2 parts parmi 7 parts égales. Écris la fraction prise.', answer: '2/7', explanation: '2 parts prises sur 7 parts égales : 2/7.' },
        { kind: 'situation', question: 'Une tablette a 8 carrés égaux. 3 carrés sont mangés. Quelle fraction a été mangée ?', answer: '3/8', explanation: '3 carrés sont pris sur 8 : 3/8.' },
        { kind: 'situation', question: 'Une tarte est partagée en 6 parts égales. Tu en prends 1. Quelle fraction prends-tu ?', answer: '1/6', explanation: '1 part prise sur 6 : 1/6.' },
        { kind: 'situation', question: 'Dans 5/8, quel nombre est le dénominateur ?', answer: '8', explanation: 'Le dénominateur est le nombre du bas : 8.' },
        { kind: 'situation', question: 'Dans 3/7, quel nombre est le numérateur ?', answer: '3', explanation: 'Le numérateur est le nombre du haut : 3.' },
        { kind: 'situation', question: 'Un gâteau est coupé en 6 morceaux de tailles différentes. Chaque morceau vaut-il un sixième ? Réponds oui ou non.', answer: 'non', explanation: 'Non : les six parts doivent être de même taille pour représenter des sixièmes.' }
    ];

    function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function fractionKey(numerator: number, denominator: number): string {
        let a = numerator;
        let b = denominator;
        while (b !== 0) [a, b] = [b, a % b];
        return `${numerator / a}/${denominator / a}`;
    }

    function randomFraction(): Fraction {
        const available: Fraction[] = [];
        for (let denominator = 2; denominator <= 8; denominator += 1) {
            for (let numerator = 1; numerator < denominator; numerator += 1) {
                const key = fractionKey(numerator, denominator);
                if (!usedRandomFractions.has(key)) available.push({ numerator, denominator });
            }
        }
        const fraction = available[randomInt(0, available.length - 1)];
        usedRandomFractions.add(fractionKey(fraction.numerator, fraction.denominator));
        return fraction;
    }

    function makePhase1Question(): Phase1Exercise {
        return { kind: 'read', fraction: randomFraction() };
    }

    function makePhase2Question(): Phase2Exercise {
        const target = randomFraction();
        const visualExercise = ExerciseGenerator.generateVisualSelection(target.numerator, target.denominator);
        return {
            kind: 'match',
            target,
            options: visualExercise.interactiveData?.visualOptions ?? [],
            correctAnswer: visualExercise.correctAnswer
        };
    }

    function makePhase3Question(): Phase3Exercise {
        return situations[questionIndex % situations.length];
    }

    function loadQuestion() {
        answer = '';
        feedback = '';
        locked = false;
        if (phase === 1) exercise = makePhase1Question();
        else if (phase === 2) exercise = makePhase2Question();
        else exercise = makePhase3Question();
        phase3Options = phase === 3 && exercise.kind === 'situation' ? makePhase3Options(exercise) : [];
    }

    function toggleVisualOption(index: number) {
        if (locked) return;
        const selected = new Set(answer ? answer.split(',').map(Number) : []);
        if (selected.has(index)) selected.delete(index);
        else selected.add(index);
        answer = [...selected].sort((a, b) => a - b).join(',');
        feedback = '';
    }

    function makePhase3Options(question: Phase3Exercise): string[] {
        const expected = normalize(question.answer);
        let options: string[];

        if (expected === 'oui' || expected === 'non') {
            options = ['oui', 'non'];
        } else if (question.question.toLowerCase().includes('dénominateur')) {
            // Les choix opposent le nombre du bas à des erreurs réalistes :
            // le numérateur et un autre nombre proche.
            const fraction = question.question.match(/(\d+)\s*\/\s*(\d+)/);
            if (fraction) {
                const numerator = Number(fraction[1]);
                const denominator = Number(fraction[2]);
                options = [String(denominator), String(Math.max(1, denominator - 2)), String(Math.max(1, numerator - 1))];
            } else {
                options = [expected, String(Math.max(1, Number(expected) - 1)), String(Number(expected) + 1)];
            }
        } else if (question.question.toLowerCase().includes('numérateur')) {
            const fraction = question.question.match(/(\d+)\s*\/\s*(\d+)/);
            if (fraction) {
                const numerator = Number(fraction[1]);
                const denominator = Number(fraction[2]);
                options = [String(numerator), String(denominator), String(numerator === 1 ? 2 : numerator - 1)];
            } else {
                options = [expected, String(Number(expected) + 1), String(Math.max(0, Number(expected) - 1))];
            }
        } else if (expected.includes('/')) {
            const [n, d] = expected.split('/').map(Number);
            // Inversion de la fraction et même dénominateur avec un numérateur voisin.
            const nearbyNumerator = n === d - 1 ? n - 1 : n + 1;
            options = [expected, `${d}/${n}`, `${Math.max(1, nearbyNumerator)}/${d}`];
        } else {
            const n = Number(expected);
            options = [expected, String(Math.max(0, n - 1)), String(n + 1)];
        }

        return [...new Set(options)].sort(() => Math.random() - 0.5);
    }

    function normalize(value: string) {
        return value.toLowerCase().trim().replace(/\s+/g, '').replace(',', '.');
    }

    function submit(value?: string) {
        if (locked || phase >= 4) return;
        if (phase === 2 && exercise.kind === 'match' && !(value ?? answer).trim()) {
            feedback = 'Sélectionne au moins une image, puis vérifie.';
            return;
        }
        let correct = false;

        if (phase === 1 && exercise.kind === 'read') {
            const parts = normalize(value ?? answer).split('/');
            correct = parts.length === 2
                && Number(parts[0]) === exercise.fraction.numerator
                && Number(parts[1]) === exercise.fraction.denominator;
        } else if (phase === 2 && exercise.kind === 'match') {
            correct = normalize(value ?? answer) === normalize(exercise.correctAnswer);
        } else if (phase === 3 && exercise.kind === 'situation') {
            const submitted = normalize(value ?? answer);
            const expected = normalize(exercise.answer);
            if (expected.includes('/')) {
                const [a, b] = submitted.split('/');
                const [c, d] = expected.split('/');
                correct = b !== undefined && Number(a) === Number(c) && Number(b) === Number(d);
            } else {
                correct = submitted === expected;
            }
        }

        if (!correct) {
            playerLives = Math.max(0, playerLives - 1);
            feedback = playerLives === 0
                ? 'Tu n’as plus de vies. Le boss a gagné cette fois.'
                : `Pas tout à fait. Tu perds une vie. Il t’en reste ${playerLives}. Piste : ${getHint()}`;
            if (playerLives === 0) phase = 5;
            return;
        }

        locked = true;
        score += 1;
        bossLives = Math.max(0, bossLives - 1);
        feedback = phase === 3 && exercise.kind === 'situation'
            ? `Bravo ! ${exercise.explanation}`
            : 'Bravo ! C’est juste.';
        setTimeout(() => {
            if (questionIndex < QUESTIONS_PER_PHASE - 1) {
                questionIndex += 1;
                loadQuestion();
            } else if (phase < 3) {
                phase += 1;
                questionIndex = 0;
                loadQuestion();
            } else {
                phase = 4;
                feedback = '';
            }
        }, 900);
    }

    function getHint(): string {
        if (phase === 1 && exercise.kind === 'read') {
            return 'Le numérateur compte les parts coloriées ; le dénominateur indique le nombre total de parts égales.';
        }
        if (phase === 2 && exercise.kind === 'match') {
            return `Vérifie que les parts sont égales, puis compte ${exercise.target.numerator} part(s) coloriée(s) sur ${exercise.target.denominator}.`;
        }
        if (phase === 3 && exercise.kind === 'situation') {
            const question = exercise.question.toLowerCase();
            if (question.includes('dénominateur')) return 'Le dénominateur est le nombre écrit sous la barre de fraction.';
            if (question.includes('numérateur')) return 'Le numérateur est le nombre écrit au-dessus de la barre de fraction.';
            if (question.includes('tailles différentes')) return 'Pour parler de sixièmes, les six parts doivent être de même taille.';
            return 'Repère combien de parts ou d’objets sont pris, puis combien il y en a en tout.';
        }
        return 'Relis la consigne et compte une seule fois chaque part.';
    }

    function readInstruction() {
        let text = '';
        if (phase === 1 && exercise.kind === 'read') text = `Écris la fraction représentée : ${exercise.fraction.numerator} parts coloriées sur ${exercise.fraction.denominator} parts égales.`;
        else if (phase === 2 && exercise.kind === 'match') text = `Sélectionne toutes les images qui représentent ${exercise.target.numerator} sur ${exercise.target.denominator}.`;
        else if (phase === 3 && exercise.kind === 'situation') text = exercise.question;
        AudioManager.speak(text);
    }

    function finishBoss() {
        game.markBossDefeated?.('floor-1');
        onComplete();
    }

    function restartBoss() {
        usedRandomFractions.clear();
        phase = 1;
        questionIndex = 0;
        score = 0;
        bossLives = MAX_BOSS_LIVES;
        playerLives = MAX_PLAYER_LIVES;
        loadQuestion();
    }
</script>

<div class="boss-overlay" role="presentation">
<div class="boss-container" role="dialog" aria-modal="true" aria-label="Boss de l’étage 1">
    <header class="boss-header">
        <div>
            <p class="eyebrow">Défi final · Le partage équitable</p>
            <h2>Boss de l’étage 1</h2>
            {#if phase < 4}
                <p class="player-lives" aria-label={`Vies restantes : ${playerLives}`}>Tes vies : {#each Array(playerLives) as _}<span>❤️</span>{/each}{#each Array(MAX_PLAYER_LIVES - playerLives) as _}<span class="empty-heart">♡</span>{/each}</p>
            {/if}
        </div>
        <div class="header-actions">
            {#if phase < 4}
                <div class="score">Phase {phase}/3 · Question {questionIndex + 1}/6</div>
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
                <h3>{phase === 1 ? 'Phase 1 — Lire une fraction' : phase === 2 ? 'Phase 2 — Reconnaître les parts' : 'Phase 3 — Utiliser les fractions'}</h3>
                <button class="audio-btn" onclick={readInstruction} aria-label="Lire la consigne">🔊</button>
            </div>

            {#if phase === 1 && exercise.kind === 'read'}
                <p>Observe la barre. Écris la fraction coloriée sous la forme numérateur/dénominateur.</p>
                <div class="visual"><FractionBar numerator={exercise.fraction.numerator} denominator={exercise.fraction.denominator} width={260} showLabel={false} /></div>
                <label for="boss-answer">Ta réponse (ex. 3/4)</label>
                <input id="boss-answer" bind:value={answer} onkeydown={(e) => e.key === 'Enter' && submit()} placeholder="ex. 3/4" autocomplete="off" />
                <button class="primary" onclick={() => submit()}>Valider</button>
            {:else if phase === 2 && exercise.kind === 'match'}
                <p>Quelles images représentent <strong>{exercise.target.numerator}/{exercise.target.denominator}</strong> ? Il peut y avoir plusieurs bonnes réponses.</p>
                <div class="visual-selection-grid">
                    {#each exercise.options as option, i}
                        {@const selected = answer.split(',').includes(String(i))}
                        <button
                            type="button"
                            class="visual-option"
                            class:selected
                            onclick={() => toggleVisualOption(i)}
                            disabled={locked}
                            aria-pressed={selected}
                            aria-label={`Image ${i + 1}. ${option.description}`}
                        >
                            <span class="visual-option-label">Image {i + 1}</span>
                            <VisualFractionModel model={option} />
                        </button>
                    {/each}
                </div>
                <button class="primary" onclick={() => submit()} disabled={locked}>Vérifier ma réponse</button>
            {:else if phase === 3 && exercise.kind === 'situation'}
                <p>{exercise.question}</p>
                <div class="answer-options" aria-label="Choisis une réponse">
                    {#each phase3Options as option}
                        <button class="answer-option" onclick={() => submit(option)}>{option}</button>
                    {/each}
                </div>
            {/if}

            {#if feedback}<p class:success={locked} class="feedback" role="status">{feedback}</p>{/if}
        </div>
    {:else if phase === 4}
        <div class="victory">
            <div class="trophy">🏆</div>
            <h3>Boss vaincu !</h3>
            <p>Tu as réussi les trois phases du partage équitable.</p>
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
    .visual-selection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; width: 100%; }
    .visual-option { display: flex; flex-direction: column; align-items: center; gap: .55rem; min-width: 0; padding: .7rem; border: 2px solid #475569; border-radius: .85rem; background: #1e293b; cursor: pointer; }
    .visual-option:hover:not(:disabled) { border-color: #22d3ee; }
    .visual-option.selected { border-color: #22d3ee; background: #164e63; box-shadow: 0 0 0 2px #22d3ee44; }
    .visual-option-label { color: #cbd5e1; font-size: .8rem; font-weight: 700; }
    .answer-options { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem; width: 100%; }
    .answer-option { min-width: 6rem; padding: .8rem 1rem; border: 2px solid #475569; border-radius: .7rem; background: #1e293b; cursor: pointer; font-size: 1.05rem; font-weight: 700; }
    .answer-option:hover { border-color: #22d3ee; background: #164e63; }
    .secondary { padding: .8rem 1.4rem; border: 1px solid #64748b; border-radius: .65rem; background: #1e293b; color: white; font-weight: 700; cursor: pointer; }
    .defeat h3 { color: #fda4af; }
    .feedback { margin: 0; padding: .75rem 1rem; border-radius: .65rem; background: #4c1d1d; color: #fecaca; }
    .feedback.success { background: #064e3b; color: #a7f3d0; }
    .victory { display: flex; flex-direction: column; align-items: center; gap: .8rem; text-align: center; padding: 2rem 1rem; }
    .trophy { font-size: 3rem; }
    .victory h3 { margin: 0; font-size: 1.8rem; color: #67e8f9; }
    .final-score { font-weight: 800; font-size: 1.2rem; }
    @media (max-width: 520px) { .boss-container { padding: .8rem; } .boss-header { align-items: flex-start; flex-direction: column; } .header-actions { width: 100%; justify-content: space-between; } }
    .boss-container { color: var(--fraction-ink); background: var(--fraction-paper); border-color: var(--fraction-gold); }
    .boss-header { border-color: var(--fraction-line); }
    .close-btn, .audio-btn { border-color: var(--fraction-line); color: var(--fraction-ink); background: #f2e8d3; }
    .eyebrow { color: #8a642a; }
    .score { color: var(--fraction-ink); background: #f3ead9; }
    .player-lives { color: var(--fraction-boss); }
    .boss-body, .phase-title h3, label { color: var(--fraction-ink); }
    .visual { background: #fbf7ed; border: 1px solid var(--fraction-line); }
    .answer-option { color: var(--fraction-ink); background: #fffdf7; border-color: var(--fraction-line); }
    .answer-option:hover { background: #f3e7d0; border-color: var(--fraction-gold); }
    .primary { background: var(--fraction-forest); color: #fff8e8; }
    .primary:hover { background: #243e3a; }
    .secondary { color: var(--fraction-ink); background: #f2e8d3; border-color: var(--fraction-line); }
    .feedback { color: #743d34; background: #f7e9e2; }
    .feedback.success { color: #315a38; background: #e5f0df; }
    .victory h3 { color: var(--fraction-forest); }
    .defeat h3 { color: var(--fraction-boss); }
</style>
