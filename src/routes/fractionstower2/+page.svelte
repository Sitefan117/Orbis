<script>
	// Page d’accueil légère : le bouton ouvre la vraie partie dans la route /play.
	import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
</script>

<!-- Présentation du jeu et lien direct vers l’aventure. -->
<div class="container">
	<a href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base} class="orbis-link">↩ Retour aux jeux</a>
	<h1>Fractions Tower</h1>
	<p>Bienvenue dans la tour des fractions !</p>
	<a href={base + '/fractionstower2/play'} class="btn">Commencer l'aventure</a>
</div>

<style>
	/* Mise en page autonome de cette page d’accueil. */
	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		font-family: sans-serif;
		gap: 20px;
	}
	.orbis-link {
		position: absolute;
		top: 18px;
		left: 18px;
		padding: 9px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		color: #172033;
		text-decoration: none;
		font-weight: 700;
	}
	.orbis-link:hover, .orbis-link:focus-visible { background: #eef2ff; }
	h1 {
		font-size: 3rem;
		color: #333;
	}
	.btn {
		padding: 10px 20px;
		background: #4CAF50;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: bold;
	}
</style>
