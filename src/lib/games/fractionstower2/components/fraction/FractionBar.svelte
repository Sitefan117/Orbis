<script lang="ts">
	// -----------------------------------------------------------------------------
	// COMPOSANT BARRE DE FRACTION
	// Représente visuellement une fraction sous forme de barre linéaire.
	// -----------------------------------------------------------------------------

	import Fraction from '$lib/games/fractionstower2/components/fraction/Fraction.svelte';

	let { numerator = 0, denominator = 1, color = '#3498db', width = 200, showLabel = true } = $props<{
		numerator?: number;
		denominator?: number;
		color?: string;
		width?: number;
		showLabel?: boolean;
	}>();

	// Calcul de la largeur d'un segment
	let segmentWidth = $derived(width / denominator);
</script>

<div class="fraction-bar-container" style="width: {width}px;">
	<div class="bar-background">
		{#each Array(denominator) as _, i}
			<div class="segment" style="width: {segmentWidth}px;">
				{#if i < numerator}
					<div class="segment-fill" style="background-color: {color};"></div>
				{/if}
			</div>
		{/each}
	</div>
	{#if showLabel}
		<div class="label">
			<Fraction numerator={numerator} denominator={denominator} />
		</div>
	{/if}
</div>

<style>
	.fraction-bar-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		margin: 10px 0;
	}

	.bar-background {
		display: flex;
		border: 2px solid #333;
		border-radius: 4px;
		overflow: hidden;
		background: white;
		height: 30px;
	}

	.segment {
		position: relative;
		border-right: 1px solid #ccc;
		height: 100%;
	}

	.segment:last-child {
		border-right: none;
	}

	.segment-fill {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.label {
		font-weight: bold;
		font-family: monospace;
		font-size: 1.1rem;
		display: flex;
		justify-content: center;
	}
</style>
