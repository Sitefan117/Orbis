import { base } from '$app/paths';

const soundFiles: Record<string, string> = {
    click: `${base}/audio/click.wav`,
    elevator: `${base}/audio/elevator.wav`,
    interact: `${base}/audio/interact.ogg`,
    save: `${base}/audio/save.wav`,
    load: `${base}/audio/save.wav`,
    stairs: `${base}/audio/stairs.ogg`,
    step: `${base}/audio/step.ogg`
};

const audioCache: Record<string, HTMLAudioElement> = {};

export class AudioManager {
    static playClick() {
        this.play('click');
    }

    static play(soundName: string) {
        if (typeof window === 'undefined') return;
        const path = soundFiles[soundName];
        if (!path) return;

        try {
            if (!audioCache[soundName]) {
                audioCache[soundName] = new Audio(path);
            }

            const audio = audioCache[soundName];
            audio.currentTime = 0;
            audio.play().catch(() => {
                // Ignore silencieusement l'interdiction de lecture automatique du navigateur
            });
        } catch (err) {
            console.warn("Erreur lecture audio:", err);
        }
    }
}