<script lang="ts">
    /**
     * [Activité] BossBattle.svelte
     * Gère les combats de boss (15 questions pour l'étage 5, 20 questions pour le Grand Boss Final 8/9).
     */
    import { onMount } from 'svelte';
    import { ExerciseGenerator } from '$lib/fractionstower2/engines/ExerciseGenerator';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import BossFloor2 from '$lib/fractionstower2/components/exercises/BossFloor2.svelte';

    let { 
        floorId = 'floor-5', 
        onComplete 
    } = $props<{
        floorId?: string;
        onComplete: (score: number) => void;
    }>();

    let activeFloor = $derived(floorId);
    let totalQuestions = $derived(activeFloor === 'floor-8' || activeFloor === 'floor-9' ? 20 : 15);
    let bossType = $derived(activeFloor === 'floor-8' || activeFloor === 'floor-9' ? 'boss-final-9' : 'boss-bilan-5');

    let currentIndex = $state(0);
    let userAnswer = $state('');
    let score = $state(0);
    let feedback = $state('');
    let isFinished = $state(false);

    let currentExercise = $state(
        ExerciseGenerator.generate({ 
            floorId: 'floor-1', 
            difficulty: 'medium',
            type: 'comparison' 
        })
    );

    $effect(() => {
        const type = bossType;
        currentExercise = ExerciseGenerator.generate({ 
            floorId: type, 
            difficulty: 'medium' 
        });
        currentIndex = 0;
        score = 0;
        userAnswer = '';
        feedback = '';
        isFinished = false;
    });

    function submitAnswer(val?: string) {
        const answerToTest = val !== undefined ? val : userAnswer;
        const cleanUser = answerToTest.trim();
        const cleanCorrect = String(currentExercise.correctAnswer).trim();

        const isCorrect = cleanUser === cleanCorrect;

        if (isCorrect) {
            score += 1;
            feedback = "Génial ! Coup de maître 🌟";
        } else {
            feedback = `Oups ! La réponse attendue était : ${currentExercise.correctAnswer}`;
        }

        setTimeout(() => {
            if (currentIndex < totalQuestions - 1) {
                currentIndex += 1;
                userAnswer = '';
                feedback = '';
                currentExercise = ExerciseGenerator.generate({ 
                    floorId: bossType, 
                    difficulty: 'medium' 
                });
            } else {
                isFinished = true;
                setTimeout(() => onComplete(score), 2000);
            }
        }, 1500);
    }
</script>

{#if activeFloor === 'floor-2'}
    <BossFloor2 onComplete={onComplete} />
{:else}
<div class="boss-container bg-slate-900 text-white p-8 rounded-3xl shadow-2xl max-w-xl mx-auto border-2 {activeFloor === 'floor-8' ? 'border-amber-500 shadow-amber-500/20' : 'border-cyan-500 shadow-cyan-500/20'} relative overflow-hidden">
    <!-- En-tête épique -->
    <div class="flex justify-between items-center mb-6 text-sm font-mono tracking-wider">
        <span class="{activeFloor === 'floor-8' ? 'text-amber-400' : 'text-cyan-400'} font-bold">
            {activeFloor === 'floor-8' ? '⚔️ GRAND BOSS FINAL' : '⚡ BOSS BILAN (ÉTAGE 5)'}
        </span>
        <span class="text-slate-400">Étape {currentIndex + 1} / {totalQuestions}</span>
    </div>

    <!-- Barre de progression Tour -->
    <div class="w-full bg-slate-800 h-2.5 rounded-full mb-6 overflow-hidden">
        <div 
            class="h-full transition-all duration-300 {activeFloor === 'floor-8' ? 'bg-amber-500' : 'bg-cyan-500'}" 
            style="width: {((currentIndex + 1) / totalQuestions) * 100}%"
        ></div>
    </div>

    <!-- Question -->
    <h2 class="text-xl font-bold mb-6 text-center text-slate-100">{currentExercise.question}</h2>

    <!-- Zone Visuelle -->
    <div class="my-6 p-6 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center items-center gap-4 min-h-[160px]">
        {#if currentExercise.fractions && currentExercise.fractions.length >= 2}
            <div class="flex flex-col items-center">
                <span class="text-xs font-mono text-slate-400 mb-1">{currentExercise.fractions[0].numerator}/{currentExercise.fractions[0].denominator}</span>
                <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} showLabel={true} width={120} />
            </div>
            <span class="text-2xl font-bold {activeFloor === 'floor-8' ? 'text-amber-400' : 'text-cyan-400'}">?</span>
            <div class="flex flex-col items-center">
                <span class="text-xs font-mono text-slate-400 mb-1">{currentExercise.fractions[1].numerator}/{currentExercise.fractions[1].denominator}</span>
                <FractionBar numerator={currentExercise.fractions[1].numerator} denominator={currentExercise.fractions[1].denominator} showLabel={true} width={120} />
            </div>
        {:else if currentExercise.fractions && currentExercise.fractions.length === 1}
            <div class="flex flex-col items-center">
                <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} showLabel={true} width={180} />
            </div>
        {/if}
    </div>

    <!-- Contrôles de réponse -->
    {#if currentExercise.type === 'comparison'}
        <div class="flex gap-4 justify-center my-6">
            <button onclick={() => submitAnswer('<')} class="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold rounded-xl text-2xl transition-transform active:scale-95 cursor-pointer">&lt;</button>
            <button onclick={() => submitAnswer('=')} class="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold rounded-xl text-2xl transition-transform active:scale-95 cursor-pointer">=</button>
            <button onclick={() => submitAnswer('>')} class="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold rounded-xl text-2xl transition-transform active:scale-95 cursor-pointer">&gt;</button>
        </div>
    {:else}
        <div class="flex flex-col items-center gap-4 my-6">
            <input 
                type="text" 
                bind:value={userAnswer} 
                placeholder="ex: 5/4"
                class="bg-slate-800 border border-slate-700 text-center text-xl font-bold py-3 px-6 rounded-xl w-44 text-white focus:outline-none focus:border-cyan-400"
            />
            <button 
                onclick={() => submitAnswer()} 
                class="w-full sm:w-auto px-8 py-3.5 {activeFloor === 'floor-8' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'} font-bold rounded-xl transition-colors shadow-lg cursor-pointer"
            >
                Valider l'attaque ➔
            </button>
        </div>
    {/if}

    <!-- Rétroaction -->
    {#if feedback}
        <div class="p-4 rounded-xl text-center font-semibold mt-4 {feedback.includes('Génial') ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border border-rose-800 text-rose-300'}">
            {feedback}
        </div>
    {/if}

    {#if isFinished}
        <div class="absolute inset-0 bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center p-6 z-20 animate-fade-in">
            <h3 class="text-3xl font-extrabold text-amber-400 mb-2">🏆 VICTOIRE ÉPIQUE !</h3>
            <p class="text-slate-300 text-lg mb-4">Score final : {score} / {totalQuestions}</p>
            <p class="text-sm text-cyan-300">Le sommet de la Tour est conquis !</p>
        </div>
    {/if}
</div>
{/if}
