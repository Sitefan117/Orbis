<script lang="ts">
	// -----------------------------------------------------------------------------
	// COMPOSANT FRACTION SYMBOLE
	// Affiche une fraction de manière mathématique (verticale).
	// -----------------------------------------------------------------------------

	type FractionSize = 'small' | 'medium' | 'large';
	type FractionProps = {
		numerator?: number;
		denominator?: number;
		size?: FractionSize;
	};
	let { numerator = undefined, denominator = 1, size = 'medium' }: FractionProps = $props();

	const sizeClasses: Record<FractionSize, string> = {
		small: 'text-sm',
		medium: 'text-base',
		large: 'text-xl'
	};
</script>

<div class="fraction {sizeClasses[size ?? 'medium']}" style="display: inline-flex; vertical-align: middle;">
	<div class="frac-container">
		<div class="num">{numerator !== undefined ? numerator : ''}</div>
		<div class="line"></div>
		<div class="den">{denominator}</div>
	</div>
</div>

<style>
	.frac-container {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		vertical-align: middle;
		line-height: 1;
	}
	.num {
		text-align: center;
		padding: 0 2px;
		min-height: 1em;
	}
	.line {
		width: 100%;
		height: 2px;
		background: currentColor;
		margin: 1px 0;
	}
	.den {
		text-align: center;
		padding: 0 2px;
		min-height: 1em;
	}
	.text-sm { font-size: 0.8rem; }
	.text-base { font-size: 1.1rem; }
	.text-xl { font-size: 1.5rem; }
</style>
