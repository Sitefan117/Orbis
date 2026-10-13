<script lang="ts">
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    let { onComplete } = $props<{ onComplete: (score: number) => void }>();
    type Question = { prompt: string; options: string[]; answer: string; explanation: string };

    const questions: Question[] = [
        {
            prompt: 'Une unité est divisée en 7 intervalles égaux. Quelle fraction représente le quatrième intervalle atteint depuis 0 ?',
            options: ['3/7', '4/7', '4/6'], answer: '4/7',
            explanation: 'Le dénominateur 7 indique les 7 intervalles. Le quatrième trait après 0 correspond à 4/7.'
        },
        {
            prompt: 'Quelle est la bonne lecture de gauche à droite sur la droite graduée ?',
            options: ['3/4, 2/4, 1/4', '2/4, 1/4, 3/4', '1/4, 2/4, 3/4'], answer: '1/4, 2/4, 3/4',
            explanation: 'Avec le même dénominateur, la plus petite fraction est la plus proche de 0 : 1/4, puis 2/4, puis 3/4.'
        },
        {
            prompt: 'Sur une droite de 0 à 1 partagée en 3 intervalles égaux, où se trouve 2/3 ?',
            options: ['Au premier trait après 0', 'Au deuxième trait après 0', 'À l’extrémité 1'], answer: 'Au deuxième trait après 0',
            explanation: 'Le dénominateur 3 donne trois intervalles. Le numérateur 2 indique qu’on avance de deux intervalles depuis 0.'
        },
        {
            prompt: 'Que vaut 8/8 sur la droite graduée de 0 à 1 ?',
            options: ['0', '1/2', '1'], answer: '1',
            explanation: 'Les huit intervalles sur huit sont parcourus : on arrive à l’unité entière. 8/8 = 1.'
        },
        {
            prompt: 'Quelle fraction est la plus à droite : 5/10 ou 8/10 ?',
            options: ['5/10', '8/10', 'Elles sont au même endroit'], answer: '8/10',
            explanation: 'Les deux fractions ont le même dénominateur. Huit dixièmes est plus grand que cinq dixièmes.'
        },
        {
            prompt: 'Pourquoi les intervalles d’une droite graduée doivent-ils être égaux ?',
            options: [
                'Pour que chaque intervalle représente la même quantité',
                'Pour que la droite soit plus longue',
                'Parce que le dénominateur doit toujours être 10'
            ], answer: 'Pour que chaque intervalle représente la même quantité',
            explanation: 'Des intervalles égaux représentent des pas de même valeur. Sinon, les graduations ne permettent pas de lire correctement les fractions.'
        }
    ];

    let index = $state(0);
    let score = $state(0);
    let feedback = $state('');
    let selected = $state('');
    let attempts = $state(0);
    let locked = $state(false);
    let finished = $state(false);
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;

    function normalize(value: string) {
        return value.toLocaleLowerCase('fr-CH').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }

    function submit(option: string) {
        if (locked || finished) return;
        selected = option;
        if (normalize(option) === normalize(questions[index].answer)) {
            score += 1;
            locked = true;
            feedback = `Bonne réponse ! ${questions[index].explanation}`;
            advanceTimer = setTimeout(nextQuestion, 1300);
            return;
        }

        attempts += 1;
        if (attempts >= 3) {
            locked = true;
            feedback = `La bonne réponse était : « ${questions[index].answer} ». ${questions[index].explanation}`;
        } else {
            feedback = `Pas encore. Réessaie (${3 - attempts} essai${3 - attempts > 1 ? 's' : ''} restant${3 - attempts > 1 ? 's' : ''}).`;
        }
    }

    function nextQuestion() {
        if (!locked || finished) return;
        if (advanceTimer) clearTimeout(advanceTimer);
        if (index < questions.length - 1) {
            index += 1;
            selected = '';
            feedback = '';
            attempts = 0;
            locked = false;
            return;
        }
        finished = true;
        feedback = `Épreuve terminée : ${score}/${questions.length}.`;
    }

    function readQuestion() { AudioManager.speak(questions[index].prompt); }
    function finish() { onComplete(score); }
</script>

<div class="boss3-card">
    <header>
        <div><p class="eyebrow">⚔️ Boss de l’étage 3</p><h2>Le gardien de la droite graduée</h2></div>
        <p class="progress-label">Question {Math.min(index + 1, questions.length)}/{questions.length}</p>
    </header>
    <div class="progress-track"><div class="progress-fill" style={`width:${(finished ? questions.length : index) / questions.length * 100}%`}></div></div>

    {#if finished}
        <section class="victory">
            <div class="trophy">🏆</div><h3>Épreuve terminée !</h3>
            <p>Score : {score}/{questions.length}</p>
            <p>Tu as travaillé la lecture, le placement et l’ordre des fractions sur la droite graduée.</p>
            <button onclick={finish}>Retourner dans la tour</button>
        </section>
    {:else}
        <section class="question">
            <div class="prompt-row"><h3>{questions[index].prompt}</h3><button class="audio" onclick={readQuestion} aria-label="Écouter la consigne">🔊</button></div>
            <div class="options" role="group" aria-label="Choisis une réponse">
                {#each questions[index].options as option}
                    <button type="button" class:selected={selected === option} class="option" disabled={locked} onclick={() => submit(option)}>{option}</button>
                {/each}
            </div>
            <p class:success={feedback.startsWith('Bonne')} aria-live="polite" class="feedback">{feedback}</p>
            {#if locked}<button class="primary" onclick={nextQuestion}>{index < questions.length - 1 ? 'Question suivante →' : 'Terminer →'}</button>{/if}
        </section>
    {/if}
</div>

<style>
.boss3-card{width:min(100%,760px);margin:auto;padding:24px;box-sizing:border-box;color:#172033;background:#fffdf7;border:1px solid #e7dcc8;border-radius:22px;box-shadow:0 12px 32px #0f172a2e}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #e7dcc8;padding-bottom:12px}
.eyebrow{margin:0 0 5px;color:#0e7490;font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
h2,h3,p{margin-top:0}h2{margin-bottom:0;font-size:1.4rem}.progress-label{padding:8px 10px;background:#e0f2fe;border-radius:10px;color:#075985;font-weight:800;white-space:nowrap}
.progress-track{height:8px;margin:18px 0 24px;background:#e5e7eb;border-radius:99px;overflow:hidden}.progress-fill{height:100%;background:#0e7490;transition:width .2s}
.question{display:flex;flex-direction:column;align-items:stretch;gap:18px}.prompt-row{display:flex;align-items:center;justify-content:center;gap:12px}.prompt-row h3{text-align:center;line-height:1.5;margin:0;font-size:1.15rem}
.audio{flex:0 0 auto;border:1px solid #a5f3fc;background:#ecfeff;color:#155e75;border-radius:50%;width:42px;height:42px;font-size:1.1rem;cursor:pointer}
.options{display:grid;grid-template-columns:1fr;gap:10px}.option{min-height:52px;padding:12px 16px;border:2px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;font-size:1rem;font-weight:700;text-align:left;cursor:pointer}.option:hover:not(:disabled){border-color:#0e7490;background:#ecfeff}.option.selected{border-color:#0e7490;background:#cffafe}.option:disabled{cursor:default;opacity:.8}
.primary,.victory button{align-self:center;border:0;border-radius:12px;padding:13px 20px;background:#0e7490;color:white;font-size:1rem;font-weight:800;cursor:pointer}.feedback{min-height:1.5em;margin:0;text-align:center;color:#b91c1c;font-weight:700;line-height:1.5}.feedback.success{color:#047857}.victory{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:28px 10px}.trophy{font-size:3rem}.victory h3{font-size:1.6rem;color:#047857;margin:0}.victory p{margin:0}.victory button{margin-top:8px}@media(min-width:600px){.options{grid-template-columns:1fr 1fr}.option:last-child:nth-child(odd){grid-column:1/-1}}@media(max-width:560px){.boss3-card{padding:16px}header{align-items:flex-start;flex-direction:column}.prompt-row{align-items:flex-start}}
</style>
