<script>
    import { onMount } from 'svelte';

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
    const TARGET_SCORE = 10;

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

    // Audio rétro : sons synthétiques générés par Web Audio, sans fichiers externes.
    class RetroAudioEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            try {
                if (!this.ctx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) this.ctx = new AudioContextClass();
                }
                if (this.ctx?.state === 'suspended') this.ctx.resume();
            } catch (error) {
                console.warn('Web Audio API warning:', error);
            }
        }

        playTone(type, frequency, endFrequency, duration, volume = 0.2, startTime = null) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = startTime ?? this.ctx.currentTime;
            const oscillator = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, now);
            if (endFrequency !== null) {
                oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
            }
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            oscillator.connect(gain);
            gain.connect(this.ctx.destination);
            oscillator.start(now);
            oscillator.stop(now + duration);
        }

        playShoot() { this.playTone('sawtooth', 600, 40, 0.15); }

        playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
                this.playTone('square', frequency, null, 0.1, 0.15, now + index * 0.05);
            });
        }

        playMiss() { this.playTone('triangle', 150, 60, 0.2); }

        playVictory() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const notes = [
                { frequency: 440, duration: 0.1 },
                { frequency: 554, duration: 0.1 },
                { frequency: 659, duration: 0.1 },
                { frequency: 880, duration: 0.3 }
            ];
            let time = this.ctx.currentTime;
            notes.forEach((note) => {
                this.playTone('square', note.frequency, null, note.duration, 0.2, time);
                time += note.duration + 0.02;
            });
        }

        destroy() {
            if (this.ctx && this.ctx.state !== 'closed') this.ctx.close();
        }
    }

    // Génère un calcul et quatre réponses possibles, comme dans la version d'origine.
    class QuestionGenerator {
        static generate(tables, selectedDifficulty) {
            const availableTables = tables?.length ? tables : ALL_TABLES;
            const table = availableTables[Math.floor(Math.random() * availableTables.length)];
            const multiplier = Math.floor(Math.random() * 12) + 1;
            const swap = Math.random() < 0.5;
            const factorA = swap ? multiplier : table;
            const factorB = swap ? table : multiplier;
            const correctAnswer = factorA * factorB;
            const wrongAnswers = new Set();

            if (selectedDifficulty === 'FACILE') {
                while (wrongAnswers.size < 3) {
                    const delta = (Math.floor(Math.random() * 20) + 1) * (Math.random() < 0.5 ? 1 : -1);
                    const candidate = Math.max(1, correctAnswer + delta);
                    if (candidate !== correctAnswer) wrongAnswers.add(candidate);
                }
            } else {
                const candidates = [
                    correctAnswer + 1, correctAnswer - 1,
                    correctAnswer + 2, correctAnswer - 2,
                    (factorA + 1) * factorB, (factorA - 1) * factorB,
                    factorA * (factorB + 1), factorA * (factorB - 1),
                    correctAnswer + factorA, correctAnswer - factorB
                ].sort(() => Math.random() - 0.5);

                for (const candidate of candidates) {
                    if (candidate > 0 && candidate !== correctAnswer) wrongAnswers.add(candidate);
                    if (wrongAnswers.size === 3) break;
                }
                while (wrongAnswers.size < 3) {
                    const candidate = Math.max(1, correctAnswer + Math.floor(Math.random() * 10) - 5);
                    if (candidate !== correctAnswer) wrongAnswers.add(candidate);
                }
            }

            const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
            return { factorA, factorB, correctAnswer, choices };
        }
    }

    // Canard dessiné en pixels sur le canvas ; sa vitesse de déplacement est réduite de 50 %.
    class Duck {
        constructor(id, value, isCorrect, x, y, isMoving) {
            this.id = id;
            this.value = value;
            this.isCorrect = isCorrect;
            this.x = x;
            this.y = y;
            this.width = 28;
            this.height = 24;
            const SPEED_FACTOR = 0.5; // Modification demandée : moitié de la vélocité d'origine.
            this.vx = isMoving
                ? (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.4) * SPEED_FACTOR
                : 0;
            this.vy = isMoving
                ? (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.3) * SPEED_FACTOR
                : 0;
            this.frame = 0;
            this.animTimer = 0;
            this.facingRight = this.vx >= 0;
            this.state = 'ALIVE';
            this.rotation = 0;
            this.fallSpeed = 0;
        }

        update(delta) {
            if (this.state === 'ALIVE') {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 15 || this.x > CANVAS_WIDTH - 45) {
                    this.vx *= -1;
                    this.facingRight = this.vx >= 0;
                }
                if (this.y < 35 || this.y > CANVAS_HEIGHT - 65) this.vy *= -1;
                this.animTimer += delta;
                if (this.animTimer > 0.15) {
                    this.frame = (this.frame + 1) % 4;
                    this.animTimer = 0;
                }
            } else if (this.state === 'HIT') {
                this.rotation += 0.2;
                this.fallSpeed += 0.25;
                this.y += this.fallSpeed;
                if (this.y > CANVAS_HEIGHT + 30) this.state = 'DEAD';
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(Math.floor(this.x + this.width / 2), Math.floor(this.y + this.height / 2));
            if (this.rotation !== 0) ctx.rotate(this.rotation);
            if (!this.facingRight) ctx.scale(-1, 1);

            // Corps, tête, aile et bec : formes simples à l'esthétique pixel-art de l'original.
            ctx.fillStyle = '#24802c';
            ctx.fillRect(-6, -12, 10, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -10, 2, 2);
            ctx.fillStyle = '#000000';
            ctx.fillRect(1, -10, 1, 1);
            ctx.fillStyle = '#f6a000';
            ctx.fillRect(4, -8, 6, 3);
            ctx.fillStyle = '#805300';
            ctx.fillRect(-10, -4, 18, 10);
            ctx.fillRect(-12, -2, 2, 6);
            ctx.fillStyle = '#a8731d';
            if (this.frame === 0) ctx.fillRect(-4, -12, 6, 8);
            else if (this.frame === 1 || this.frame === 3) ctx.fillRect(-6, -3, 10, 5);
            else ctx.fillRect(-4, 2, 6, 7);
            ctx.restore();

            // Plaque numérique sous chaque canard.
            ctx.save();
            const plaqueWidth = 26;
            const plaqueHeight = 12;
            const plaqueX = Math.floor(this.x + (this.width - plaqueWidth) / 2);
            const plaqueY = Math.floor(this.y + this.height + 2);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + 6, this.y + 10);
            ctx.lineTo(plaqueX + 4, plaqueY);
            ctx.moveTo(this.x + this.width - 6, this.y + 10);
            ctx.lineTo(plaqueX + plaqueWidth - 4, plaqueY);
            ctx.stroke();
            ctx.fillStyle = '#000000';
            ctx.fillRect(plaqueX - 1, plaqueY - 1, plaqueWidth + 2, plaqueHeight + 2);
            ctx.fillStyle = '#f6d6bd';
            ctx.fillRect(plaqueX, plaqueY, plaqueWidth, plaqueHeight);
            ctx.fillStyle = '#000000';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.value), plaqueX + plaqueWidth / 2, plaqueY + plaqueHeight / 2 + 1);
            ctx.restore();
        }

        containsPoint(px, py) {
            return px >= this.x - 4 && px <= this.x + this.width + 4 &&
                py >= this.y - 12 && py <= this.y + this.height + 16;
        }
    }

    // Moteur de jeu : canvas, animations, collisions, score et sons.
    class TableHuntGame {
        constructor(canvasElement, onStateChange) {
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.audio = new RetroAudioEngine();
            this.onStateChange = onStateChange;
            this.selectedTables = [...ALL_TABLES];
            this.difficulty = 'FACILE';
            this.movementOn = true;
            this.correctHits = 0;
            this.totalShots = 0;
            this.targetScore = TARGET_SCORE;
            this.isPlaying = false;
            this.ducks = [];
            this.currentQuestion = null;
            this.effects = [];
            this.crosshairPos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
            this.transitionTimer = null;
            this.questionResolved = false;
            this.lastTime = performance.now();
            this.clouds = [
                { x: 20, y: 15, speed: 0.1 },
                { x: 120, y: 25, speed: 0.15 },
                { x: 230, y: 10, speed: 0.08 }
            ];
            this.pointerMoveHandler = (event) => this.updateAim(event);
            this.pointerDownHandler = (event) => this.handleShoot(event);
            this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
            this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }

        notify(phase, accuracy = null, stars = null) {
            this.onStateChange({
                phase,
                currentQuestion: this.currentQuestion,
                correctHits: this.correctHits,
                totalShots: this.totalShots,
                accuracy,
                stars
            });
        }

        updateAim(event) {
            const rect = this.canvas.getBoundingClientRect();
            this.crosshairPos.x = Math.floor(((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH);
            this.crosshairPos.y = Math.floor(((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT);
        }

        handleShoot(event) {
            if (!this.isPlaying) return;
            event.preventDefault();
            this.updateAim(event);
            this.shoot(this.crosshairPos.x, this.crosshairPos.y);
        }

        startGame() {
            if (!this.selectedTables.length) return;
            if (this.transitionTimer) clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
            this.correctHits = 0;
            this.totalShots = 0;
            this.effects = [];
            this.questionResolved = false;
            this.isPlaying = true;
            this.nextQuestion();
            this.notify('playing');
        }

        stopToMenu() {
            this.isPlaying = false;
            this.questionResolved = false;
            if (this.transitionTimer) clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
            this.notify('menu');
        }

        nextQuestion() {
            this.currentQuestion = QuestionGenerator.generate(this.selectedTables, this.difficulty);
            this.questionResolved = false;
            this.spawnDucks();
            this.notify('playing');
        }

        spawnDucks() {
            this.ducks = [];
            const positions = [
                { x: 40, y: 55 }, { x: 110, y: 70 },
                { x: 180, y: 50 }, { x: 250, y: 65 }
            ];
            this.currentQuestion.choices.forEach((choice, index) => {
                const position = positions[index];
                this.ducks.push(new Duck(
                    index,
                    choice,
                    choice === this.currentQuestion.correctAnswer,
                    position.x,
                    position.y,
                    this.movementOn
                ));
            });
        }

        shoot(x, y) {
            // Évite plusieurs réponses pour la même question pendant l'animation de réussite.
            if (!this.isPlaying || this.questionResolved) return;
            this.totalShots++;
            this.audio.playShoot();
            let hitSomething = false;
            for (const duck of this.ducks) {
                if (duck.state !== 'ALIVE' || !duck.containsPoint(x, y)) continue;
                hitSomething = true;
                if (duck.isCorrect) {
                    duck.state = 'HIT';
                    this.questionResolved = true;
                    this.correctHits++;
                    this.audio.playHit();
                    this.addEffect(x, y, 'HIT!', '#52b141');
                    this.notify('playing');
                    this.transitionTimer = setTimeout(() => {
                        this.transitionTimer = null;
                        if (!this.isPlaying) return; // Une sortie par Échap annule la suite de la partie.
                        if (this.correctHits >= this.targetScore) this.endGame();
                        else this.nextQuestion();
                    }, 600);
                } else {
                    this.audio.playMiss();
                    this.addEffect(x, y, 'MISS!', '#e2443a');
                }
                break;
            }
            if (!hitSomething) {
                this.audio.playMiss();
                this.addEffect(x, y, 'MISS!', '#e2443a');
            }
            this.notify('playing');
        }

        addEffect(x, y, text, color) {
            this.effects.push({ x, y, text, color, life: 1 });
        }

        endGame() {
            this.isPlaying = false;
            this.questionResolved = false;
            this.audio.playVictory();
            const accuracy = Math.round((this.correctHits / Math.max(1, this.totalShots)) * 100);
            let stars = '★ ★ ★ ★ ★';
            if (accuracy < 50) stars = '★ ★ ☆ ☆ ☆';
            else if (accuracy < 70) stars = '★ ★ ★ ☆ ☆';
            else if (accuracy < 90) stars = '★ ★ ★ ★ ☆';
            this.notify('victory', accuracy, stars);
        }

        update(delta) {
            this.clouds.forEach((cloud) => {
                cloud.x += cloud.speed;
                if (cloud.x > CANVAS_WIDTH) cloud.x = -30;
            });
            this.ducks.forEach((duck) => duck.update(delta));
            for (let index = this.effects.length - 1; index >= 0; index--) {
                const effect = this.effects[index];
                effect.y -= 0.3;
                effect.life -= 0.03;
                if (effect.life <= 0) this.effects.splice(index, 1);
            }
        }

        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Décor pixel-art original : ciel, soleil, nuages, montagnes, végétation et clôture.
            ctx.fillStyle = '#3ca0d0';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#f6d6bd';
            ctx.fillRect(260, 15, 20, 20);
            ctx.fillStyle = '#ffffff';
            this.clouds.forEach((cloud) => {
                ctx.fillRect(Math.floor(cloud.x), Math.floor(cloud.y), 24, 8);
                ctx.fillRect(Math.floor(cloud.x + 4), Math.floor(cloud.y - 4), 16, 4);
            });
            ctx.fillStyle = '#2b3f5e';
            ctx.beginPath();
            ctx.moveTo(0, 130);
            ctx.lineTo(50, 90);
            ctx.lineTo(110, 130);
            ctx.lineTo(180, 85);
            ctx.lineTo(240, 130);
            ctx.lineTo(320, 95);
            ctx.lineTo(320, 130);
            ctx.fill();
            ctx.fillStyle = '#174728';
            ctx.fillRect(0, 120, CANVAS_WIDTH, 20);
            ctx.fillStyle = '#388726';
            ctx.fillRect(0, 135, CANVAS_WIDTH, 45);
            ctx.fillStyle = '#1d5214';
            ctx.fillRect(0, 165, CANVAS_WIDTH, 15);
            ctx.fillStyle = '#7a4b22';
            for (let x = 10; x < CANVAS_WIDTH; x += 30) ctx.fillRect(x, 138, 4, 18);
            ctx.fillRect(0, 142, CANVAS_WIDTH, 3);
            ctx.fillRect(0, 150, CANVAS_WIDTH, 3);

            this.ducks.forEach((duck) => duck.draw(ctx));
            this.effects.forEach((effect) => {
                ctx.save();
                ctx.fillStyle = effect.color;
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.globalAlpha = Math.max(0, effect.life);
                ctx.fillText(effect.text, Math.floor(effect.x), Math.floor(effect.y));
                ctx.restore();
            });

            // Bandeau de score dessiné dans le canvas, comme dans la version HTML.
            ctx.fillStyle = '#0f0a1c';
            ctx.fillRect(0, 0, CANVAS_WIDTH, 24);
            ctx.fillStyle = '#3b2d54';
            ctx.fillRect(0, 23, CANVAS_WIDTH, 1);
            if (this.currentQuestion) {
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.fillStyle = '#f6a000';
                ctx.textAlign = 'left';
                ctx.fillText(`TOUCHES:${this.correctHits}/${this.targetScore}`, 6, 15);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(`${this.currentQuestion.factorA} × ${this.currentQuestion.factorB} = ?`, CANVAS_WIDTH / 2, 15);
                ctx.fillStyle = '#52b141';
                ctx.textAlign = 'right';
                ctx.fillText(`TIRS:${this.totalShots}`, CANVAS_WIDTH - 6, 15);
            }

            // Viseur visible uniquement pendant la partie.
            if (this.isPlaying) {
                const { x, y } = this.crosshairPos;
                ctx.strokeStyle = '#e2443a';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
                ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, 1, 1);
            }
        }

        gameLoop() {
            const now = performance.now();
            const delta = (now - this.lastTime) / 1000;
            this.lastTime = now;
            if (this.isPlaying) this.update(delta);
            this.render();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }

        destroy() {
            cancelAnimationFrame(this.animationId);
            if (this.transitionTimer) clearTimeout(this.transitionTimer);
            this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
            this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
            this.audio.destroy();
        }
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
    :global(*) {
        box-sizing: border-box;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent;
    }

    :global(html), :global(body) {
        min-height: 100%;
        margin: 0;
        background: #0b0e14;
        color: #ffffff;
        font-family: 'Press Start 2P', monospace, cursive;
    }

    :global(body) { min-width: 280px; }
    :global(button) { font: inherit; }
/* Utilise la police pixelisée sur tous les éléments de TABLE HUNT. */
.page-shell,
.page-shell :global(*) {
    font-family: 'Press Start 2P', monospace, cursive !important;
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
