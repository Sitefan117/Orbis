<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    // -------------------------------------------------------------------------
    // MATH RACER — prototype amélioré
    // Le jeu reste indépendant du portail, mais conserve un petit bilan local.
    // Aucune donnée n'est envoyée à un serveur dans cette version.
    // -------------------------------------------------------------------------

    type GameState = 'MENU' | 'PLAYING' | 'PAUSED_ERROR' | 'SUMMARY' | 'GAMEOVER';
    type GameMode = 'training' | 'arcade';
    type PracticeLevel = 'guided' | 'standard' | 'challenge';
    type Notion =
        | 'livrets'
        | 'doubles'
        | 'triples'
        | 'quadruples'
        | 'complements10'
        | 'complements100'
        | 'complements1000'
        | 'dizaineSuivante'
        | 'centaineSuivante'
        | 'millierSuivant'
        | 'trous'
        | 'divisions';

    interface NotionOption {
        id: Notion;
        label: string;
        help: string;
    }

    interface QuestionBase {
        notion: Notion;
        notionLabel: string;
        questionText: string;
        fullFormula: string;
        answer: number;
        factKey: string;
    }

    interface GateOption {
        text: string;
        isCorrect: boolean;
        lane: number;
    }

    interface GateQuestion {
        base: QuestionBase;
        questionText: string;
        fullFormula: string;
        gates: GateOption[];
    }

    interface FactStat {
        attempts: number;
        correct: number;
        streak: number;
        lastSeen: number;
        formula: string;
        level: PracticeLevel;
        // La question d'origine permet de reproposer précisément un fait fragile à la séance suivante.
        base: QuestionBase;
    }

    interface RetryItem {
        base: QuestionBase;
        dueSpawn: number;
    }

    // Retour à la racine du site, y compris sur GitHub Pages.
const ORBIS_HOME = `${base}/`; // Modifier cette constante si l'accueil d'Orbis utilise une autre route.
    const STORAGE_KEY = 'orbis:math-racer:fact-stats:v1';
    const LANES = [-3.5, 0, 3.5];
    const BASE_SESSION_QUESTIONS = 12;
    const MAX_SESSION_QUESTIONS = 15; // Quelques questions supplémentaires permettent de revoir des erreurs.
    const BASE_SPEED_MIN = 10.5; // Unités Three.js par seconde, pas par image.
    const BASE_SPEED_MAX = 24; // En mode arcade, les réussites font vraiment monter le rythme.

    const notionGroups: { title: string; items: NotionOption[] }[] = [
        {
            title: 'MULTIPLICATIONS',
            items: [
                { id: 'livrets', label: 'Livrets', help: 'Tables de 1 à 12' },
                { id: 'doubles', label: 'Doubles / moitiés', help: 'Ex. : double de 18' },
                { id: 'triples', label: 'Triples', help: 'Ex. : triple de 12' },
                { id: 'quadruples', label: 'Quadruples', help: 'Ex. : quadruple de 8' },
                { id: 'trous', label: 'Facteur manquant', help: 'Ex. : 7 × ? = 56' },
                { id: 'divisions', label: 'Divisions liées', help: 'Ex. : 56 ÷ 7 = ?' }
            ]
        },
        {
            title: 'COMBIEN FAUT-IL AJOUTER ?',
            items: [
                { id: 'complements10', label: 'Pour arriver à 10', help: 'Ex. : 7 + ? = 10' },
                { id: 'complements100', label: 'Pour arriver à 100', help: 'Ex. : 63 + ? = 100' },
                { id: 'complements1000', label: 'Pour arriver à 1 000', help: 'Ex. : 650 + ? = 1 000' },
                { id: 'dizaineSuivante', label: 'Atteindre la dizaine suivante', help: 'Ex. : 47 → 50' },
                { id: 'centaineSuivante', label: 'Atteindre la centaine suivante', help: 'Ex. : 368 → 400' },
                { id: 'millierSuivant', label: 'Atteindre le millier suivant', help: 'Ex. : 3 650 → 4 000' }
            ]
        }
    ];

    const allNotions: NotionOption[] = notionGroups.flatMap((group) => group.items);
    const notionLabels = Object.fromEntries(allNotions.map((notion) => [notion.id, notion.label])) as Record<Notion, string>;

    // -------------------------------------------------------------------------
    // État réactif de l'interface
    // -------------------------------------------------------------------------

    let canvasContainer: HTMLDivElement;
    let gameState = $state<GameState>('MENU');
    let gameMode = $state<GameMode>('training');
    let practiceLevel = $state<PracticeLevel>('guided');
    let engineReady = $state(false);
    let engineError = $state('');
    let selectedNotions = $state<Notion[]>(['livrets', 'doubles', 'complements10']);

    let musicEnabled = $state(true);
    let sfxEnabled = $state(true);
    let soundMessage = $state('');

    let score = $state(0);
    let lives = $state(3);
    let combo = $state(0);
    let targetQuestionText = $state('Prépare-toi…');
    let feedbackTitle = $state('');
    let feedbackBannerText = $state('');
    let feedbackKind = $state<'success' | 'error' | 'info'>('info');
    let showFeedbackBanner = $state(false);
    let questionsAnswered = $state(0);
    let correctAnswers = $state(0);
    let plannedQuestions = $state(BASE_SESSION_QUESTIONS);
    let sessionWrongFacts = $state<string[]>([]);
    let factStats = $state<Record<string, FactStat>>({});
    // Le bilan final attend que l'élève ait lu la correction et appuyé sur BOOST.
    let pendingPauseOutcome: 'SUMMARY' | 'GAMEOVER' | null = null;

    let isAccelerating = false;
    let isBraking = false;
    let currentLane = 1;
    let currentBaseSpeed = BASE_SPEED_MIN;
    let speed = BASE_SPEED_MIN;

    let sessionAccuracy = $derived(Math.round((correctAnswers / Math.max(1, questionsAnswered)) * 100));

    // -------------------------------------------------------------------------
    // Éléments Three.js. Le type `any` évite de coupler ce composant aux types
    // internes de Three.js ; toute la logique mathématique reste sans dépendance.
    // -------------------------------------------------------------------------

    let THREE: any = null;
    let scene: any = null;
    let camera: any = null;
    let renderer: any = null;
    let carGroup: any = null;
    let activeGates: any[] = [];
    let roadDashes: any[] = [];
    let roadsideObjects: any[] = [];
    let animationFrameId = 0;
    let lastFrameTime = 0;
    let generatedQuestions = 0;
    let normalQuestionsGenerated = 0;
    let normalQuestionTarget = BASE_SESSION_QUESTIONS;
    let retryQueue: RetryItem[] = [];
    let scheduledRetryKeys = new Set<string>();
    let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
    let tapBoostTimer: ReturnType<typeof setTimeout> | null = null;
    let audioEngine: ArcadeAudioEngine | null = null;

    // -------------------------------------------------------------------------
    // Musique 8-bit et effets sonores générés par Web Audio.
    // Aucun fichier audio externe ni dépendance supplémentaire n'est nécessaire.
    // Le navigateur autorise l'audio après une interaction de l'utilisateur.
    // -------------------------------------------------------------------------

    class ArcadeAudioEngine {
        private context: AudioContext | null = null;
        private musicTimer: number | null = null;
        private step = 0;
        private closed = false;

        async unlock() {
            if (this.closed) return;
            try {
                if (!this.context) {
                    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                    if (AudioContextClass) this.context = new AudioContextClass();
                }
                if (this.context?.state === 'suspended') await this.context.resume();
            } catch (error) {
                console.warn('Audio non disponible :', error);
            }
        }

        private tone(frequency: number, duration: number, type: OscillatorType, volume: number, when = 0) {
            if (!this.context || this.context.state !== 'running' || frequency <= 0) return;
            const start = this.context.currentTime + when;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(Math.max(0.001, volume), start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start(start);
            oscillator.stop(start + duration + 0.01);
        }

        async startMusic() {
            if (this.closed) return;
            await this.unlock();
            if (!musicEnabled || !this.context || this.musicTimer !== null) return;

            // Petite boucle originale de notes carrées, avec une basse tous les quatre temps.
            const melody = [523, 659, 784, 659, 587, 659, 784, 1047, 784, 659, 587, 523, 392, 523, 659, 587];
            const bass = [131, 147, 165, 196];
            this.step = 0;
            this.musicTimer = window.setInterval(() => {
                if (!musicEnabled || !this.context || this.context.state !== 'running') return;
                const note = melody[this.step % melody.length];
                this.tone(note, 0.105, 'square', 0.035);
                if (this.step % 4 === 0) {
                    this.tone(bass[Math.floor(this.step / 4) % bass.length], 0.22, 'triangle', 0.045);
                }
                this.step++;
            }, 145);
        }

        stopMusic() {
            if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
            this.musicTimer = null;
        }

        playCorrect() {
            if (!sfxEnabled) return;
            this.tone(784, 0.08, 'square', 0.07);
            this.tone(1047, 0.10, 'square', 0.06, 0.075);
        }

        playWrong() {
            if (!sfxEnabled) return;
            this.tone(220, 0.12, 'triangle', 0.065);
            this.tone(165, 0.16, 'triangle', 0.05, 0.10);
        }

        playStart() {
            if (!sfxEnabled) return;
            this.tone(523, 0.07, 'square', 0.05);
            this.tone(659, 0.07, 'square', 0.05, 0.07);
            this.tone(784, 0.13, 'square', 0.055, 0.14);
        }

        destroy() {
            this.closed = true;
            this.stopMusic();
            if (this.context && this.context.state !== 'closed') void this.context.close();
            this.context = null;
        }
    }

    // -------------------------------------------------------------------------
    // Outils mathématiques : création du calcul et distracteurs contrôlés.
    // Chaque exercice possède une formule de correction et une clé de suivi.
    // -------------------------------------------------------------------------

    function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function choose<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }

    // Affiche les grands nombres avec un séparateur lisible en français suisse.
    function formatNumber(value: number) {
        return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(value);
    }

    function makeQuestionBase(notion: Notion): QuestionBase {
        let questionText = '';
        let fullFormula = '';
        let answer = 0;
        let factKey = '';

        if (notion === 'livrets') {
            // La gamme limite d'abord la charge de calcul, sans enfermer l'élève dans ce niveau.
            const minFactor = practiceLevel === 'guided' ? 2 : 1;
            const maxFactor = practiceLevel === 'guided' ? 6 : 12;
            const a = randomInt(minFactor, maxFactor);
            const b = randomInt(minFactor, maxFactor);
            answer = a * b;
            questionText = `${a} × ${b}`;
            fullFormula = `${a} × ${b} = ${answer}`;
            // 4 × 7 et 7 × 4 sont le même fait pour le suivi de la mémorisation.
            factKey = `livrets:${Math.min(a, b)}x${Math.max(a, b)}`;
        } else if (notion === 'doubles') {
            const range = practiceLevel === 'guided' ? 12 : practiceLevel === 'standard' ? 50 : 100;
            const value = randomInt(2, range);
            const isDouble = Math.random() < 0.65;
            answer = isDouble ? value * 2 : value;
            questionText = isDouble ? `Double de ${value}` : `Moitié de ${value * 2}`;
            fullFormula = isDouble ? `${value} × 2 = ${answer}` : `${value * 2} ÷ 2 = ${answer}`;
            factKey = isDouble ? `double:${value}` : `moitie:${value * 2}`;
        } else if (notion === 'triples') {
            const range = practiceLevel === 'guided' ? 10 : practiceLevel === 'standard' ? 30 : 60;
            const value = randomInt(2, range);
            answer = value * 3;
            questionText = `Triple de ${value}`;
            fullFormula = `${value} × 3 = ${answer}`;
            factKey = `triple:${value}`;
        } else if (notion === 'quadruples') {
            const range = practiceLevel === 'guided' ? 8 : practiceLevel === 'standard' ? 25 : 50;
            const value = randomInt(2, range);
            answer = value * 4;
            questionText = `Quadruple de ${value}`;
            fullFormula = `${value} × 4 = ${answer}`;
            factKey = `quadruple:${value}`;
        } else if (notion === 'complements10') {
            const value = randomInt(1, 9);
            answer = 10 - value;
            questionText = `De ${value} à 10 : combien manque-t-il ?`;
            fullFormula = `${value} + ${answer} = 10`;
            factKey = `complement10:${value}`;
        } else if (notion === 'complements100') {
            // Au départ, on travaille des dizaines entières ; ensuite, tous les nombres sont possibles.
            const value = practiceLevel === 'guided' ? randomInt(1, 9) * 10 : randomInt(1, 99);
            answer = 100 - value;
            questionText = `De ${value} à 100 : combien manque-t-il ?`;
            fullFormula = `${value} + ${answer} = 100`;
            factKey = `complement100:${value}`;
        } else if (notion === 'complements1000') {
            const value = practiceLevel === 'guided' ? randomInt(1, 9) * 100 : randomInt(1, 999);
            answer = 1000 - value;
            questionText = `De ${formatNumber(value)} à 1 000 : combien manque-t-il ?`;
            fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(1000)}`;
            factKey = `complement1000:${value}`;
        } else if (notion === 'dizaineSuivante') {
            const minValue = practiceLevel === 'challenge' ? 101 : 11;
            const maxValue = practiceLevel === 'guided' ? 89 : practiceLevel === 'standard' ? 99 : 999;
            const value = randomInt(minValue, maxValue);
            const target = (Math.floor(value / 10) + 1) * 10;
            answer = target - value;
            questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
            fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
            factKey = `dizaineSuivante:${value}`;
        } else if (notion === 'centaineSuivante') {
            const minValue = practiceLevel === 'challenge' ? 1001 : 101;
            const maxValue = practiceLevel === 'guided' ? 599 : practiceLevel === 'standard' ? 999 : 9899;
            const value = randomInt(minValue, maxValue);
            const target = (Math.floor(value / 100) + 1) * 100;
            answer = target - value;
            questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
            fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
            factKey = `centaineSuivante:${value}`;
        } else if (notion === 'millierSuivant') {
            const minValue = practiceLevel === 'challenge' ? 10001 : 1001;
            const maxValue = practiceLevel === 'guided' ? 4999 : practiceLevel === 'standard' ? 9999 : 98999;
            const value = randomInt(minValue, maxValue);
            const target = (Math.floor(value / 1000) + 1) * 1000;
            answer = target - value;
            questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
            fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
            factKey = `millierSuivant:${value}`;
        } else if (notion === 'trous') {
            const maxFactor = practiceLevel === 'guided' ? 6 : 12;
            const a = randomInt(2, maxFactor);
            const b = randomInt(2, maxFactor);
            const product = a * b;
            const hideA = Math.random() < 0.5;
            answer = hideA ? a : b;
            questionText = hideA ? `? × ${b} = ${product}` : `${a} × ? = ${product}`;
            fullFormula = `${a} × ${b} = ${product}`;
            factKey = `trou:${Math.min(a, b)}x${Math.max(a, b)}`;
        } else {
            const maxFactor = practiceLevel === 'guided' ? 6 : 12;
            const a = randomInt(2, maxFactor);
            const b = randomInt(2, maxFactor);
            const product = a * b;
            const divisor = Math.random() < 0.5 ? a : b;
            answer = product / divisor;
            questionText = `${product} ÷ ${divisor}`;
            fullFormula = `${divisor} × ${answer} = ${product}`;
            factKey = `division:${product}div${divisor}`;
        }

        return {
            notion,
            notionLabel: notionLabels[notion],
            questionText,
            fullFormula,
            answer,
            factKey
        };
    }

    function buildChoices(base: QuestionBase): GateOption[] {
        // Les distracteurs sont différents de la bonne réponse et entre eux.
        // On privilégie les erreurs proches, fréquentes en calcul mental.
        const answer = base.answer;
        const candidates = [
            answer + 1, answer - 1, answer + 2, answer - 2,
            answer + 5, answer - 5, answer + 10, answer - 10,
            answer * 2, Math.floor(answer / 2), answer + 3, answer + 4,
            answer + 7, answer + 9, answer + 20
        ];
        const uniqueWrong = [...new Set(candidates.filter((value) => Number.isInteger(value) && value > 0 && value !== answer))];

        // Garde-fou : toujours fournir deux distracteurs, même pour les très petits résultats.
        let offset = 3;
        while (uniqueWrong.length < 2) {
            const candidate = answer + offset;
            if (candidate > 0 && candidate !== answer && !uniqueWrong.includes(candidate)) uniqueWrong.push(candidate);
            offset++;
        }

        const values = [answer, uniqueWrong[0], uniqueWrong[1]];
        for (let index = values.length - 1; index > 0; index--) {
            const swapIndex = randomInt(0, index);
            [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
        }

        return values.map((value, lane) => ({
            text: String(value),
            isCorrect: value === answer,
            lane
        }));
    }

    // -------------------------------------------------------------------------
    // Suivi local des faits numériques : utile pour revoir les fragilités.
    // Il s'agit d'un indicateur de pratique, pas d'un diagnostic scolaire.
    // -------------------------------------------------------------------------

    function getStudentStorageKey() {
        // Si Orbis transmet ?eleve=..., chaque élève conserve son propre suivi sur l'appareil.
        // Sans identifiant, les données restent dans un espace local générique.
        const studentName = new URLSearchParams(window.location.search).get('eleve')?.trim().toLocaleLowerCase();
        const studentScope = studentName
            ? studentName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]/g, '_')
            : 'local';
        return `${STORAGE_KEY}:${studentScope || 'local'}`;
    }

    function loadFactStats(): Record<string, FactStat> {
        try {
            const raw = localStorage.getItem(getStudentStorageKey());
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }

    function recordFactResult(base: QuestionBase, wasCorrect: boolean) {
        const previous = factStats[base.factKey] ?? {
            attempts: 0,
            correct: 0,
            streak: 0,
            lastSeen: 0,
            formula: base.fullFormula
        };

        const updated: FactStat = {
            attempts: previous.attempts + 1,
            correct: previous.correct + (wasCorrect ? 1 : 0),
            streak: wasCorrect ? previous.streak + 1 : 0,
            lastSeen: Date.now(),
            formula: base.fullFormula,
            level: practiceLevel,
            base
        };

        factStats = { ...factStats, [base.factKey]: updated };

        try {
            localStorage.setItem(getStudentStorageKey(), JSON.stringify(factStats));
        } catch (error) {
            console.warn('Le suivi local ne peut pas être enregistré :', error);
        }
    }

    // -------------------------------------------------------------------------
    // Audio, navigation et feedback
    // -------------------------------------------------------------------------

    async function toggleMusic() {
        musicEnabled = !musicEnabled;
        if (musicEnabled) {
            await audioEngine?.startMusic();
            soundMessage = 'Musique 8-bit activée';
        } else {
            audioEngine?.stopMusic();
            soundMessage = 'Musique coupée';
        }
    }

    function toggleSfx() {
        sfxEnabled = !sfxEnabled;
        soundMessage = sfxEnabled ? 'Effets sonores activés' : 'Effets sonores coupés';
    }

    function displayFeedback(kind: 'success' | 'error' | 'info', title: string, message: string, duration = 1300) {
        if (feedbackTimer) clearTimeout(feedbackTimer);
        feedbackKind = kind;
        feedbackTitle = title;
        feedbackBannerText = message;
        showFeedbackBanner = true;
        feedbackTimer = setTimeout(() => {
            showFeedbackBanner = false;
            feedbackTimer = null;
        }, duration);
    }

    function clearFeedback() {
        if (feedbackTimer) clearTimeout(feedbackTimer);
        feedbackTimer = null;
        showFeedbackBanner = false;
    }

    function clearTapBoost() {
        if (tapBoostTimer) clearTimeout(tapBoostTimer);
        tapBoostTimer = null;
    }

    // Une erreur fige la course pour que l'élève puisse lire et comprendre la correction.
    // Le bilan final, si la séance est terminée, attend le bouton BOOST / CONTINUER.
    function pauseAfterError(title: string, formula: string, outcome: 'SUMMARY' | 'GAMEOVER' | null) {
        clearFeedback();
        clearTapBoost();
        audioEngine?.stopMusic(); // Silence la musique pendant la lecture de la correction.
        feedbackKind = 'error';
        feedbackTitle = title;
        feedbackBannerText = formula;
        pendingPauseOutcome = outcome;
        isAccelerating = false;
        isBraking = false;
        gameState = 'PAUSED_ERROR';
    }

    function resumeAfterError() {
        if (gameState !== 'PAUSED_ERROR') return;

        clearFeedback();
        clearTapBoost();
        isAccelerating = false;
        isBraking = false;
        const outcome = pendingPauseOutcome;
        pendingPauseOutcome = null;

        if (outcome) {
            // La dernière erreur est corrigée avant l'affichage du bilan final.
            gameState = outcome;
            clearActiveGates();
            return;
        }

        gameState = 'PLAYING';
        audioEngine?.playStart();
        if (musicEnabled) void audioEngine?.startMusic();
        if (!animationFrameId) {
            lastFrameTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    // Au clic sur le bouton central, on repart avec une brève impulsion de boost.
    // Le timer est annulé proprement si la course est interrompue entre-temps.
    function resumeWithBoost() {
        resumeAfterError();
        if (gameState !== 'PLAYING') return;

        isAccelerating = true;
        clearTapBoost();
        tapBoostTimer = setTimeout(() => {
            isAccelerating = false;
            tapBoostTimer = null;
        }, 420);
    }

    // Pointer Events prennent en charge le doigt, le stylet et la souris.
    function handleAcceleratorPointerDown(event: PointerEvent) {
        event.preventDefault();
        try { (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId); } catch { /* La commande reste utilisable sans capture. */ }
        if (gameState === 'PAUSED_ERROR') resumeAfterError();
        if (gameState === 'PLAYING') isAccelerating = true;
    }

    function handleBrakePointerDown(event: PointerEvent) {
        event.preventDefault();
        try { (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId); } catch { /* La commande reste utilisable sans capture. */ }
        if (gameState === 'PLAYING') isBraking = true;
    }

    function handleSpeedPointerUp() {
        isAccelerating = false;
        isBraking = false;
    }

    async function returnToOrbis() {
        stopRound();
        await goto(ORBIS_HOME);
    }

    function stopRound() {
        clearFeedback();
        clearTapBoost();
        isAccelerating = false;
        isBraking = false;
        pendingPauseOutcome = null;
        gameState = 'MENU';
        targetQuestionText = 'À toi de jouer !';
        clearActiveGates();
    }

    function moveLeft() {
        if (gameState === 'PLAYING' && currentLane > 0) currentLane--;
    }

    function moveRight() {
        if (gameState === 'PLAYING' && currentLane < 2) currentLane++;
    }

    function handleKeydown(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        const acceleratorKeys = ['arrowup', 'w', 'z'];
        const gameKeys = ['arrowleft', 'arrowright', ...acceleratorKeys, 'arrowdown', 'a', 'd', 'q', 's'];

        // Le menu garde son comportement normal : seules les courses capturent les flèches.
        if (gameState !== 'PLAYING' && gameState !== 'PAUSED_ERROR') return;
        if (gameKeys.includes(key)) event.preventDefault();

        // En pause, seul l'accélérateur relance la course après la correction.
        if (gameState === 'PAUSED_ERROR') {
            if (acceleratorKeys.includes(key)) {
                // Mémoriser si la reprise doit relancer la course ou afficher le bilan.
                // Cela évite une comparaison d'état que TypeScript considère impossible
                // après le rétrécissement de type vers PAUSED_ERROR.
                const shouldAccelerateAfterResume = pendingPauseOutcome === null;
                resumeAfterError();
                if (shouldAccelerateAfterResume) isAccelerating = true;
            }
            return;
        }

        if (key === 'arrowleft' || key === 'a' || key === 'q') moveLeft();
        if (key === 'arrowright' || key === 'd') moveRight();
        if (acceleratorKeys.includes(key)) isAccelerating = true;
        if (key === 'arrowdown' || key === 's') isBraking = true;
    }

    function handleKeyup(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key === 'arrowup' || key === 'w' || key === 'z') isAccelerating = false;
        if (key === 'arrowdown' || key === 's') isBraking = false;
    }

    // -------------------------------------------------------------------------
    // Construire une voiture arcade plus lisible : carrosserie, cockpit, roues,
    // phares, feux arrière et lignes néon. Les géométries sont réutilisées.
    // -------------------------------------------------------------------------

    function addBox(parent: any, geometry: any, material: any, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        parent.add(mesh);
        return mesh;
    }

    function createCar() {
        carGroup = new THREE.Group();

        const bodyRed = new THREE.MeshStandardMaterial({ color: 0xff185d, emissive: 0x4a0019, emissiveIntensity: 0.5, metalness: 0.55, roughness: 0.25 });
        const bodyDark = new THREE.MeshStandardMaterial({ color: 0x17172a, metalness: 0.35, roughness: 0.45 });
        const glass = new THREE.MeshStandardMaterial({ color: 0x10eaff, emissive: 0x007b91, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.18 });
        const neon = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00b6cc, emissiveIntensity: 1.2, metalness: 0.1, roughness: 0.25 });
        const headlight = new THREE.MeshBasicMaterial({ color: 0xfff2ad });
        const tailLight = new THREE.MeshBasicMaterial({ color: 0xff0050 });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x080a12, roughness: 0.9 });
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x8cfaff, emissive: 0x00f0ff, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.25 });

        // Châssis et carrosserie : la face avant de la voiture regarde vers -Z.
        addBox(carGroup, new THREE.BoxGeometry(1.55, 0.28, 2.85), bodyDark, [0, 0.28, 0.02]);
        addBox(carGroup, new THREE.BoxGeometry(1.45, 0.48, 1.35), bodyRed, [0, 0.52, -0.62]);
        addBox(carGroup, new THREE.BoxGeometry(1.52, 0.38, 0.86), bodyRed, [0, 0.47, 0.83]);
        addBox(carGroup, new THREE.BoxGeometry(1.28, 0.12, 0.82), bodyRed, [0, 0.80, -0.67]);

        // Cockpit vitré et pare-brise incliné.
        addBox(carGroup, new THREE.BoxGeometry(1.08, 0.48, 1.12), glass, [0, 0.88, 0.02], [-0.05, 0, 0]);
        addBox(carGroup, new THREE.BoxGeometry(1.0, 0.07, 0.08), neon, [0, 1.13, -0.48], [-0.18, 0, 0]);
        addBox(carGroup, new THREE.BoxGeometry(0.9, 0.07, 0.08), neon, [0, 1.12, 0.52], [0.18, 0, 0]);

        // Aileron arrière et éléments lumineux latéraux.
        addBox(carGroup, new THREE.BoxGeometry(0.12, 0.27, 0.12), bodyDark, [-0.52, 0.77, 1.22]);
        addBox(carGroup, new THREE.BoxGeometry(0.12, 0.27, 0.12), bodyDark, [0.52, 0.77, 1.22]);
        addBox(carGroup, new THREE.BoxGeometry(1.72, 0.10, 0.24), bodyDark, [0, 0.91, 1.22]);
        addBox(carGroup, new THREE.BoxGeometry(0.05, 0.06, 1.65), neon, [-0.77, 0.43, 0.03]);
        addBox(carGroup, new THREE.BoxGeometry(0.05, 0.06, 1.65), neon, [0.77, 0.43, 0.03]);

        // Phares à l'avant et feux rouges à l'arrière.
        addBox(carGroup, new THREE.BoxGeometry(0.30, 0.12, 0.06), headlight, [-0.48, 0.58, -1.31]);
        addBox(carGroup, new THREE.BoxGeometry(0.30, 0.12, 0.06), headlight, [0.48, 0.58, -1.31]);
        addBox(carGroup, new THREE.BoxGeometry(0.33, 0.12, 0.06), tailLight, [-0.48, 0.54, 1.27]);
        addBox(carGroup, new THREE.BoxGeometry(0.33, 0.12, 0.06), tailLight, [0.48, 0.54, 1.27]);

        // Quatre pneus et moyeux bien contrastés, visibles même sur petit écran.
        const tireGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.24, 10);
        const hubGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.255, 8);
        for (const x of [-0.82, 0.82]) {
            for (const z of [-0.83, 0.83]) {
                const wheel = new THREE.Mesh(tireGeometry, tireMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(x, 0.30, z);
                wheel.castShadow = false;
                carGroup.add(wheel);
                const hub = new THREE.Mesh(hubGeometry, hubMat);
                hub.rotation.z = Math.PI / 2;
                hub.position.set(x * 1.015, 0.30, z);
                carGroup.add(hub);
            }
        }

        carGroup.position.set(LANES[currentLane], 0, 0);
        carGroup.traverse((child: any) => {
            if (child.isMesh) child.frustumCulled = false;
        });
        scene.add(carGroup);
    }

    function buildScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080a18);
        scene.fog = new THREE.FogExp2(0x080a18, 0.0065);

        camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
        camera.position.set(0, 8.2, 12);
        camera.lookAt(0, 0, -18);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = false; // Les néons suffisent ; on privilégie les performances sur iPad.
        renderer.setClearColor(0x080a18, 1);
        canvasContainer.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xb2eaff, 0x170823, 1.35));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(-5, 15, 8);
        scene.add(keyLight);
        const neonFill = new THREE.PointLight(0x00dfff, 35, 85);
        neonFill.position.set(0, 4, -28);
        scene.add(neonFill);

        // Large route sombre, bordures lumineuses et repères de voies.
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x17172a, roughness: 0.78, metalness: 0.1 });
        const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 1000), roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, -0.05, -445);
        scene.add(road);

        const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x00dfff, transparent: true, opacity: 0.75 });
        const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xf02bff, transparent: true, opacity: 0.6 });
        for (const x of [-1.75, 1.75]) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 1000), laneMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.015, -445);
            scene.add(line);
        }
        for (const x of [-6.65, 6.65]) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 1000), edgeMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.02, -445);
            scene.add(line);
        }

        // Repères blancs animés : la route paraît avancer sans calculs coûteux.
        const dashGeometry = new THREE.BoxGeometry(0.045, 0.025, 2.6);
        const dashMaterial = new THREE.MeshBasicMaterial({ color: 0x9eefff, transparent: true, opacity: 0.5 });
        roadDashes = [];
        for (const x of [-1.75, 1.75]) {
            for (let i = 0; i < 18; i++) {
                const dash = new THREE.Mesh(dashGeometry, dashMaterial);
                dash.position.set(x, 0.03, -i * 15 - 8);
                dash.userData.initialZ = dash.position.z;
                scene.add(dash);
                roadDashes.push(dash);
            }
        }

        // Quelques balises latérales font défiler le décor sans alourdir la scène.
        roadsideObjects = [];
        const pylonGeometry = new THREE.BoxGeometry(0.38, 1.6, 0.38);
        const pylonMats = [
            new THREE.MeshStandardMaterial({ color: 0x00eaff, emissive: 0x006b8a, emissiveIntensity: 1 }),
            new THREE.MeshStandardMaterial({ color: 0xf02bff, emissive: 0x790066, emissiveIntensity: 0.8 })
        ];
        for (let i = 0; i < 20; i++) {
            for (const side of [-1, 1]) {
                const pylon = new THREE.Mesh(pylonGeometry, pylonMats[(i + (side === 1 ? 1 : 0)) % 2]);
                pylon.position.set(side * 8.1, 0.75, -i * 14 - 15);
                pylon.userData.initialZ = pylon.position.z;
                scene.add(pylon);
                roadsideObjects.push(pylon);
            }
        }

        createCar();
        resizeRenderer();
        // Le décor reste dessiné derrière le menu, sans boucle GPU active au repos.
        renderer.render(scene, camera);
    }

    function resizeRenderer() {
        if (!camera || !renderer || !canvasContainer) return;
        const width = Math.max(1, canvasContainer.clientWidth || window.innerWidth);
        const height = Math.max(1, canvasContainer.clientHeight || window.innerHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }

    function createGateTexture(text: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Impossible de créer le panneau de réponse.');

        ctx.fillStyle = '#090d22';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#111b38';
        ctx.fillRect(28, 28, 456, 456);

        // Cadre pixelisé et petites marques décoratives pour une lecture immédiate.
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#00eaff';
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 22;
        ctx.strokeRect(18, 18, 476, 476);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f02bff';
        ctx.fillRect(38, 40, 44, 8);
        ctx.fillRect(430, 464, 44, 8);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 118px "Oxanium", sans-serif';
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 12;
        // Les longues réponses restent dans le panneau sans être coupées.
        let fontSize = 118;
        while (ctx.measureText(text).width > 400 && fontSize > 56) {
            fontSize -= 6;
            ctx.font = `bold ${fontSize}px "Oxanium", sans-serif`;
        }
        ctx.fillText(text, 256, 260, 410);
        ctx.shadowBlur = 0;

        const texture = new THREE.CanvasTexture(canvas);
        if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }

    function createGatePanel(gateGroup: any, lane: number, option: GateOption) {
        const laneColor = lane === 1 ? 0x00eaff : lane === 0 ? 0xf02bff : 0xffc857;
        const frameMaterial = new THREE.MeshBasicMaterial({ color: laneColor });
        const postGeometry = new THREE.BoxGeometry(0.13, 3.18, 0.16);
        const topGeometry = new THREE.BoxGeometry(2.72, 0.14, 0.16);
        const panelGeometry = new THREE.PlaneGeometry(2.42, 2.52);
        const left = new THREE.Mesh(postGeometry, frameMaterial);
        left.position.set(LANES[lane] - 1.31, 1.62, 0);
        const right = new THREE.Mesh(postGeometry, frameMaterial);
        right.position.set(LANES[lane] + 1.31, 1.62, 0);
        const top = new THREE.Mesh(topGeometry, frameMaterial);
        top.position.set(LANES[lane], 3.20, 0);

        const texture = createGateTexture(option.text);
        const panelMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(LANES[lane], 1.68, 0.09);
        panel.userData = { isQuestionPanel: true, isCorrect: option.isCorrect, lane };

        gateGroup.add(left, right, top, panel);
    }

    function spawnGateSet() {
        if (!scene || !THREE || gameState !== 'PLAYING') return;

        // Une erreur planifie un rappel après quelques portes. En entraînement,
        // le rappel ajoute une question à la séance sans dépasser 15 questions.
        const nextSpawn = generatedQuestions + 1;
        const dueRetryIndex = retryQueue.findIndex((item) => item.dueSpawn <= nextSpawn);
        let isRetry = dueRetryIndex >= 0;

        if (gameMode === 'training' && normalQuestionsGenerated >= normalQuestionTarget && !isRetry) {
            // Si la séance n'a plus de nouvelle question à générer, on libère les rappels prévus.
            if (retryQueue.length > 0 && generatedQuestions < MAX_SESSION_QUESTIONS) {
                isRetry = true;
            } else {
                return;
            }
        }
        if (gameMode === 'training' && generatedQuestions >= MAX_SESSION_QUESTIONS) return;

        let base: QuestionBase;
        if (isRetry) {
            const index = dueRetryIndex >= 0 ? dueRetryIndex : 0;
            const retry = retryQueue.splice(index, 1)[0];
            base = retry.base;
        } else {
            const activeNotions: Notion[] = selectedNotions.length > 0 ? selectedNotions : ['livrets'];
            base = makeQuestionBase(choose(activeNotions));
            if (gameMode === 'training') normalQuestionsGenerated++;
        }
        generatedQuestions++;

        const question: GateQuestion = {
            base,
            questionText: base.questionText,
            fullFormula: base.fullFormula,
            gates: buildChoices(base)
        };

        const gateGroup = new THREE.Group();
        const lastGate = activeGates[activeGates.length - 1];
        gateGroup.position.z = lastGate ? lastGate.position.z - 58 : -58;
        gateGroup.userData = { questionData: question, passed: false };

        for (const option of question.gates) createGatePanel(gateGroup, option.lane, option);
        scene.add(gateGroup);
        activeGates.push(gateGroup);
    }

    function disposeObjectResources(root: any) {
        const geometries = new Set<any>();
        const materials = new Set<any>();
        const textures = new Set<any>();
        root.traverse((child: any) => {
            if (child.geometry) geometries.add(child.geometry);
            const childMaterials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
            for (const material of childMaterials) {
                materials.add(material);
                if (material.map) textures.add(material.map);
                if (material.emissiveMap) textures.add(material.emissiveMap);
            }
        });
        textures.forEach((texture) => texture.dispose());
        materials.forEach((material) => material.dispose());
        geometries.forEach((geometry) => geometry.dispose());
    }

    function clearActiveGates() {
        if (!scene) {
            activeGates = [];
            return;
        }
        for (const gate of activeGates) {
            scene.remove(gate);
            disposeObjectResources(gate);
        }
        activeGates = [];
    }

    // -------------------------------------------------------------------------
    // Réponse à une porte et logique de séance
    // -------------------------------------------------------------------------

    function queueFailedFact(base: QuestionBase) {
        // Les rappels font partie de l'entraînement, pas du mode arcade sans fin.
        // On évite ainsi d'accumuler une file de questions inutile pendant une longue partie.
        if (gameMode !== 'training') return;
        if (scheduledRetryKeys.has(base.factKey)) return;
        if (plannedQuestions >= MAX_SESSION_QUESTIONS) return;

        scheduledRetryKeys.add(base.factKey);
        // Si presque toutes les questions ont déjà été générées, le rappel revient
        // à la prochaine occasion plutôt que de rester bloqué dans la file.
        const remainingNewQuestions = Math.max(0, normalQuestionTarget - normalQuestionsGenerated);
        const delay = Math.min(2, remainingNewQuestions);
        retryQueue.push({ base, dueSpawn: generatedQuestions + delay });
        plannedQuestions++;
    }

    function checkCollision(gateGroup: any) {
        const question: GateQuestion = gateGroup.userData.questionData;
        const selectedPanel = gateGroup.children.find(
            (child: any) => child.userData?.isQuestionPanel && child.userData.lane === currentLane
        );
        const isCorrect = selectedPanel?.userData?.isCorrect === true;
        const base = question.base as QuestionBase;

        questionsAnswered++;
        recordFactResult(base, isCorrect);

        if (isCorrect) {
            correctAnswers++;
            combo++;
            score += 100 * Math.min(combo, 8);
            audioEngine?.playCorrect();

            const praise = choose([
                'Bien joué !',
                'Nickel, tu l’as !',
                'Yes ! Ça rentre !',
                'Propre ! Continue !',
                'GG, belle réponse !',
                'Bien vu !'
            ]);
            displayFeedback('success', praise, base.fullFormula, 1050);

            // En Arcade, chaque réussite augmente nettement la vitesse de base.
            if (gameMode === 'arcade') currentBaseSpeed = Math.min(BASE_SPEED_MAX, currentBaseSpeed + 0.55);
        } else {
            combo = 0;
            audioEngine?.playWrong();
            if (!sessionWrongFacts.includes(base.fullFormula)) sessionWrongFacts = [...sessionWrongFacts, base.fullFormula];
            queueFailedFact(base);

            if (gameMode === 'arcade') lives = Math.max(0, lives - 1);

            // Toute erreur fige le jeu : lire la réponse, puis appuyer sur BOOST pour continuer.
            const outcome = gameMode === 'arcade' && lives <= 0
                ? 'GAMEOVER'
                : gameMode === 'training' && questionsAnswered >= plannedQuestions
                    ? 'SUMMARY'
                    : null;
            pauseAfterError(
                choose(['Pas grave, pilote !', 'Bien tenté ! On apprend aussi comme ça.', 'On regarde le calcul, puis on repart !']),
                base.fullFormula,
                outcome
            );
        }

        // Si la dernière réponse est juste, le bilan peut apparaître immédiatement.
        // Si elle est fausse, la pause pédagogique garde la priorité jusqu'à BOOST.
        if (gameMode === 'training' && questionsAnswered >= plannedQuestions && gameState === 'PLAYING') {
            gameState = 'SUMMARY';
            isAccelerating = false;
            isBraking = false;
            audioEngine?.playStart();
        }
    }

    function startGame() {
        if (!engineReady || !scene || !carGroup) return;

        if (selectedNotions.length === 0) {
            selectedNotions = ['livrets'];
            displayFeedback('info', 'On garde un point de départ !', 'Les livrets sont sélectionnés pour commencer.', 1800);
        } else {
            clearFeedback();
        }

        score = 0;
        lives = 3;
        combo = 0;
        clearTapBoost();
        pendingPauseOutcome = null;
        questionsAnswered = 0;
        correctAnswers = 0;
        plannedQuestions = BASE_SESSION_QUESTIONS;
        sessionWrongFacts = [];
        generatedQuestions = 0;
        normalQuestionsGenerated = 0;
        normalQuestionTarget = BASE_SESSION_QUESTIONS;
        retryQueue = [];
        scheduledRetryKeys = new Set<string>();
        currentLane = 1;
        currentBaseSpeed = BASE_SPEED_MIN;
        speed = BASE_SPEED_MIN;
        isAccelerating = false;
        isBraking = false;
        targetQuestionText = 'À toi de jouer !';
        clearActiveGates();
        carGroup.position.set(LANES[currentLane], 0, 0);
        // Chaque course repart du même décor au lieu de conserver le défilement précédent.
        roadDashes.forEach((dash) => { dash.position.z = dash.userData.initialZ; });
        roadsideObjects.forEach((object) => { object.position.z = object.userData.initialZ; });
        factStats = loadFactStats();

        // Au départ d'une nouvelle partie, on réactive jusqu'à deux faits fragiles
        // enregistrés lors des séances précédentes. Ils remplacent des questions aléatoires.
        const levelOrder: Record<PracticeLevel, number> = { guided: 0, standard: 1, challenge: 2 };
        const reviews = Object.values(factStats)
            .filter((stat) => Boolean(stat.base?.factKey) && selectedNotions.includes(stat.base.notion) &&
                levelOrder[stat.level ?? 'guided'] <= levelOrder[practiceLevel] && stat.attempts > 0 &&
                (stat.streak < 2 || stat.correct / stat.attempts < 0.8))
            .sort((a, b) =>
                a.streak - b.streak ||
                a.correct / Math.max(1, a.attempts) - b.correct / Math.max(1, b.attempts) ||
                a.lastSeen - b.lastSeen
            )
            .slice(0, 2);
        // Les rappels des anciennes séances remplacent autant de questions aléatoires,
        // afin que la séance de base conserve sa taille et ne s'allonge pas sans raison.
        normalQuestionTarget = BASE_SESSION_QUESTIONS - reviews.length;
        retryQueue = reviews.map((stat, index) => ({ base: stat.base, dueSpawn: index + 1 }));
        // Les faits de rappel peuvent eux aussi échouer : ils auront alors un second rappel.
        scheduledRetryKeys = new Set<string>();
        gameState = 'PLAYING';

        // Attend que le navigateur déverrouille l'audio avant de jouer les premiers sons.
        void (async () => {
            await audioEngine?.unlock();
            if (musicEnabled) await audioEngine?.startMusic();
            audioEngine?.playStart();
        })();

        // Remplit d'abord le circuit de quelques portes pour éviter un départ vide.
        for (let i = 0; i < 2; i++) spawnGateSet();
        if (!animationFrameId) {
            lastFrameTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function showStartMenu() {
        stopRound();
    }

    // -------------------------------------------------------------------------
    // Boucle de rendu. Les déplacements reposent sur deltaTime pour que la course
    // garde une vitesse cohérente à 60/120 Hz et sur les appareils plus modestes.
    // -------------------------------------------------------------------------

    function animate(now: number) {
        if (!renderer || !scene || !camera) {
            animationFrameId = 0;
            return;
        }

        const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 1 / 60;
        lastFrameTime = now;

        if (gameState === 'PLAYING') {
            // La vitesse reste stable sans commande, même en entraînement.
            // BOOST et FREIN fonctionnent dans les deux modes ; en Arcade, les bonnes
            // réponses font en plus monter la vitesse de base et le plafond du boost.
            if (isAccelerating) {
                const boostCap = gameMode === 'arcade' ? BASE_SPEED_MAX * 1.25 : BASE_SPEED_MIN * 1.55;
                speed = Math.min(currentBaseSpeed * 1.5, boostCap);
            } else if (isBraking) {
                speed = Math.max(currentBaseSpeed * 0.45, 5.0);
            } else {
                speed = currentBaseSpeed;
            }

            // La voiture rejoint progressivement la voie demandée, sans saut brutal.
            carGroup.position.x += (LANES[currentLane] - carGroup.position.x) * Math.min(1, delta * 10);

            for (const dash of roadDashes) {
                dash.position.z += speed * delta;
                if (dash.position.z > 18) dash.position.z -= 270;
            }
            for (const object of roadsideObjects) {
                object.position.z += speed * delta * 0.88;
                if (object.position.z > 18) object.position.z -= 280;
            }

            // Affiche toujours le calcul de la porte la plus proche.
            const upcomingGate = activeGates
                .filter((gate) => !gate.userData.passed && gate.position.z < -1)
                .sort((a, b) => b.position.z - a.position.z)[0];
            const nextPrompt = upcomingGate?.userData.questionData.questionText ?? 'Garde le cap !';
            if (targetQuestionText !== nextPrompt) targetQuestionText = nextPrompt;

            for (let index = activeGates.length - 1; index >= 0; index--) {
                const gate = activeGates[index];
                gate.position.z += speed * delta;

                if (!gate.userData.passed && gate.position.z >= -1) {
                    gate.userData.passed = true;
                    checkCollision(gate);
                    if (gameState !== 'PLAYING') break;
                }

                if (gate.position.z > 18) {
                    scene.remove(gate);
                    disposeObjectResources(gate);
                    activeGates.splice(index, 1);
                }
            }

            // En mode entraînement, la série de base est finie, mais les rappels
            // prévus peuvent ajouter quelques portes pour revoir les erreurs.
            if (gameState === 'PLAYING' && activeGates.length < 2) spawnGateSet();
        }

        // Les portes restent en place pendant la pause, pour reprendre au même endroit.
        if (gameState !== 'PLAYING' && gameState !== 'PAUSED_ERROR' && activeGates.length > 0) clearActiveGates();
        // En pause, on dessine une dernière image puis on arrête l'animation : pas de GPU
        // consommé inutilement pendant que l'élève lit le feedback. BOOST relance la boucle.
        renderer.render(scene, camera);
        if (gameState === 'PLAYING') {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = 0;
        }
    }

    // -------------------------------------------------------------------------
    // Cycle de vie Svelte : nettoyage synchrone, même si l'import Three.js est lent.
    // -------------------------------------------------------------------------

    onMount(() => {
        let disposed = false;
        audioEngine = new ArcadeAudioEngine();
        factStats = loadFactStats();

        const handleResize = () => resizeRenderer();
        window.addEventListener('resize', handleResize);

        const initialize = async () => {
            try {
                THREE = await import('three');
                if (disposed) return;
                // Les nombres des portes sont dessinés sur un canvas : attendre Oxanium évite
                // que le premier rendu utilise une police de remplacement plus étroite.
                try { await document.fonts.load('90px "Oxanium"'); } catch { /* Police de secours. */ }
                if (disposed) return;
                buildScene();
                engineReady = true;
                lastFrameTime = 0;
            } catch (error) {
                console.error('Initialisation de Math Racer impossible :', error);
                engineError = 'Le circuit 3D ne démarre pas sur cet appareil. Recharge la page ou essaie un navigateur récent.';
            }
        };

        void initialize();

        return () => {
            // Cette fonction est renvoyée synchroniquement à Svelte.
            disposed = true;
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (feedbackTimer) clearTimeout(feedbackTimer);
            clearTapBoost();
            clearActiveGates();
            if (scene) disposeObjectResources(scene);
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss?.();
                if (renderer.domElement?.parentNode === canvasContainer) canvasContainer.removeChild(renderer.domElement);
            }
            audioEngine?.destroy();
            audioEngine = null;
            renderer = null;
            scene = null;
            camera = null;
            carGroup = null;
        };
    });
</script>

<svelte:head>
    <title>Math Racer — Orbis Arcade</title>
    <meta name="description" content="Une course arcade pour automatiser les faits numériques : livrets, doubles, compléments et calculs à trous." />
    <meta name="theme-color" content="#080a18" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

<main class="game-wrapper">
    <div bind:this={canvasContainer} id="canvas-container" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>
    <div class="scanlines" aria-hidden="true"></div>

    {#if gameState === 'PLAYING' || gameState === 'PAUSED_ERROR'}
        <header class="hud-top" aria-label="Informations de la course">
            <section class="hud-card compact-stat">
                <span class="hud-label">{gameMode === 'training' ? 'SÉRIE' : 'VIES'}</span>
                {#if gameMode === 'training'}
                    <strong class="hud-number">{Math.min(questionsAnswered + 1, plannedQuestions)}<small>/{plannedQuestions}</small></strong>
                    <span class="micro-copy">portes</span>
                {:else}
                    <strong class="lives" aria-label={`${lives} vies restantes`}>{'♥'.repeat(Math.max(0, lives))}<span>{'♡'.repeat(Math.max(0, 3 - lives))}</span></strong>
                    <span class="micro-copy">combo ×{combo + 1}</span>
                {/if}
            </section>

            <section class="target-card" aria-live="polite" aria-atomic="true">
                <span class="target-label">CALCUL CIBLE</span>
                <strong>{targetQuestionText}</strong>
                <span class="target-hint">Choisis la bonne porte</span>
            </section>

            <section class="hud-card compact-stat score-stat">
                <span class="hud-label">SCORE</span>
                <strong class="hud-number score-number">{score}</strong>
                <span class="micro-copy">{correctAnswers} réussites</span>
            </section>
        </header>

        <button type="button" class="quit-run" onclick={showStartMenu} aria-label="Quitter la course et revenir au menu du jeu">⟵ MENU DU JEU</button>

        <div class="keyboard-hint" aria-hidden="true">
            ← → / A D : CHANGER DE VOIE
            <span>↑ / ↓ : ACCÉLÉRER / RALENTIR</span>
        </div>

        <nav class="touch-controls" aria-label="Commandes tactiles">
            <button type="button" class="touch-control lane-control" onclick={moveLeft} aria-label="Aller sur la voie de gauche">◀<span>GAUCHE</span></button>
            <button type="button" class="touch-control lane-control" onclick={moveRight} aria-label="Aller sur la voie de droite"><span>DROITE</span>▶</button>
            <button type="button" class="touch-control speed-control brake-control" aria-label="Ralentir" onpointerdown={handleBrakePointerDown} onpointerup={handleSpeedPointerUp} onpointercancel={handleSpeedPointerUp} onlostpointercapture={handleSpeedPointerUp}>−<span>{gameMode === 'training' ? 'RALENTIR' : 'FREIN'}</span></button>
            <button type="button" class="touch-control speed-control boost-control" aria-label={gameState === 'PAUSED_ERROR' ? 'Accélérer pour continuer' : 'Accélérer'} onpointerdown={handleAcceleratorPointerDown} onpointerup={handleSpeedPointerUp} onpointercancel={handleSpeedPointerUp} onlostpointercapture={handleSpeedPointerUp}>+<span>{gameState === 'PAUSED_ERROR' ? 'CONTINUER' : gameMode === 'training' ? 'ACCÉLÉRER' : 'BOOST'}</span></button>
        </nav>
    {/if}

    {#if showFeedbackBanner && gameState === 'PLAYING'}
        <div class={`feedback-banner ${feedbackKind}`} role="status" aria-live="polite">
            <strong>{feedbackTitle}</strong>
            <span>{feedbackBannerText}</span>
        </div>
    {/if}

    {#if gameState === 'PAUSED_ERROR'}
        <section class="pause-overlay" aria-label="Pause après une erreur" aria-live="assertive">
            <div class="pause-card">
                <span class="pause-tag">CHECKPOINT</span>
                <h2>{feedbackTitle}</h2>
                <p>Voilà le calcul :</p>
                <strong class="pause-formula">{feedbackBannerText}</strong>
                <p>Prends le temps de le lire. Appuie sur BOOST pour reprendre la course.</p>
                <button type="button" class="resume-boost" onclick={resumeWithBoost}>⚡ ACCÉLÉRER POUR CONTINUER</button>
            </div>
        </section>
    {/if}

    {#if gameState === 'MENU'}
        <section class="menu-screen" aria-label="Menu principal de Math Racer">
            <div class="menu-panel">
                <div class="brand-row"><span class="brand-mark">MR</span><span class="eyebrow">ORBIS ARCADE // MATH LAB</span></div>
                <h1>MATH <span>RACER</span><b>3D</b></h1>
                <p class="tagline">Lis le calcul. Choisis la porte. Enchaîne les réussites.</p>
                <p class="encouragement">Ici, on progresse run après run. Même une erreur peut t’aider à monter en niveau.</p>

                <div class="menu-section-title"><span>01</span><h2>CHOISIS TON TERRAIN</h2></div>
                <div class="notion-groups">
                    {#each notionGroups as group}
                        <fieldset class="notion-group">
                            <legend>{group.title}</legend>
                            <div class="notion-grid">
                                {#each group.items as notion}
                                    <label class="notion-option" class:chosen={selectedNotions.includes(notion.id)}>
                                        <input type="checkbox" bind:group={selectedNotions} value={notion.id} />
                                        <span class="checkmark" aria-hidden="true">✓</span>
                                        <span class="notion-copy"><strong>{notion.label}</strong><small>{notion.help}</small></span>
                                    </label>
                                {/each}
                            </div>
                        </fieldset>
                    {/each}
                </div>

                <div class="menu-section-title"><span>02</span><h2>RÈGLE LA GAMME DES CALCULS</h2></div>
                <div class="level-grid">
                    <label class="level-option" class:selected={practiceLevel === 'guided'}>
                        <input type="radio" bind:group={practiceLevel} value="guided" />
                        <strong>DÉPART</strong>
                        <small>Nombres plus accessibles pour prendre confiance.</small>
                    </label>
                    <label class="level-option" class:selected={practiceLevel === 'standard'}>
                        <input type="radio" bind:group={practiceLevel} value="standard" />
                        <strong>STANDARD</strong>
                        <small>Une gamme plus large pour consolider les acquis.</small>
                    </label>
                    <label class="level-option" class:selected={practiceLevel === 'challenge'}>
                        <input type="radio" bind:group={practiceLevel} value="challenge" />
                        <strong>CHALLENGE</strong>
                        <small>Nombres plus grands pour pousser le calcul mental.</small>
                    </label>
                </div>

                <div class="menu-section-title"><span>03</span><h2>CHOISIS TON MODE</h2></div>
                <div class="mode-grid">
                    <label class="mode-option" class:selected={gameMode === 'training'}>
                        <input type="radio" bind:group={gameMode} value="training" />
                        <span class="mode-icon">◆</span>
                        <span><strong>ENTRAÎNEMENT</strong><small>Rythme réglable · 12 portes + rappels · les erreurs reviennent pour t’aider.</small></span>
                    </label>
                    <label class="mode-option" class:selected={gameMode === 'arcade'}>
                        <input type="radio" bind:group={gameMode} value="arcade" />
                        <span class="mode-icon">⚡</span>
                        <span><strong>MODE ARCADE</strong><small>3 vies · boost et frein · la vitesse monte avec tes réussites.</small></span>
                    </label>
                </div>

                <div class="sound-row">
                    <button type="button" class="sound-toggle" aria-pressed={musicEnabled} onclick={toggleMusic}>♫ MUSIQUE 8-BIT : {musicEnabled ? 'ON' : 'OFF'}</button>
                    <button type="button" class="sound-toggle" aria-pressed={sfxEnabled} onclick={toggleSfx}>♪ EFFETS : {sfxEnabled ? 'ON' : 'OFF'}</button>
                </div>
                {#if soundMessage}<p class="sound-message" role="status">{soundMessage}</p>{/if}
                {#if selectedNotions.length === 0}<p class="notice">Aucune notion cochée : les livrets seront sélectionnés au lancement.</p>{/if}
                {#if engineError}<p class="engine-error" role="alert">{engineError}</p>{/if}

                <button type="button" class="primary-button" disabled={!engineReady || Boolean(engineError)} onclick={startGame}>
                    {#if engineReady}▶ LANCER LA COURSE{:else if engineError}CIRCUIT INDISPONIBLE{:else}CHARGEMENT DU CIRCUIT…{/if}
                </button>
                <a class="orbis-link" href={ORBIS_HOME} onclick={(event) => { event.preventDefault(); void returnToOrbis(); }}>↩ RETOUR À ORBIS</a>
                <div class="menu-footnote"><span>CLAVIER : ← → / A D · ↑ ↓ : VITESSE</span><span>TACTILE : COMMANDES À L’ÉCRAN</span></div>
            </div>
        </section>
    {/if}

    {#if gameState === 'SUMMARY' || gameState === 'GAMEOVER'}
        <section class="summary-screen" aria-label="Bilan de la course" aria-live="polite">
            <div class="summary-panel">
                <div class="summary-badge">{gameState === 'SUMMARY' ? 'RUN TERMINÉE' : 'FIN DE COURSE'}</div>
                <h2>{gameState === 'SUMMARY' ? (sessionAccuracy >= 90 ? 'RUN EN FEU !' : 'BIEN JOUÉ, PILOTE !') : 'ON REMET ÇA ?'}</h2>
                <p class="summary-message">
                    {#if gameState === 'SUMMARY' && sessionAccuracy >= 90}
                        Solide ! Tu retrouves tes faits numériques de plus en plus sûrement.
                    {:else if gameState === 'SUMMARY'}
                        Chaque run te fait avancer. Les calculs à revoir pourront revenir à la prochaine course.
                    {:else}
                        La course s’arrête, pas ta progression. Repère un calcul à consolider et repars.
                    {/if}
                </p>
                <div class="summary-stats">
                    <div><span>SCORE</span><strong>{score}</strong></div>
                    <div><span>JUSTESSE</span><strong>{sessionAccuracy}%</strong></div>
                    <div><span>RÉUSSITES</span><strong>{correctAnswers}/{questionsAnswered}</strong></div>
                </div>
                {#if sessionWrongFacts.length > 0}
                    <div class="review-box">
                        <strong>À REVOIR — ON VA LES RETRAVAILLER</strong>
                        <p>{sessionWrongFacts.slice(0, 5).join(' · ')}</p>
                    </div>
                {:else if questionsAnswered > 0}
                    <div class="review-box positive-review"><strong>RUN SANS ERREUR : BIEN VU !</strong><p>La prochaine fois, on espacera les rappels pour vérifier que ça tient dans le temps.</p></div>
                {/if}
                <div class="summary-actions">
                    <button type="button" class="primary-button" onclick={startGame}>↻ REJOUER</button>
                    <button type="button" class="secondary-button" onclick={showStartMenu}>⌂ MENU PRINCIPAL</button>
                </div>
            </div>
        </section>
    {/if}

    <footer class="ambient-footer" aria-hidden="true"><span>PIXEL DRIVE</span><span>•</span><span>KEEP LEARNING</span></footer>
</main>

<style>
    /* Tous les styles restent dans le jeu : le reste d'Orbis n'est pas modifié. */
    .game-wrapper button, .game-wrapper input, .game-wrapper a { font: inherit; }
    .game-wrapper button { -webkit-tap-highlight-color: transparent; }

    .game-wrapper {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100vh;
        height: 100dvh;
        min-height: 0;
        overflow: hidden;
        isolation: isolate;
        color: #f5f8ff;
        background: #080a18;
        font-family: 'Oxanium', 'Trebuchet MS', sans-serif;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
    }

    #canvas-container { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
    #canvas-container :global(canvas) { display: block; width: 100%; height: 100%; }

    .vignette, .scanlines { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
    .vignette { background: radial-gradient(ellipse at 50% 45%, transparent 32%, rgb(3 4 16 / 42%) 100%); }
    .scanlines { opacity: 0.32; background: repeating-linear-gradient(to bottom, transparent 0 3px, rgb(0 0 0 / 18%) 3px 4px); mix-blend-mode: multiply; }

    .hud-top {
        position: absolute;
        z-index: 10;
        top: clamp(0.55rem, 2vw, 1.3rem);
        left: clamp(0.55rem, 2vw, 1.3rem);
        right: clamp(0.55rem, 2vw, 1.3rem);
        display: grid;
        grid-template-columns: minmax(90px, 0.8fr) minmax(0, 2fr) minmax(90px, 0.8fr);
        align-items: start;
        gap: clamp(0.4rem, 1.5vw, 1rem);
        pointer-events: none;
    }

    .hud-card, .target-card {
        border: 2px solid rgb(0 234 255 / 68%);
        background: rgb(8 10 28 / 83%);
        box-shadow: 0 0 16px rgb(0 234 255 / 13%), inset 0 0 16px rgb(0 234 255 / 5%);
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
    }

    .compact-stat { min-height: 80px; padding: 0.7rem 0.45rem; text-align: center; border-radius: 5px; }
    .hud-label, .target-label { display: block; color: #00eaff; font-size: clamp(0.48rem, 1.1vw, 0.7rem); line-height: 1.7; }
    .hud-number { display: block; margin-top: 0.35rem; color: white; font-size: clamp(0.78rem, 2vw, 1.25rem); }
    .hud-number small { color: #8a9bb8; font-size: 0.55em; }
    .micro-copy { display: block; margin-top: 0.45rem; color: #a7b4d0; font-family: 'Oxanium', 'Trebuchet MS', sans-serif; font-size: clamp(0.63rem, 1.15vw, 0.8rem); }
    .lives { display: block; margin-top: 0.45rem; color: #ff286d; font: 1.05rem/1.2 system-ui, sans-serif; letter-spacing: 0.08em; }
    .lives span { color: #7c4260; }
    .score-stat { border-color: rgb(240 43 255 / 70%); box-shadow: 0 0 16px rgb(240 43 255 / 12%); }
    .score-number { color: #f9b8ff; }

    .target-card { padding: 0.8rem clamp(0.35rem, 2vw, 1.2rem); border-width: 2px; border-radius: 7px; text-align: center; }
    .target-card strong { display: block; margin: 0.45rem auto 0.25rem; font-size: clamp(0.72rem, 2.15vw, 1.5rem); line-height: 1.7; overflow-wrap: anywhere; text-shadow: 0 0 10px rgb(0 234 255 / 38%); }
    .target-hint { display: block; color: #a6bdd7; font: 0.78rem/1.5 'Oxanium', sans-serif; }

    .quit-run {
        position: absolute;
        z-index: 30;
        top: 108px;
        left: clamp(0.55rem, 2vw, 1.3rem);
        border: 1px solid rgb(255 40 109 / 75%);
        border-radius: 4px;
        padding: 0.65rem 0.8rem;
        color: #fff;
        background: rgb(25 8 26 / 86%);
        font-size: clamp(0.48rem, 0.95vw, 0.68rem);
        cursor: pointer;
        touch-action: manipulation;
    }
    .quit-run:hover, .quit-run:focus-visible { background: #6e163d; outline: 2px solid #ff286d; outline-offset: 2px; }

    .keyboard-hint { position: absolute; z-index: 5; bottom: 1.1rem; left: 50%; transform: translateX(-50%); width: max-content; max-width: 80vw; color: rgb(214 229 255 / 65%); text-align: center; font: 0.72rem/1.8 'Oxanium', sans-serif; pointer-events: none; }
    .keyboard-hint span { display: block; color: rgb(0 234 255 / 70%); }

    .touch-controls { display: none; }
    .touch-control { min-width: 58px; min-height: 58px; border: 2px solid #6b80a6; border-radius: 7px; background: rgb(8 12 33 / 88%); color: white; box-shadow: 0 5px 0 #15192e; font-size: 1rem; touch-action: none; }
    .touch-control span { display: block; margin-top: 0.35rem; font: 0.62rem 'Oxanium', sans-serif; }
    .lane-control { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #bffaff; border-color: #00a9bd; }
    .speed-control { min-width: 62px; font-size: 1.45rem; }
    .brake-control { border-color: #ff286d; color: #ff8fb4; }
    .boost-control { border-color: #00eaff; color: #7ff7ff; }
    .touch-control:active { transform: translateY(3px); box-shadow: 0 2px 0 #15192e; }

    .feedback-banner {
        position: absolute;
        z-index: 35;
        top: 42%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.65rem;
        width: min(88vw, 680px);
        padding: clamp(1rem, 2.5vw, 1.6rem);
        border: 2px solid #00eaff;
        border-radius: 8px;
        background: rgb(7 12 31 / 95%);
        box-shadow: 0 0 28px rgb(0 234 255 / 25%);
        text-align: center;
        animation: feedback-pop 0.16s ease-out;
    }
    .feedback-banner strong { font-size: clamp(0.72rem, 1.65vw, 1rem); line-height: 1.8; color: #79faff; }
    .feedback-banner span { font: 700 clamp(1.1rem, 3vw, 2rem)/1.5 'Oxanium', sans-serif; color: white; }
    .feedback-banner.error { border-color: #ff286d; box-shadow: 0 0 28px rgb(255 40 109 / 25%); }
    .feedback-banner.error strong { color: #ff9abb; }
    .feedback-banner.success { border-color: #8cff6c; box-shadow: 0 0 28px rgb(140 255 108 / 18%); }
    .feedback-banner.success strong { color: #b6ff9c; }

    .pause-overlay {
        position: absolute;
        z-index: 20;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgb(3 5 18 / 76%);
        pointer-events: none;
    }
    .pause-card {
        width: min(100%, 540px);
        padding: clamp(1rem, 3vw, 1.7rem);
        border: 2px solid #ff286d;
        border-radius: 9px;
        background: linear-gradient(145deg, #17112d, #09142d);
        box-shadow: 0 0 34px rgb(255 40 109 / 24%);
        text-align: center;
        pointer-events: auto;
    }
    .pause-tag { display: inline-block; padding: 0.35rem 0.55rem; border: 1px solid #ff6e9b; color: #ff9abb; font-size: 0.65rem; letter-spacing: 0.08em; }
    .pause-card h2 { margin: 0.9rem 0 0.5rem; color: #ffb1cb; font-size: clamp(1rem, 3vw, 1.45rem); line-height: 1.5; }
    .pause-card p { margin: 0.6rem 0; color: #e1e9fc; font: 1rem/1.5 'Oxanium', 'Trebuchet MS', sans-serif; }
    .pause-formula { display: block; margin: 0.8rem 0; color: #ffffff; font-size: clamp(1.3rem, 4vw, 2.2rem); line-height: 1.45; }
    .resume-boost { min-height: 52px; margin-top: 0.6rem; padding: 0.75rem 1rem; border: 2px solid #b8fbff; border-radius: 5px; color: #07101c; background: linear-gradient(110deg, #00eaff, #79faff); font: 800 0.9rem/1.4 'Oxanium', 'Trebuchet MS', sans-serif; cursor: pointer; touch-action: none; pointer-events: auto; }
    .resume-boost:active { transform: translateY(2px); }

    .menu-screen, .summary-screen {
        position: absolute;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        padding: clamp(0.55rem, 2.5vw, 1.5rem);
        overflow-y: auto;
        background: linear-gradient(135deg, rgb(5 7 21 / 94%), rgb(13 8 35 / 95%));
        scrollbar-color: #244d70 #080a18;
    }

    .menu-panel, .summary-panel {
        width: min(100%, 860px);
        max-height: calc(100dvh - 1.5rem);
        overflow-y: auto;
        border: 2px solid #00eaff;
        border-radius: 9px;
        padding: clamp(1rem, 3vw, 2rem);
        background: linear-gradient(150deg, rgb(13 20 48 / 98%), rgb(12 8 32 / 98%));
        box-shadow: 0 0 32px rgb(0 234 255 / 14%), inset 0 0 24px rgb(0 234 255 / 3%);
    }

    .brand-row { display: flex; align-items: center; gap: 0.75rem; color: #9ba9c8; font-size: clamp(0.46rem, 1vw, 0.65rem); line-height: 1.7; }
    .brand-mark { display: grid; place-items: center; width: 36px; height: 36px; border: 2px solid #f02bff; color: #f9b8ff; font-size: 0.65rem; transform: skew(-8deg); }
    h1 { margin: 1rem 0 0.55rem; color: #f8fbff; font-size: clamp(1.15rem, 4.2vw, 2.5rem); line-height: 1.55; letter-spacing: -0.07em; text-shadow: 4px 4px 0 #171044; }
    h1 span { color: #00eaff; }
    h1 b { color: #ff4fab; font-size: 0.6em; vertical-align: top; }
    .tagline { margin: 0; color: #e1faff; font-size: clamp(0.48rem, 1vw, 0.68rem); line-height: 2; }
    .encouragement { max-width: 690px; margin: 0.55rem 0 1.15rem; color: #a8bbd9; font: 0.93rem/1.65 'Oxanium', sans-serif; }

    .menu-section-title { display: flex; align-items: center; gap: 0.7rem; margin: 1.1rem 0 0.75rem; }
    .menu-section-title > span { display: grid; place-items: center; flex: 0 0 32px; height: 28px; border: 1px solid #f02bff; color: #ff9bef; font-size: 0.65rem; }
    .menu-section-title h2 { margin: 0; color: #f4f7ff; font-size: clamp(0.55rem, 1.2vw, 0.78rem); line-height: 1.8; }
    .notion-groups { display: grid; gap: 0.7rem; }
    .notion-group { min-width: 0; margin: 0; padding: 0.75rem; border: 1px solid #29375c; border-radius: 5px; }
    .notion-group legend { padding: 0 0.4rem; color: #00eaff; font-size: 0.55rem; }
    .notion-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
    .notion-option { position: relative; display: flex; align-items: flex-start; gap: 0.55rem; min-width: 0; min-height: 62px; padding: 0.65rem; border: 1px solid #253253; border-radius: 5px; background: rgb(4 8 23 / 65%); cursor: pointer; transition: border-color 0.12s, background 0.12s; }
    .notion-option.chosen { border-color: #00bcd1; background: rgb(0 234 255 / 7%); }
    .notion-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .checkmark { display: grid; place-items: center; flex: 0 0 18px; height: 18px; border: 1px solid #5d6d8f; border-radius: 3px; color: transparent; font: bold 0.75rem 'Oxanium', sans-serif; }
    .chosen .checkmark { border-color: #00eaff; background: #00a8ba; color: #07101c; }
    .notion-option:focus-within { outline: 2px solid #f02bff; outline-offset: 2px; }
    .notion-copy { display: block; min-width: 0; }
    .notion-copy strong { display: block; color: #f5f8ff; font-size: clamp(0.45rem, 0.9vw, 0.58rem); line-height: 1.7; }
    .notion-copy small { display: block; margin-top: 0.3rem; color: #91a2c3; font: 0.75rem/1.45 'Oxanium', sans-serif; }

    .level-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; }
    .level-option { display: flex; flex-direction: column; gap: 0.45rem; min-width: 0; min-height: 95px; padding: 0.75rem; border: 1px solid #344365; border-radius: 5px; background: rgb(4 8 23 / 65%); cursor: pointer; }
    .level-option.selected { border-color: #00eaff; background: rgb(0 234 255 / 7%); }
    .level-option input { position: absolute; opacity: 0; }
    .level-option strong { color: #9cfaff; font-size: 0.53rem; line-height: 1.8; }
    .level-option small { color: #a0b0cf; font: 0.78rem/1.5 'Oxanium', sans-serif; }
    .level-option:focus-within { outline: 2px solid #f02bff; outline-offset: 2px; }
    .mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
    .mode-option { display: flex; align-items: flex-start; gap: 0.7rem; padding: 0.9rem; border: 1px solid #344365; border-radius: 6px; background: rgb(4 8 23 / 65%); cursor: pointer; }
    .mode-option.selected { border-color: #f02bff; background: rgb(240 43 255 / 6%); }
    .mode-option input { position: absolute; opacity: 0; }
    .mode-option:focus-within { outline: 2px solid #00eaff; outline-offset: 2px; }
    .mode-icon { color: #f02bff; font-size: 1.1rem; line-height: 1.5; }
    .mode-option strong { display: block; font-size: 0.55rem; line-height: 1.8; }
    .mode-option small { display: block; margin-top: 0.35rem; color: #a0b0cf; font: 0.8rem/1.5 'Oxanium', sans-serif; }

    .sound-row { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1rem; }
    .sound-toggle { flex: 1; min-height: 42px; padding: 0.55rem; border: 1px solid #475b7d; border-radius: 4px; background: #101832; color: #d7e5ff; font-size: clamp(0.45rem, 0.85vw, 0.57rem); cursor: pointer; }
    .sound-toggle[aria-pressed="true"] { border-color: #00eaff; color: #89faff; }
    .sound-message, .notice { margin: 0.5rem 0 0; color: #9eefff; font: 0.8rem/1.5 'Oxanium', sans-serif; }
    .notice { color: #ffd98b; }
    .engine-error { padding: 0.8rem; border: 1px solid #ff286d; background: rgb(255 40 109 / 8%); color: #ffafc6; font: 0.83rem/1.6 'Oxanium', sans-serif; }

    .primary-button, .secondary-button, .orbis-link { display: flex; align-items: center; justify-content: center; gap: 0.6rem; min-height: 52px; border-radius: 5px; padding: 0.85rem 1rem; text-align: center; text-decoration: none; font-size: clamp(0.5rem, 1.15vw, 0.7rem); line-height: 1.8; cursor: pointer; touch-action: manipulation; }
    .primary-button { width: 100%; margin-top: 1rem; border: 2px solid #a5fbff; color: #06121e; background: linear-gradient(110deg, #00eaff, #79faff); box-shadow: 0 4px 0 #007a92, 0 0 20px rgb(0 234 255 / 17%); }
    .primary-button:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
    .primary-button:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 2px 0 #007a92; }
    .primary-button:disabled { opacity: 0.45; cursor: wait; }
    .secondary-button { border: 1px solid #536789; color: #e5ecff; background: #151d38; }
    .orbis-link { margin-top: 0.65rem; border: 1px solid #3a2b66; color: #d6c4ff; background: rgb(72 37 125 / 13%); }
    .orbis-link:hover { border-color: #ad8aff; background: rgb(72 37 125 / 25%); }
    .menu-footnote { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.55rem; margin-top: 1rem; color: #687b9e; font: 0.7rem/1.5 'Oxanium', sans-serif; }

    .summary-screen { z-index: 100; }
    .summary-panel { width: min(100%, 650px); padding: clamp(1.2rem, 4vw, 2rem); text-align: center; }
    .summary-badge { display: inline-block; padding: 0.5rem 0.7rem; border: 1px solid #f02bff; color: #ffb1f0; font-size: 0.55rem; line-height: 1.8; }
    .summary-panel h2 { margin: 1rem 0 0.5rem; color: #00eaff; font-size: clamp(0.9rem, 3vw, 1.4rem); line-height: 1.8; text-shadow: 3px 3px #171044; }
    .summary-message { max-width: 520px; margin: 0 auto 1.2rem; color: #b6c5df; font: 0.95rem/1.65 'Oxanium', sans-serif; }
    .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; }
    .summary-stats div { display: flex; flex-direction: column; gap: 0.7rem; padding: 0.8rem 0.3rem; border: 1px solid #2b4168; background: #0a1027; }
    .summary-stats span { color: #8d9cba; font-size: 0.48rem; line-height: 1.6; }
    .summary-stats strong { color: white; font-size: clamp(0.8rem, 2.2vw, 1.3rem); }
    .review-box { margin-top: 1rem; padding: 0.9rem; border: 1px solid #a13a6f; background: rgb(255 40 109 / 5%); text-align: left; }
    .review-box strong { color: #ff9bbc; font-size: 0.53rem; line-height: 1.8; }
    .review-box p { margin: 0.55rem 0 0; color: #f3d9e3; font: 0.94rem/1.6 'Oxanium', sans-serif; overflow-wrap: anywhere; }
    .positive-review { border-color: #477e50; background: rgb(140 255 108 / 5%); }
    .positive-review strong { color: #b6ff9c; }
    .positive-review p { color: #c8e5c5; }
    .summary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 1rem; }
    .summary-actions .primary-button { margin: 0; }

    .ambient-footer { position: absolute; right: 1rem; bottom: 0.45rem; z-index: 3; display: flex; gap: 0.5rem; color: rgb(151 172 208 / 45%); font: 0.65rem/1.2 'Oxanium', sans-serif; pointer-events: none; }

    @keyframes feedback-pop { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }

    @media (max-width: 780px) {
        .hud-top { grid-template-columns: 80px minmax(0, 1fr) 80px; gap: 0.35rem; }
        .compact-stat { min-height: 68px; padding: 0.55rem 0.25rem; }
        .hud-label, .target-label { font-size: 0.45rem; }
        .target-card { padding: 0.6rem 0.35rem; }
        .target-hint { font-size: 0.68rem; }
        .quit-run { top: 95px; padding: 0.5rem; font-size: 0.45rem; }
        .keyboard-hint { display: none; }
        .touch-controls { position: absolute; z-index: 25; right: 0.55rem; bottom: max(1rem, env(safe-area-inset-bottom)); left: 0.55rem; display: flex; align-items: end; gap: 0.45rem; }
        .touch-control { min-height: 58px; }
        .touch-controls:has(.speed-control) .lane-control { min-height: 54px; }
        .speed-control { flex: 0 0 54px; min-width: 54px; min-height: 54px; }
        .touch-control span { font-size: 0.55rem; }
        .notion-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .menu-panel { max-height: calc(100dvh - 1rem); }
    }

    @media (max-width: 480px) {
        .game-wrapper { height: 100svh; height: 100dvh; }
        .hud-top { top: max(0.45rem, env(safe-area-inset-top)); left: 0.45rem; right: 0.45rem; grid-template-columns: 64px minmax(0, 1fr) 64px; gap: 0.3rem; }
        .compact-stat { min-height: 59px; padding: 0.4rem 0.15rem; }
        .hud-number { font-size: 0.8rem; }
        .micro-copy { font-size: 0.62rem; margin-top: 0.25rem; }
        .lives { font-size: 0.85rem; }
        .target-card { min-height: 62px; padding: 0.45rem 0.25rem; }
        .target-card strong { margin: 0.25rem 0; font-size: clamp(0.62rem, 3.4vw, 0.9rem); }
        .target-hint { font-size: 0.6rem; }
        .quit-run { top: 82px; font-size: 0.42rem; }
        .notion-grid, .mode-grid, .level-grid { grid-template-columns: 1fr; }
        .notion-option { min-height: 54px; }
        .menu-panel { padding: 0.9rem; }
        .encouragement { font-size: 0.85rem; }
        .summary-stats div { gap: 0.45rem; }
        .summary-stats span { font-size: 0.42rem; }
        .summary-actions { grid-template-columns: 1fr; }
        .ambient-footer { display: none; }
    }

    /* Les iPad en paysage sont souvent plus larges que 780 px :
       on détecte donc aussi le type de pointeur, pas seulement la largeur. */
    @media (hover: none) and (pointer: coarse) {
        .keyboard-hint { display: none; }
        .touch-controls {
            position: absolute;
            z-index: 25;
            right: 0.55rem;
            bottom: max(1rem, env(safe-area-inset-bottom));
            left: 0.55rem;
            display: flex;
            align-items: end;
            gap: 0.45rem;
        }
        .touch-control { min-height: 58px; }
    }

    @media (max-height: 620px) and (min-width: 781px) {
        .menu-screen, .summary-screen { align-items: start; }
        .menu-panel, .summary-panel { max-height: none; }
        .hud-top { top: 0.45rem; }
        .compact-stat { min-height: 58px; padding: 0.35rem; }
        .quit-run { top: 78px; }
    }
</style>
