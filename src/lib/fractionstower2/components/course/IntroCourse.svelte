<script lang="ts">
    /**
     * [Cours] IntroCourse.svelte
     * Cours interactif et visuel adapté aux 9 étages de Fraction Tower 2.
     */
    import { onMount } from 'svelte';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import FractionCircle from '$lib/fractionstower2/components/fraction/FractionCircle.svelte';
    import Fraction from '$lib/fractionstower2/components/fraction/Fraction.svelte';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import { t } from '$lib/fractionstower2/persistence/LanguageManager';

    let { 
        floorId = 'floor-1', 
        onComplete 
    } = $props<{
        floorId?: string;
        onComplete: () => void;
    }>();

    let currentStep = $state(0);
    let showAnimation = $state(false);
    let isCorrect = $state<boolean | null>(null);
    let userAnswer = $state<number | undefined>(undefined);

    let demoDenominator = $state(4);
    let demoNumerator = $state(0);

    interface StepItem {
        id: string;
        title: string;
        text: string;
        type: string;
    }

    // Définition des étapes dynamiques pour chaque étage (1 à 9)
    let steps = $derived<StepItem[]>(
        floorId === 'floor-1' ? [
            { id: 'f1.1', title: "Étage 1 : L'unité entière", text: "Découvrons l'unité de base.", type: 'unit' },
            { id: 'f1.2', title: "Étage 1 : La division", text: "Apprenons à couper les parts.", type: 'division' },
            { id: 'f1.3', title: "Étage 1 : Le remplissage", text: "Colorions les parts ensemble.", type: 'filling' },
            { id: 'f1.4', title: "Étage 1 : Vérification", text: "À toi de valider ton savoir.", type: 'validation' }
        ] :
        floorId === 'floor-2' ? [
            { id: 'f2.1', title: "Étage 2 : Lire et représenter les fractions", text: "Regarde toujours les trois façons de dire la même chose...", type: 'lorem_svg' },
            { id: 'f2.2', title: "Étage 2 : Manipulation", text: "Entraînons-nous à lire les représentations.", type: 'lorem_svg' }
        ] :
        floorId === 'floor-3' ? [
            { id: 'f3.1', title: "Étage 3 : Introduction", text: "Découvrons les bases de l'étage 3.", type: 'lorem_svg' },
            { id: 'f3.2', title: "Étage 3 : Développement", text: "Analysons les proportions de cet étage.", type: 'lorem_svg' }
        ] :
        floorId === 'floor-4' ? [
            { id: 'f4.1', title: "Étage 4 : Fractions équivalentes", text: "Qu'est-ce qu'une fraction équivalente ? Analogie de la pizza.", type: 'lorem_svg' },
            { id: 'f4.2', title: "Étage 4 : La règle d'or", text: "Ce qu'on fait en haut, on le fait en bas par un même nombre non nul.", type: 'lorem_svg' },
            { id: 'f4.3', title: "Étage 4 : Simplification", text: "Réduire les nombres au maximum en divisant.", type: 'lorem_svg' }
        ] :
        floorId === 'floor-5' ? [
            { id: 'f5.1', title: "Étage 5 : Découverte", text: "Contenu de l'étage 5.", type: 'lorem_svg' }
        ] :
        floorId === 'floor-6' ? [
            { id: 'f6.1', title: "Étage 6 : Introduction", text: "Contenu de l'étage 6.", type: 'lorem_svg' }
        ] :
        floorId === 'floor-7' ? [
            { id: 'f7.1', title: "Étage 7 : Additionner des parts identiques", text: "Quand les parts ont la même taille, on additionne les numérateurs !", type: 'addition_same' }
        ] :
        floorId === 'floor-8' ? [
            { id: 'f8.1', title: "Étage 8 : Dénominateurs différents", text: "Pour additionner des parts de tailles différentes, on convertit d'abord.", type: 'addition_diff' }
        ] :
        floorId === 'floor-9' ? [
            { id: 'f9.1', title: "Étage 9 : Le Sommet", text: "Le défi final approche.", type: 'lorem_svg' }
        ] :
        [
            { id: 'course.default', title: "Cours de l'étage", text: "Bienvenue dans ce module d'apprentissage.", type: 'unit' }
        ]
    );

    let currentSlide = $derived(steps[currentStep] || steps[0]);

    function handleNext() {
        const totalSteps = steps.length;
        if (currentStep < totalSteps - 1) {
            currentStep += 1;
            showAnimation = false;
            isCorrect = null;
            userAnswer = undefined;
        } else {
            onComplete();
        }
    }

    function startAnimation() {
        showAnimation = true;
        if (currentSlide.type === 'filling') {
            let i = 0;
            const interval = setInterval(() => {
                i++;
                demoNumerator = i;
                if (i >= demoDenominator) clearInterval(interval);
            }, 500);
        }
    }

    function checkValidation() {
        if (userAnswer === 3) {
            isCorrect = true;
        } else {
            isCorrect = false;
        }
    }

    function readCurrentStep() {
        const text = currentSlide.text || t(currentSlide.id + '.text');
        if (AudioManager.speak) AudioManager.speak(text);
    }

    onMount(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (currentSlide.type !== 'validation' || isCorrect) {
                    handleNext();
                } else {
                    checkValidation();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    });
</script>

<div class="course-container">
    <div class="slide">
        <div class="header-row">
            <h3>{currentSlide.title || t(currentSlide.id + '.title')}</h3>
            <button class="audio-btn" onclick={readCurrentStep} title="Lire la consigne">🔊</button>
        </div>
        <p>{currentSlide.text || t(currentSlide.id + '.text')}</p>
        
        <div class="viz-box">
            {#if currentSlide.type === 'unit'}
                <FractionCircle numerator={1} denominator={1} color="#e74c3c" />
                <div class="caption">L'unité entière (1/1)</div>
            
            {:else if currentSlide.type === 'division'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionCircle numerator={0} denominator={demoDenominator} color="#3498db" showLabel={false} />
                        <div class="fraction-symbol"><Fraction numerator={undefined} denominator={demoDenominator} /></div>
                    </div>
                    <div class="control-panel">
                        <span>Couper en : </span>
                        <input type="number" bind:value={demoDenominator} min="2" max="12" />
                    </div>
                    {#if !showAnimation}
                        <button class="btn-action" onclick={() => showAnimation = true}>Couper le gâteau !</button>
                    {:else}
                        <div class="animation-text">Regarde les lignes apparaître...</div>
                    {/if}
                </div>

            {:else if currentSlide.type === 'filling'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionCircle numerator={demoNumerator} denominator={demoDenominator} color="#3498db" showLabel={false} />
                        <div class="fraction-symbol"><Fraction numerator={demoNumerator} denominator={demoDenominator} /></div>
                    </div>
                    <div class="control-panel">
                        <span>Prendre : </span>
                        <input type="number" bind:value={demoNumerator} min="0" max={demoDenominator} />
                        <span class="frac-symbol"> / {demoDenominator}</span>
                    </div>
                    <button class="btn-action" onclick={startAnimation}>Lancer le remplissage</button>
                </div>

            {:else if currentSlide.type === 'lorem_svg'}
                <div class="interactive-area">
                    <svg width="220" height="120" viewBox="0 0 220 120" style="background: #f8f9fa; border: 2px dashed #cbd5e1; border-radius: 12px;">
                        <rect x="20" y="20" width="180" height="80" rx="8" fill="#e2e8f0" />
                        <circle cx="60" cy="60" r="25" fill="#3b82f6" opacity="0.8" />
                        <rect x="100" y="40" width="80" height="40" rx="4" fill="#10b981" opacity="0.8" />
                        <text x="110" y="112" fill="#64748b" font-size="11" font-weight="bold" text-anchor="middle">Illustration Bateau (Lorem Ipsum)</text>
                    </svg>
                    <div class="caption">Schéma explicatif de l'étape</div>
                </div>

            {:else if currentSlide.type === 'addition_same'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionBar numerator={2} denominator={6} showLabel={true} width={150} />
                        <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                        <FractionBar numerator={3} denominator={6} showLabel={true} width={150} />
                    </div>
                    <div class="caption">2 sixièmes + 3 sixièmes = 5 sixièmes (2 + 3 = 5)</div>
                </div>

            {:else if currentSlide.type === 'addition_diff'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionBar numerator={1} denominator={2} showLabel={true} width={150} />
                        <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                        <FractionBar numerator={1} denominator={4} showLabel={true} width={150} />
                    </div>
                    <div class="caption">1 demi (2/4) + 1 quart (1/4) = 3 quarts (3/4)</div>
                </div>

            {:else if currentSlide.type === 'validation'}
                <div class="validation-area">
                    <FractionCircle numerator={3} denominator={4} color="#3498db" showLabel={false} />
                    <div class="input-group">
                        <input type="number" bind:value={userAnswer} />
                        <span class="sep"> / </span>
                        <span>4</span>
                    </div>
                    <button class="btn-check" onclick={checkValidation}>Vérifier</button>
                    
                    {#if isCorrect !== null}
                        <div class="feedback {isCorrect ? 'correct' : 'wrong'}">
                            {isCorrect ? "✅ Bravo ! C'est exactement ça." : "❌ Pas tout à fait, regarde bien le nombre de parts colorées."}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="nav">
            <span>Étape {currentStep + 1} / {steps.length}</span>
            {#if currentSlide.type === 'validation' && isCorrect}
                <button class="btn-next" onclick={handleNext}>Continuer ➔</button>
            {:else if currentSlide.type !== 'validation'}
                <button class="btn-next" onclick={handleNext}>Suivant ➔</button>
            {:else}
                <button class="btn-next disabled" disabled>Saisis la bonne réponse pour continuer</button>
            {/if}
        </div>
    </div>
</div>

<style>
    .course-container { display: flex; flex-direction: column; align-items: center; text-align: center; font-family: sans-serif; gap: 20px; }
    .slide { display: flex; flex-direction: column; align-items: center; gap: 20px; max-width: 600px; width: 100%; }
    .header-row { display: flex; align-items: center; gap: 15px; }
    .audio-btn { background: #eee; border: 1px solid #ccc; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; transition: background 0.2s; }
    .audio-btn:hover { background: #ddd; }
    .viz-box { background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); margin: 20px 0; min-height: 250px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }
    .interactive-area, .validation-area { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
    .viz-flex { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .fraction-symbol { font-size: 2rem; font-weight: bold; }
    .control-panel { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: bold; }
    .control-panel input { width: 60px; font-size: 1.2rem; text-align: center; padding: 5px; border: 2px solid #ddd; border-radius: 5px; }
    .btn-action { padding: 10px 20px; background: #e67e22; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    .btn-action:hover { background: #d35400; }
    .animation-text { font-style: italic; color: #666; font-size: 0.9rem; }
    .input-group { display: flex; align-items: center; gap: 10px; font-size: 2rem; font-weight: bold; }
    .input-group input { width: 80px; font-size: 2rem; text-align: center; padding: 5px; border: 3px solid #3498db; border-radius: 8px; }
    .btn-check { padding: 12px 30px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.2rem; font-weight: bold; }
    .feedback { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 5px; }
    .feedback.correct { background: #d4edda; color: #155724; }
    .feedback.wrong { background: #f8d7da; color: #721c24; }
    .nav { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 20px; }
    .btn-next { padding: 10px 20px; background: #2ecc71; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; }
    .btn-next.disabled { background: #ccc; cursor: not-allowed; }
    .caption { margin-top: 15px; font-style: italic; color: #666; font-size: 1rem; }
</style>
