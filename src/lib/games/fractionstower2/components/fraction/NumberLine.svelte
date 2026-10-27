<script lang="ts">
	// -----------------------------------------------------------------------------
	// COMPOSANT DROITE GRADUÉE
	// Permet de visualiser et de placer des fractions sur une ligne.
	// -----------------------------------------------------------------------------

	let { 
		min = 0, 
		max = 1, 
		denominator = 4, 
		value = 0.5, 
		width = 400 
	} = $props<{
		min?: number;
		max?: number;
		denominator?: number;
		value?: number;
		width?: number;
	}>();

	// Calcul de la position X d'une valeur
	function getX(val: number) {
		return ((val - min) / (max - min)) * width;
	}
</script>

<div class="number-line-container" style="width: {width}px;">
	<div class="line">
		<!-- Graduations -->
		{#each Array(denominator + 1) as _, i}
			<div 
				class="tick" 
				style="left: {getX(min + (i * (max - min)) / denominator)}px;"
			>
				<span class="tick-label">{(min + (i * (max - min)) / denominator).toFixed(1)}</span>
			</div>
		{/each}

		<!-- Marqueur de la valeur actuelle -->
		<div 
			class="marker" 
			style="left: {getX(value)}px;"
		>
			<div class="pointer"></div>
		</div>
	</div>
</div>

<style>
	.number-line-container {
		position: relative;
		margin: 40px 0;
		padding: 20px 0;
	}

	.line {
		position: relative;
		height: 4px;
		background: #333;
		width: 100%;
	}

	.tick {
		position: absolute;
		top: 0;
		width: 2px;
		height: 15px;
		background: #333;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tick-label {
		position: absolute;
		top: 15px;
		font-size: 12px;
		transform: translateX(-50%);
		font-family: monospace;
	}

	.marker {
		position: absolute;
		top: -10px;
		width: 0;
		height: 24px;
		z-index: 10;
		transform: translateX(-50%);
	}

	.pointer {
		width: 12px;
		height: 12px;
		background: #e74c3c;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0,0,0,0.3);
	}
</style>
