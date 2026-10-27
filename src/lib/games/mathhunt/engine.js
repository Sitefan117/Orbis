import { generateQuestion } from './question-engine';

const ALL_TABLES = Array.from({ length: 12 }, (_, index) => index + 1);
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 180;
const TARGET_SCORE = 10;

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
    export class TableHuntGame {
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
            this.currentQuestion = generateQuestion(this.selectedTables, this.difficulty);
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

