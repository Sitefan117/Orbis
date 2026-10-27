/** Sons synthétiques et musique de Racer, gérés sans fichiers audio externes. */

export class RaceAudioEngine {
    private context: AudioContext | null = null;
    private musicTimer: number | null = null;
    private step = 0;
    private closed = false;
    private readonly musicEnabled: () => boolean;
    private readonly sfxEnabled: () => boolean;

    constructor(musicEnabled: () => boolean, sfxEnabled: () => boolean) {
        this.musicEnabled = musicEnabled;
        this.sfxEnabled = sfxEnabled;
    }

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
        if (!this.musicEnabled() || !this.context || this.musicTimer !== null) return;

        // Petite boucle originale de notes carrées, avec une basse tous les quatre temps.
        const melody = [523, 659, 784, 659, 587, 659, 784, 1047, 784, 659, 587, 523, 392, 523, 659, 587];
        const bass = [131, 147, 165, 196];
        this.step = 0;
        this.musicTimer = window.setInterval(() => {
            if (!this.musicEnabled() || !this.context || this.context.state !== 'running') return;
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
        if (!this.sfxEnabled()) return;
        this.tone(784, 0.08, 'square', 0.07);
        this.tone(1047, 0.10, 'square', 0.06, 0.075);
    }

    playWrong() {
        if (!this.sfxEnabled()) return;
        this.tone(220, 0.12, 'triangle', 0.065);
        this.tone(165, 0.16, 'triangle', 0.05, 0.10);
    }

    playStart() {
        if (!this.sfxEnabled()) return;
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
