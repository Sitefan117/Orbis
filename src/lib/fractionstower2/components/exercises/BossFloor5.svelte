<!-- 
  =============================================================================
  COMPOSANT : BossFloor5.svelte
  DESCRIPTION : Boss intermédiaire de l'étage 5. 
  Il fait office de test bilan global des étages 1 à 5 (lecture, droite graduée, 
  fractions équivalentes et comparaisons). Format long (15 questions).
  =============================================================================
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { ExerciseGenerator } from '$lib/fractionstower2/engines/ExerciseGenerator';
	import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
	import NumberLine from '$lib/fractionstower2/components/fraction/NumberLine.svelte';
	import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
	import { t } from '$lib/fractionstower2/persistence/LanguageManager';

	let { onComplete, game } = $props<{
		onComplete: () => void;
		game: any;
	}>();

	let inputRef: HTMLInputElement | undefined = $state();

	// Le boss de l'étage 5 propose un format plus long : 15 questions pour couvrir les étages 1 à 5
	const totalExercises = 15;
	let currentStep = $state(0);
	let score = $state(0);
	let userAnswer = $state("");
	let feedback = $state("");
	let isAdvancing = $state(false);

	// Générateur de type mixte pour le boss (mélange les types des étages 1 à 5)
	function generateBossExercise() {
		const types = ['standard', 'number_line', 'comparison'];
		const chosenType = types[Math.floor(Math.random() * types.length)];
		
		// On pioche aléatoirement un étage cible parmi les 5 premiers
		const randomFloor = `floor-${Math.floor(Math.random() * 5) + 1}`;

		return ExerciseGenerator.generate({
			floorId: randomFloor,
			difficulty: 'medium',
			type: chosenType as any
		});
	}

	let currentExercise = $state(generateBossExercise());

	// Vérification de la réponse de l'utilisateur
	function checkAnswer() {
		if (isAdvancing) return;

		// Gestion du type de réponse "comparaison" (<, =, >)
		if (currentExercise.type === 'comparison') {
			if (userAnswer.trim() === currentExercise.correctAnswer) {
				feedback = t('feedback.correct');
				score += 1;
				isAdvancing = true;
				setTimeout(nextExercise, 1500);
			} else {
				feedback = t('feedback.wrong');
			}
			return;
		}

		// Gestion de la saisie numérique classique (numérateur)
		const val = parseInt(userAnswer);
		if (isNaN(val)) {
			feedback = "S'il te plaît, écris un nombre.";
			return;
		}

		const targetNumerator = typeof currentExercise.correctAnswer === 'object' 
			? currentExercise.correctAnswer.numerator 
			: 0;

		if (val === targetNumerator) {
			feedback = t('feedback.correct');
			score += 1;
			isAdvancing = true;
			setTimeout(nextExercise, 1500);
		} else {
			feedback = t('feedback.wrong');
		}
	}

	// Passage à la question suivante ou fin du boss
	function nextExercise() {
		currentStep += 1;
		
		if (currentStep >= totalExercises) {
			// Victoire au boss si le score est suffisant (ex: 10/15 minimum)
			onComplete();
			return;
		}

		feedback = "";
		userAnswer = "";
		isAdvancing = false;
		currentExercise = generateBossExercise();
		
		setTimeout(() => {
			if (inputRef) {
				inputRef.focus();
				inputRef.value = "";
			}
		}, 50);
	}

	function readQuestion() {
		AudioManager.speak(currentExercise.question);
	}

	onMount(() => {
		setTimeout(() => inputRef?.focus(), 100);
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				checkAnswer();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});
</script>

<div class="boss-container">
	<div class="boss-header-info">
		<h2>⚡ Boss Intermédiaire (Bilan Étages 1-5) ⚡</h2>
		<div class="score-board">
			Question : {currentStep + 1} / {totalExercises} | Score : {score}
		</div>
	</div>

	<div class="exercise-box">
		<div class="header-row">
			<h3 style="margin: 0;">{currentExercise.question}</h3>
			<button class="audio-btn" onclick={readQuestion} title="Lire la consigne">🔊</button>
		</div>
		
		<div class="viz-box">
			{#key currentExercise}
				<div class="viz-wrapper">
					{#if currentExercise.type === 'number_line' && currentExercise.fractions}
						<NumberLine {...currentExercise.fractions[0]} />
					{:else if currentExercise.type === 'comparison' && currentExercise.fractions}
						<div style="display: flex; gap: 20px; align-items: center;">
							<FractionBar 
								numerator={currentExercise.fractions[0].numerator} 
								denominator={currentExercise.fractions[0].denominator} 
								showLabel={true}
								width={140}
							/>
							<span style="font-size: 1.5rem; font-weight: bold;">?</span>
							<FractionBar 
								numerator={currentExercise.fractions[1].numerator} 
								denominator={currentExercise.fractions[1].denominator} 
								showLabel={true}
								width={140}
							/>
						</div>
					{:else}
						<FractionBar 
							numerator={currentExercise.fractions?.[0]?.numerator ?? 1} 
							denominator={currentExercise.fractions?.[0]?.denominator ?? 2} 
							showLabel={false}
							width={200}
						/>
					{/if}
				</div>
			{/key}
		</div>

		{#if currentExercise.type === 'comparison'}
			<div style="display: flex; gap: 10px; margin: 10px 0;">
				<button class="btn-symbol" onclick={() => { userAnswer = '<'; checkAnswer(); }}>&lt;</button>
				<button class="btn-symbol" onclick={() => { userAnswer = '='; checkAnswer(); }}>=</button>
				<button class="btn-symbol" onclick={() => { userAnswer = '>'; checkAnswer(); }}>&gt;</button>
			</div>
		{:else}
			<div class="fraction-input-container">
				<div class="numerator-input-wrapper">
					<input 
						type="text" 
						inputmode="numeric"
						bind:this={inputRef} 
						bind:value={userAnswer} 
						placeholder="?"
					/>
				</div>
				<div class="fraction-bar"></div>
				<div class="denominator-display">
					{currentExercise.fractions?.[0]?.denominator ?? 2}
				</div>
			</div>
			<button class="btn" onclick={checkAnswer} disabled={isAdvancing}>Vérifier</button>
		{/if}

		<p class="feedback">{feedback}</p>
	</div>
</div>

<style>
	.boss-container { display: flex; flex-direction: column; align-items: center; gap: 15px; font-family: sans-serif; }
	.boss-header-info { text-align: center; color: #c0392b; }
	.score-board { font-weight: bold; font-size: 1.1rem; color: #555; margin-top: 5px; }
	.exercise-box { display: flex; flex-direction: column; align-items: center; gap: 20px; background: #fff; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(192,57,43,0.2); border: 2px solid #e74c3c; text-align: center; width: 100%; max-width: 600px; }
	.header-row { display: flex; align-items: center; gap: 10px; }
	.audio-btn { background: #eee; border: 1px solid #ccc; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1rem; }
	.viz-box { padding: 15px; background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; min-height: 160px; display: flex; justify-content: center; align-items: center; width: 100%; }
	.viz-wrapper { display: flex; justify-content: center; align-items: center; width: 100%; }

	.fraction-input-container { display: inline-flex; flex-direction: column; align-items: center; gap: 6px; margin: 10px 0; }
	.numerator-input-wrapper input { width: 70px; height: 50px; font-size: 2rem; text-align: center; padding: 5px; border: 2px solid #e74c3c; border-radius: 8px; background: #fcfcfc; }
	.fraction-bar { width: 80px; height: 3px; background-color: #333; border-radius: 2px; }
	.denominator-display { font-size: 2rem; font-weight: bold; color: #333; }

	.btn { padding: 12px 30px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold; }
	.btn:hover { background: #c0392b; }
	.btn-symbol { padding: 15px 25px; font-size: 1.5rem; font-weight: bold; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; }
	.btn-symbol:hover { background: #c0392b; }
	.feedback { font-weight: bold; min-height: 1.5em; color: #444; }
</style>