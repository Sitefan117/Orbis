/** Centralise les effets sonores et la lecture vocale pour ne pas les gérer dans chaque écran. */
import { base } from '$app/paths';

// Les fichiers utilisent le préfixe SvelteKit pour fonctionner sous un sous-chemin GitHub Pages.
const soundFiles: Record<string, string> = {
    click: `${base}/audio/click.wav`,
    elevator: `${base}/audio/elevator.wav`,
    interact: `${base}/audio/interact.ogg`,
    save: `${base}/audio/save.wav`,
    load: `${base}/audio/save.wav`,
    stairs: `${base}/audio/stairs.ogg`,
    step: `${base}/audio/step.ogg`
};

// Réutilise les éléments audio créés plutôt que de les reconstruire à chaque clic.
const audioCache: Record<string, HTMLAudioElement> = {};

export class AudioManager {
    static speak(text: string) {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-CH';
        window.speechSynthesis.speak(utterance);
    }

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
