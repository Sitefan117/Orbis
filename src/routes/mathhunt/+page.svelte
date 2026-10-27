<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
    import { TableHuntGame } from '$lib/games/mathhunt/engine.js';

    // État de l'interface Svelte. Les choix commencent avec les 12 livrets actifs.
    let canvas;
    let game = null;
    let phase = 'menu'; // 'menu', 'playing' ou 'victory'
    let selectedTables = Array.from({ length: 12 }, (_, index) => index + 1);
    let difficulty = 'FACILE';
    let movementOn = true;
    let soundEnabled = true;
    let currentQuestion = null;
    let correctHits = 0;
    let totalShots = 0;
    let helpVisible = false;
    let finalAccuracy = 100;
    let finalStars = '★ ★ ★ ★ ★';

    const ALL_TABLES = Array.from({ length: 12 }, (_, index) => index + 1);
    const CANVAS_WIDTH = 320;
    const CANVAS_HEIGHT = 180;

    // Centralise les modifications envoyées par le jeu Canvas vers l'interface Svelte.
    function handleGameState(state) {
        if (currentQuestion !== state.currentQuestion) {
            // Un nouvel indice doit être demandé pour chaque nouvelle question.
            helpVisible = false;
        }
        phase = state.phase;
        currentQuestion = state.currentQuestion;
        correctHits = state.correctHits;
        totalShots = state.totalShots;
        if (state.phase === 'victory') {
            finalAccuracy = state.accuracy;
            finalStars = state.stars;
        }
    }

    function syncSettingsToGame() {
        if (!game) return;
        // Le moteur conserve les réglages de la partie ; on les met à jour avant de lancer.
        game.selectedTables = [...selectedTables];
        game.difficulty = difficulty;
        game.movementOn = movementOn;
        game.audio.enabled = soundEnabled;
    }

    function toggleTable(table) {
        selectedTables = selectedTables.includes(table)
            ? selectedTables.filter((item) => item !== table)
            : [...selectedTables, table].sort((a, b) => a - b);
    }

    function selectAllTables() {
        selectedTables = [...ALL_TABLES];
    }

    function deselectAllTables() {
        selectedTables = [];
    }

    function toggleDifficulty() {
        difficulty = difficulty === 'FACILE' ? 'ACCRUE' : 'FACILE';
    }

    function toggleMovement() {
        movementOn = !movementOn;
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        if (game) game.audio.enabled = soundEnabled;
    }

    function startGame() {
        if (!game || selectedTables.length === 0) return;
        syncSettingsToGame();
        game.audio.init();
        game.startGame();
    }

    function returnToMenu() {
        // Stoppe immédiatement le jeu et toute transition différée en cours.
        game?.stopToMenu();
        helpVisible = false;
        phase = 'menu';
    }

    function toggleHelp() {
        if (phase === 'playing' && currentQuestion) helpVisible = !helpVisible;
    }

    // Construit les deux tables complètes liées au calcul actuel, sans indiquer la bonne réponse.
    function helpTables() {
        if (!currentQuestion) return [];
        const factors = [...new Set([currentQuestion.factorA, currentQuestion.factorB])];
        return factors.map((table) => ({
            table,
            rows: Array.from({ length: 12 }, (_, index) => ({
                multiplier: index + 1,
                result: table * (index + 1)
            }))
        }));
    }

    onMount(() => {
    // Permet de savoir si le composant a été démonté pendant le chargement.
    let disposed = false;

    // Échap interrompt la partie sans modifier la sélection des livrets.
    const onKeyDown = (event) => {
        if (event.key === 'Escape' && phase === 'playing') {
            event.preventDefault();
            returnToMenu();
        }
    };

    window.addEventListener('keydown', onKeyDown);

    // Charge réellement la police avant le premier dessin du jeu Canvas.
    const initializeGame = async () => {
        try {
            await document.fonts.load('8px "Press Start 2P"');
            await document.fonts.ready;
        } catch (error) {
            // Si le chargement échoue, le jeu démarre avec la police de remplacement.
            console.warn('Impossible de charger Press Start 2P :', error);
        }

        // Empêche de créer le jeu si l'utilisateur a quitté la page entre-temps.
        if (disposed) return;

        game = new TableHuntGame(canvas, handleGameState);
    };

    // Lance l'initialisation sans bloquer le retour de onMount.
    void initializeGame();

    return () => {
        // Annule l'initialisation si elle n'est pas encore terminée.
        disposed = true;

        window.removeEventListener('keydown', onKeyDown);
        game?.destroy();
        game = null;
    };
});
</script>

<svelte:head>
    <title>TABLE HUNT — Jeu de tir sur les multiplications</title>
    <meta name="description" content="Un jeu d'arcade pixel-art pour s'entraîner aux tables de multiplication." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
</svelte:head>

<main class="page-shell">
    <div class="page-topbar">
        <a class="orbis-top-link" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base} aria-label="Retour aux jeux">↩ ORBIS</a>
        <span class="topbar-label">ARCADE MATHS</span>
    </div>

    <section class="arcade-frame" aria-label="Jeu TABLE HUNT">
        <div class="game-stage">
            <canvas
                bind:this={canvas}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                class:playing-cursor={phase === 'playing'}
                aria-label="Terrain de jeu : clique ou touche un canard pour choisir une réponse."
            ></canvas>
            <div class="scanlines" aria-hidden="true"></div>

            {#if phase === 'menu'}
                <div class="overlay menu-overlay">
                    <header class="menu-heading">
                        <h1>TABLE HUNT</h1>
                        <p>JEU DE TIR ARCADE SUR LES MULTIPLICATIONS</p>
                    </header>

                    <section class="table-picker" aria-label="Choix des livrets">
                        <div class="section-title-row">
                            <span class="section-title">LIVRETS À CHASSER :</span>
                            <div class="selection-actions">
                                <button class="mini-button" type="button" onclick={selectAllTables}>TOUT</button>
                                <button class="mini-button" type="button" onclick={deselectAllTables}>AUCUN</button>
                            </div>
                        </div>
                        <div class="table-grid">
                            {#each ALL_TABLES as table}
                                <button
                                    type="button"
                                    class="pixel-btn table-tile"
                                    class:active={selectedTables.includes(table)}
                                    aria-pressed={selectedTables.includes(table)}
                                    onclick={() => toggleTable(table)}
                                >×{table}</button>
                            {/each}
                        </div>
                        {#if selectedTables.length === 0}
                            <p class="table-warning" role="alert">SÉLECTIONNE AU MOINS UN LIVRET !</p>
                        {/if}
                    </section>

                    <section class="settings-grid" aria-label="Réglages de la partie">
                        <div class="setting-card">
                            <span>DIFFICULTÉ</span>
                            <button type="button" class="pixel-btn setting-button" onclick={toggleDifficulty}>{difficulty}</button>
                        </div>
                        <div class="setting-card">
                            <span>MOUVEMENT</span>
                            <button type="button" class="pixel-btn setting-button" aria-pressed={movementOn} onclick={toggleMovement}>{movementOn ? 'ON' : 'OFF'}</button>
                        </div>
                        <div class="setting-card">
                            <span>SONS</span>
                            <button type="button" class="pixel-btn setting-button" aria-pressed={soundEnabled} onclick={toggleSound}>{soundEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                    </section>

                    <button type="button" class="pixel-btn active start-button" disabled={selectedTables.length === 0} onclick={startGame}>
                        &gt;&gt; START GAME &lt;&lt;
                    </button>
                </div>
            {:else if phase === 'victory'}
                <div class="overlay victory-overlay">
                    <section class="victory-card">
                        <h2>PARTIE TERMINÉE !</h2>
                        <div class="star-rating" aria-label={`Résultat : ${finalStars}`}>{finalStars}</div>
                        <div class="results-panel">
                            <div><span>OBJECTIF :</span><strong>10 / 10 RÉUSSIS</strong></div>
                            <div><span>TIRS TOTAUX :</span><strong>{totalShots}</strong></div>
                            <div><span>PRÉCISION :</span><strong class="accuracy">{finalAccuracy}%</strong></div>
                        </div>
                        <div class="victory-actions">
                            <button type="button" class="pixel-btn active" onclick={startGame}>REJOUER</button>
                            <button type="button" class="pixel-btn" onclick={returnToMenu}>MENU</button>
                        </div>
                    </section>
                </div>
            {/if}
        </div>

        {#if phase === 'playing'}
            <!-- Ligne de commandes séparée sous le terrain pour les tablettes tactiles. -->
            <div class="game-action-row">
                <button type="button" class="pixel-btn help-button" aria-pressed={helpVisible} onclick={toggleHelp}>? AIDE</button>
                <button type="button" class="pixel-btn quit-button" onclick={returnToMenu} aria-label="Interrompre la partie et revenir au menu des livrets">× MENU DES LIVRETS</button>
                {#if helpVisible}
                    <section class="help-message" role="status" aria-label="Tables de multiplication utiles">
                        <h2>TABLES POUR T’AIDER</h2>
                        <div class="help-tables">
                            {#each helpTables() as helpTable}
                                <div class="help-table">
                                    <h3>TABLE DE {helpTable.table}</h3>
                                    <div class="help-table-rows">
                                        {#each helpTable.rows as row}
                                            <p>{helpTable.table} × {row.multiplier} = {row.result}</p>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>
        {/if}
    </section>

    <p class="page-footer">TABLE HUNT <span>•</span> CHOISIS LA BONNE RÉPONSE !</p>
</main>

<style>
    .page-shell,
    .page-shell :global(*) {
        box-sizing: border-box;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent;
    }

    .page-shell :global(button) { font: inherit; }

    .page-shell {
        min-width: 280px;
        background: #0b0e14;
        color: #ffffff;
        font-family: 'Press Start 2P', monospace, cursive;
    }
    .page-shell {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.85rem;
        padding: clamp(0.5rem, 2vw, 1.25rem);
    }

    .page-topbar {
        width: min(100%, 960px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .topbar-label {
        color: #a3a7c2;
        font-size: clamp(0.45rem, 1vw, 0.65rem);
        text-align: right;
    }

    .orbis-top-link {
        color: #c5c8dc;
        font-size: clamp(0.45rem, 1vw, 0.65rem);
        text-decoration: none;
        border: 1px solid #49415f;
        padding: 0.65rem 0.8rem;
        background: #171521;
    }

    .orbis-top-link:hover,
    .orbis-top-link:focus-visible {
        color: #fff;
        border-color: #a78bfa;
        background: #252137;
    }

    .arcade-frame {
        position: relative;
        width: min(100%, 960px);
        overflow: hidden;
        background: #000000;
        border: 4px solid #3b2d54;
        outline: 3px solid #000000;
        box-shadow: inset 0 0 10px rgb(0 0 0 / 80%) !important;
    }

    .game-stage {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        background: #000000;
    }

    canvas {
        display: block;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        touch-action: none;
    }

    canvas.playing-cursor { cursor: crosshair; }

    .scanlines {
        position: absolute;
        z-index: 2;
        inset: 0;
        pointer-events: none;
        background:
            linear-gradient(rgb(18 16 16 / 0%) 50%, rgb(0 0 0 / 25%) 50%),
            linear-gradient(90deg, rgb(255 0 0 / 3%), rgb(0 255 0 / 1%), rgb(0 0 255 / 3%));
        background-size: 100% 3px, 6px 100%;
    }

    .overlay {
        position: absolute;
        z-index: 5;
        inset: 0;
        overflow-y: auto;
        background: rgb(15 10 28 / 97%);
        text-align: center;
        scrollbar-color: #3b2d54 #0f0a1c;
    }

    .menu-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: clamp(0.5rem, 1.5vw, 0.9rem);
        padding: clamp(0.7rem, 2.3vw, 1.5rem);
    }

    .menu-heading h1 {
        margin: 0;
        color: #f6a000;
        font-size: clamp(0.95rem, 3.2vw, 2rem);
        line-height: 1.5;
        letter-spacing: 0.06em;
        text-shadow: 3px 3px #000000;
    }

    .menu-heading p {
        margin: 0.25rem 0 0;
        color: #a3a7c2;
        font-size: clamp(0.36rem, 0.9vw, 0.65rem);
        line-height: 1.7;
    }

    .table-picker {
        width: min(100%, 600px);
        margin: 0.15rem 0;
    }

    .section-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.45rem;
        margin-bottom: 0.55rem;
    }

    .section-title {
        color: #52b141;
        font-size: clamp(0.43rem, 1.05vw, 0.72rem);
        text-align: left;
    }

    .selection-actions { display: flex; gap: 0.35rem; }

    .mini-button {
        min-height: 30px;
        padding: 0.4rem 0.55rem;
        border: 1px solid #a3a7c2;
        background: #1d1d2c;
        color: #ffffff;
        font-size: clamp(0.4rem, 0.85vw, 0.58rem);
        cursor: pointer;
        touch-action: manipulation;
    }

    .mini-button:hover { background: #32324e; }

    .table-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: clamp(0.3rem, 0.8vw, 0.55rem);
    }

    .pixel-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        border: 3px solid #f6d6bd;
        border-radius: 0;
        background: #2b2b45;
        color: #f6d6bd;
        text-align: center;
        text-shadow: 2px 2px #000000;
        cursor: pointer;
        transition: transform 0.1s, background-color 0.1s;
        touch-action: manipulation;
    }

    .pixel-btn:hover:not(:disabled) { background: #434366; transform: scale(1.02); }
    .pixel-btn:active:not(:disabled) { transform: scale(0.97); background: #f6d6bd; color: #121013; text-shadow: none; }
    .pixel-btn.active { background: #e2443a; color: #ffffff; border-color: #ffffff; }
    .pixel-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .pixel-btn:focus-visible, .mini-button:focus-visible { outline: 3px solid #52b141; outline-offset: 3px; }

    .table-tile {
        min-height: clamp(32px, 4.8vw, 48px);
        padding: 0.45rem 0.2rem;
        font-size: clamp(0.53rem, 1.1vw, 0.78rem);
    }

    .table-warning {
        margin: 0.5rem 0 0;
        color: #e2443a;
        font-size: clamp(0.42rem, 0.9vw, 0.6rem);
        line-height: 1.7;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(0.35rem, 1vw, 0.75rem);
        width: min(100%, 600px);
    }

    .setting-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: clamp(0.45rem, 1vw, 0.7rem);
        border: 1px solid #3b2d54;
        background: #18132b;
        font-size: clamp(0.4rem, 0.9vw, 0.63rem);
    }

    .setting-card > span { color: #f6a000; }
    .setting-button { width: 100%; min-height: 35px; padding: 0.45rem 0.25rem; font-size: clamp(0.43rem, 0.95vw, 0.66rem); }

    .start-button {
        width: min(100%, 600px);
        min-height: 44px;
        margin-top: 0.1rem;
        padding: 0.75rem 1rem;
        font-size: clamp(0.55rem, 1.4vw, 0.95rem);
        animation: pulse-border 1.6s infinite;
    }

    .game-action-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.6rem;
        padding: 0.65rem;
        border-top: 3px solid #3b2d54;
        background: #0f0a1c;
    }

    .game-action-row .pixel-btn {
        min-height: 48px;
        padding: 0.65rem 0.8rem;
        font-size: clamp(0.55rem, 1.2vw, 0.8rem);
    }

    .help-button { color: #f6a000; }
    .quit-button { border-color: #e2443a; color: #ffffff; }
    .quit-button:hover:not(:disabled) { background: #8e2525; }

    .help-message {
        grid-column: 1 / -1;
        margin: 0;
        padding: 0.8rem;
        border: 1px solid #52b141;
        background: #142417;
        color: #a5ef91;
        overflow-wrap: anywhere;
    }

    .help-message h2 {
        margin: 0 0 0.75rem;
        color: #f6a000;
        font-size: clamp(0.55rem, 1.1vw, 0.75rem);
        line-height: 1.7;
    }

    .help-tables {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        text-align: left;
    }

    .help-table {
        min-width: 0;
        padding: 0.55rem;
        border: 1px solid #3b2d54;
        background: #0d0918;
    }

    .help-table h3 {
        margin: 0 0 0.5rem;
        color: #f6d6bd;
        font-size: clamp(0.48rem, 0.95vw, 0.65rem);
        line-height: 1.7;
    }

    .help-table-rows {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.25rem 0.5rem;
    }

    .help-table-rows p {
        margin: 0;
        padding: 0.3rem 0.2rem;
        color: #a3a7c2;
        font-size: clamp(0.7rem, 1.2vw, 0.9rem);
        font-weight: 700;
        line-height: 1.4;
        white-space: nowrap;
    }

    .victory-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(0.6rem, 2vw, 1.5rem);
    }

    .victory-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(0.55rem, 1.5vw, 1rem);
        width: min(100%, 560px);
        padding: clamp(0.65rem, 2vw, 1.5rem);
        border: 4px solid #f6a000;
        background: #18132b;
    }

    .victory-card h2 {
        margin: 0;
        color: #f6d6bd;
        font-size: clamp(0.65rem, 2vw, 1.3rem);
        line-height: 1.8;
    }

    .star-rating { color: #f6a000; font-size: clamp(0.7rem, 2vw, 1.3rem); line-height: 1.6; }

    .results-panel {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        width: 100%;
        padding: clamp(0.65rem, 1.6vw, 1rem);
        border: 1px solid #3b2d54;
        background: #0d0918;
        font-size: clamp(0.42rem, 1vw, 0.68rem);
    }

    .results-panel > div { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
    .results-panel span { color: #a3a7c2; }
    .results-panel strong { color: #52b141; text-align: right; }
    .results-panel .accuracy { color: #f6a000; }

    .victory-actions { display: flex; gap: 0.6rem; width: 100%; }
    .victory-actions .pixel-btn { flex: 1; min-height: 42px; padding: 0.55rem 0.4rem; font-size: clamp(0.45rem, 1vw, 0.68rem); }

    .page-footer { margin: 0.15rem 0 0; color: #747994; font-size: clamp(0.38rem, 0.8vw, 0.55rem); text-align: center; line-height: 1.8; }
    .page-footer span { color: #f6a000; }

    @keyframes pulse-border {
        0%, 100% { box-shadow: 0 0 0 0 rgb(226 68 58 / 0%) !important; }
        50% { box-shadow: 0 0 0 3px rgb(226 68 58 / 22%) !important; }
    }

    @media (min-width: 560px) {
        .table-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }

    @media (max-width: 480px) {
        .page-shell { justify-content: flex-start; gap: 0.6rem; padding: 0.6rem; }
        .arcade-frame { border-width: 3px; }
        .menu-overlay { justify-content: flex-start; }
        .settings-grid { gap: 0.3rem; }
        .setting-card { gap: 0.4rem; padding: 0.5rem 0.25rem; }
        .game-action-row { gap: 0.4rem; padding: 0.5rem; }
        .help-tables { gap: 0.4rem; }
        .help-table { padding: 0.35rem; }
        .help-table-rows { grid-template-columns: 1fr; gap: 0.15rem; }
        .game-action-row .pixel-btn { min-height: 46px; }
    }

    @media (prefers-reduced-motion: reduce) {
        .start-button { animation: none; }
        .pixel-btn { transition: none; }
    }
</style>
