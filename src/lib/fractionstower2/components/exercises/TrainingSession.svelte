<script lang="ts">
    import { onMount } from 'svelte';
    import { ExerciseGenerator, type Exercise } from '$lib/fractionstower2/engines/ExerciseGenerator';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    let { floorId = 'floor-1', onComplete } = $props<{
        floorId?: string;
        onComplete?: (score: number) => void;
    }>();

    let floorNum = $derived(parseInt(floorId.match(/(\d+)/)?.[1] || '1'));

    let exercises = $state<Exercise[]>([]);
    let currentIndex = $state(0);
    let userAnswer = $state("");
    let attemptsLeft = $state(2);
    let feedback = $state("");
    let isAnswerChecked = $state(false);
    let isCorrect = $state(false);
    
    let score = $state(0);
    let sessionCompleted = $state(false);
    let showVisualHelp = $state(false); // État pour l'aide visuelle

    onMount(() => {
        exercises = ExerciseGenerator.generateSession(floorId, 10);
    });

    let currentEx = $derived(exercises[currentIndex] || { question: "Chargement...", correctAnswer: "", type: "input" });

    // Extraction automatique de fractions ou chiffres dans la question pour l'aide visuelle
    let extractedFraction = $derived(() => {
        const match = currentEx.question.match(/(\d+)\/(\d+)/);
        if (match) {
            return { num: parseInt(match[1]), den: Math.min(parseInt(match[2]), 12) }; // Max 12 pour l'affichage visuel
        }
        const numbers = currentEx.question.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            return { num: parseInt(numbers[0]), den: Math.min(parseInt(numbers[1]), 12) };
        }
        return { num: 1, den: 4 }; // Valeur par défaut
    });

    function speakQuestion() {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentEx.question);
        utterance.lang = 'fr-CH';
        window.speechSynthesis.speak(utterance);
    }

    function selectQcmOption(option: string) {
        if (isAnswerChecked) return;
        userAnswer = option;
        checkAnswer();
    }

    function appendToInput(char: string) {
        if (isAnswerChecked) return;
        if (char === '⌫') {
            userAnswer = userAnswer.slice(0, -1);
        } else {
            userAnswer += char;
        }
    }

    function checkAnswer() {
        if (!userAnswer.trim() || isAnswerChecked) return;

        const cleanedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, '');
        const cleanedCorrect = currentEx.correctAnswer.trim().toLowerCase().replace(/\s+/g, '');

        if (cleanedUser === cleanedCorrect) {
            isCorrect = true;
            isAnswerChecked = true;
            score++;
            feedback = "🎉 Bravo ! C'est la bonne réponse.";
            if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('success');
        } else {
            attemptsLeft--;
            if (attemptsLeft > 0) {
                isCorrect = false;
                feedback = `❌ Oups ! Il te reste ${attemptsLeft} essai. Indice : ${currentEx.hint || 'Réessaie.'}`;
                if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('error');
            } else {
                isCorrect = false;
                isAnswerChecked = true;
                feedback = `❌ Dommage ! La bonne réponse était : ${currentEx.correctAnswer}`;
                if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('error');
            }
        }
    }

    function nextQuestion() {
        if (currentIndex < exercises.length - 1) {
            currentIndex++;
            userAnswer = "";
            attemptsLeft = 2;
            feedback = "";
            isAnswerChecked = false;
            isCorrect = false;
            showVisualHelp = false;
        } else {
            sessionCompleted = true;
            if (onComplete) onComplete(score);
        }
    }

    function restartSession() {
        exercises = ExerciseGenerator.generateSession(floorId, 10);
        currentIndex = 0;
        userAnswer = "";
        attemptsLeft = 2;
        feedback = "";
        isAnswerChecked = false;
        isCorrect = false;
        score = 0;
        sessionCompleted = false;
        showVisualHelp = false;
    }
</script>

<div class="training-container">
    {#if !sessionCompleted}
        <header class="training-header">
            <span class="floor-badge">Étage {floorNum} — Entraînement</span>
            <span class="score-counter">Question {currentIndex + 1} / {exercises.length} (Score: {score})</span>
        </header>

        <main class="training-card">
            <div class="question-row">
                <h2>{currentEx.question}</h2>
                <div class="action-buttons-top">
                    <button class="help-btn" onclick={() => showVisualHelp = !showVisualHelp} title="Aide visuelle">
                        💡 Aide
                    </button>
                    <button class="speak-btn" onclick={speakQuestion} title="Écouter">🔊</button>
                </div>
            </div>

            <!-- PANNEAU D'AIDE VISUELLE (DESSIN DE REPRÉSENTATION) -->
            {#if showVisualHelp}
                <div class="visual-help-panel">
                    <p class="help-title">🎨 Schéma de compréhension :</p>
                    <div class="visual-bar-wrapper">
                        {#each Array(extractedFraction().den) as _, i}
                            <div class="bar-segment {i < extractedFraction().num ? 'colored' : 'empty'}">
                                <span>{i + 1}</span>
                            </div>
                        {/each}
                    </div>
                    <p class="visual-caption">Représentation : {extractedFraction().num} part(s) coloriée(s) sur un total de {extractedFraction().den} parts égales.</p>
                </div>
            {/if}

            <!-- MODE QCM / COMPARAISON -->
            {#if currentEx.type === 'qcm' || currentEx.type === 'comparison'}
                <div class="options-grid">
                    {#each (currentEx.options || []) as opt}
                        <button 
                            class="option-btn {userAnswer === opt ? 'selected' : ''}" 
                            onclick={() => selectQcmOption(opt)}
                            disabled={isAnswerChecked}
                        >
                            {opt}
                        </button>
                    {/each}
                </div>
            {/if}

            <!-- MODE SAISIE LIBRE + CLAVIER VIRTUEL -->
            {#if currentEx.type === 'input' || currentEx.type === 'number_line'}
                <div class="input-section">
                    <input 
                        type="text" 
                        bind:value={userAnswer} 
                        placeholder="Ta réponse..." 
                        onkeydown={(e) => e.key === 'Enter' && checkAnswer()}
                        disabled={isAnswerChecked}
                    />
                    
                    <div class="virtual-keypad">
                        {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '/', '.', '⌫'] as key}
                            <button class="key-btn" onclick={() => appendToInput(key)} disabled={isAnswerChecked}>
                                {key}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- BOUTONS D'ACTION (VALIDATION OU SUIVANT POUR TOUS LES MODES) -->
            <div class="action-row">
                {#if !isAnswerChecked}
                    {#if currentEx.type === 'input' || currentEx.type === 'number_line'}
                        <button class="btn-verify" onclick={checkAnswer}>Valider ma réponse</button>
                    {/if}
                {:else}
                    <button class="btn-next" onclick={nextQuestion}>
                        {currentIndex === exercises.length - 1 ? 'Voir mon score final 🎯' : 'Question suivante →'}
                    </button>
                {/if}
            </div>

            {#if feedback}
                <p class="feedback {isCorrect ? 'success' : 'error'}">{feedback}</p>
            {/if}
        </main>

        <footer class="training-footer">
            <div class="progress-bar">
                <div class="progress-fill" style="width: {((currentIndex + 1) / exercises.length) * 100}%"></div>
            </div>
        </footer>

    {:else}
        <!-- ÉCRAN DE FIN DE SESSION -->
        <div class="completion-screen {score >= 9 ? 'fireworks-bg' : score >= 7 ? 'confetti-bg' : ''}">
            <h2>🏆 Session terminée !</h2>
            <div class="score-display">
                <span class="score-number">{score} / 10</span>
            </div>

            {#if score >= 9}
                <p class="congrats-text">🌟 Fantastique ! C'est un triomphe absolu ! Feux d'artifice ! 🎆</p>
            {:else if score >= 7}
                <p class="congrats-text">🎉 Bravo ! Tu as validé ton entraînement avec succès ! Confettis ! ✨</p>
            {:else}
                <p class="congrats-text warning">💪 Oups, il te faut au moins 7/10 pour valider l'étage. Réessaie, tu vas y arriver !</p>
            {/if}

            <div class="end-actions">
                {#if score < 7}
                    <button class="btn-retry" onclick={restartSession}>Recommencer l'entraînement 🔄</button>
                {/if}
                <button class="btn-close" onclick={() => onComplete(score)}>Fermer et retourner à la tour 🚪</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .training-container {
        max-width: 700px;
        margin: 0 auto;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, sans-serif;
        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    }

    .training-header {
        background: #1e293b;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #334155;
    }

    .floor-badge {
        font-weight: bold;
        color: #38bdf8;
        font-size: 0.9rem;
    }

    .score-counter {
        font-size: 0.85rem;
        color: #94a3b8;
    }

    .training-card {
        padding: 2rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .question-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h2 {
        font-size: 1.3rem;
        margin: 0;
        color: #f8fafc;
        line-height: 1.4;
    }

    .action-buttons-top {
        display: flex;
        gap: 8px;
    }

    .help-btn, .speak-btn {
        background: #334155;
        border: 1px solid #475569;
        color: #f8fafc;
        font-size: 0.95rem;
        padding: 0.5rem 0.8rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
    }
    .help-btn:hover, .speak-btn:hover { background: #475569; }

    /* PANNEAU AIDE VISUELLE */
    .visual-help-panel {
        background: #1e293b;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
    }

    .help-title {
        font-size: 0.9rem;
        font-weight: bold;
        color: #38bdf8;
        margin-bottom: 0.6rem;
        text-align: left;
    }

    .visual-bar-wrapper {
        display: flex;
        height: 44px;
        border: 2px solid #64748b;
        border-radius: 8px;
        overflow: hidden;
        background: #0f172a;
        margin-bottom: 0.5rem;
    }

    .bar-segment {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.9rem;
        border-right: 1px solid #64748b;
    }

    .bar-segment:last-child { border-right: none; }
    .bar-segment.colored { background: #0284c7; color: white; }
    .bar-segment.empty { background: #1e293b; color: #94a3b8; }

    .visual-caption {
        font-size: 0.85rem;
        color: #94a3b8;
        margin: 0;
        font-style: italic;
    }

    /* QCM */
    .options-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .option-btn {
        background: #1e293b;
        border: 2px solid #475569;
        color: white;
        padding: 1rem;
        font-size: 1.1rem;
        font-weight: bold;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .option-btn:hover:not(:disabled) {
        background: #334155;
        border-color: #38bdf8;
    }
    .option-btn.selected {
        background: #0284c7;
        border-color: #38bdf8;
    }

    /* SAISIE & CLAVIER */
    .input-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    input[type="text"] {
        width: 100%;
        padding: 0.8rem 1rem;
        font-size: 1.3rem;
        background: #1e293b;
        border: 2px solid #475569;
        border-radius: 8px;
        color: white;
        text-align: center;
        outline: none;
    }
    input[type="text"]:focus { border-color: #38bdf8; }

    .virtual-keypad {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
    }

    .key-btn {
        background: #334155;
        border: 1px solid #475569;
        color: white;
        padding: 0.8rem 0;
        font-size: 1.1rem;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
    }
    .key-btn:hover { background: #475569; }
    .key-btn:active { background: #38bdf8; color: #0f172a; }

    .action-row {
        display: flex;
        justify-content: center;
    }

    .btn-verify, .btn-next {
        background: #0ea5e9;
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        font-size: 1.1rem;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
    }
    .btn-verify:hover, .btn-next:hover { background: #0284c7; }

    .feedback {
        font-weight: bold;
        text-align: center;
        font-size: 1.05rem;
        margin: 0;
    }
    .feedback.success { color: #4ade80; }
    .feedback.error { color: #f87171; }

    .training-footer {
        background: #1e293b;
        height: 8px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #38bdf8;
        transition: width 0.3s ease;
    }

    .completion-screen {
        padding: 3rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        background: linear-gradient(135deg, #0f172a, #1e293b);
    }

    .score-display {
        font-size: 3.5rem;
        font-weight: 900;
        color: #38bdf8;
        background: #1e293b;
        border: 4px solid #334155;
        padding: 1rem 2.5rem;
        border-radius: 20px;
        box-shadow: 0 0 25px rgba(56, 189, 248, 0.2);
    }

    .congrats-text {
        font-size: 1.2rem;
        max-width: 500px;
        line-height: 1.5;
    }
    .congrats-text.warning { color: #f87171; }

    .end-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .btn-retry {
        background: #eab308;
        color: #0f172a;
        border: none;
        padding: 0.8rem 1.5rem;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
    }
    .btn-retry:hover { background: #ca8a04; }

    .btn-close {
        background: #22c55e;
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
    }
    .btn-close:hover { background: #16a34a; }

    .confetti-bg { animation: pulse-bg 2s infinite alternate; }
    .fireworks-bg { animation: glow-bg 1.5s infinite alternate; }

    @keyframes pulse-bg {
        from { background-color: #0f172a; }
        to { background-color: #142850; }
    }
    @keyframes glow-bg {
        from { background-color: #0f172a; box-shadow: inset 0 0 50px rgba(56, 189, 248, 0.3); }
        to { background-color: #1e1b4b; box-shadow: inset 0 0 80px rgba(234, 179, 8, 0.4); }
    }
</style>