<script lang="ts">
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import type { ResponseDetail } from '$lib/orbis/results/contract';
  import type { Word } from './lexique';

  export let words: Word[] = [];
  export let studentName = '';

  type LabMode = 'dialogue' | 'ordre' | 'familles';
  type Dialogue = { prompt: string; choices: string[]; answer: string; word?: string };
  type Ordered = { prompt: string; parts: string[] };
  const familyMap: Record<string, string[]> = {
    soigner: ['soigner', 'soin', 'soignant'],
    réparer: ['réparer', 'réparation', 'réparateur'],
    apprendre: ['apprendre', 'apprentissage', 'apprenti'],
    protéger: ['protéger', 'protection', 'protecteur'],
    travailler: ['travail', 'travailler', 'travailleur'],
    lire: ['lire', 'lecture', 'lecteur'],
    écrire: ['écrire', 'écriture', 'écrivain']
  };
  let mode: LabMode = 'dialogue';
  let index = 0;
  let answer = '';
  let order: string[] = [];
  let feedback = '';
  let correct = 0;
  let attempts = 0;
  let responseDetails: ResponseDetail[] = [];

  $: vocabulary = new Set(words.map((item) => item.word.toLocaleLowerCase('fr')));
  $: dialogues = buildDialogues(words);
  $: orders = buildOrders(words);
  $: families = Object.values(familyMap).filter((family) => family.some((word) => vocabulary.has(word)));
  $: currentDialogue = dialogues[index % Math.max(1, dialogues.length)];
  $: currentOrder = orders[index % Math.max(1, orders.length)];
  $: currentFamily = families[index % Math.max(1, families.length)];

  function buildDialogues(entries: Word[]): Dialogue[] {
    const pick = (word: string, prompt: string, choices: string[]): Dialogue | undefined => {
      const item = entries.find((entry) => entry.word.toLocaleLowerCase('fr') === word);
      return item ? { prompt, choices, answer: item.word, word: item.word } : undefined;
    };
    return [
      pick('cahier', 'Je prends mon ___ pour écrire.', ['cahier', 'tableau', 'récréation']),
      pick('consigne', 'Je lis la ___ avant de commencer.', ['consigne', 'gomme', 'bibliothèque']),
      pick('question', 'Je pose une ___ au professeur.', ['question', 'feuille', 'réponse']),
      pick('rendez-vous', 'Bonjour, je voudrais prendre un ___ chez le médecin.', ['rendez-vous', 'terrain', 'bouquet']),
      pick('ordonnance', 'Bonjour, voici mon ___. Je voudrais ce médicament.', ['ordonnance', 'contrat', 'maillot']),
      pick('place d’apprentissage', 'Je cherche une ___ dans le métier de fleuriste.', ['place d’apprentissage', 'sortie', 'douleur']),
      pick('facture', 'Je voudrais payer cette ___.', ['facture', 'frange', 'cabine']),
      pick('renseignement', 'Excusez-moi, je voudrais demander un ___.', ['renseignement', 'vernis', 'ballon'])
    ].filter(Boolean) as Dialogue[];
  }

  function buildOrders(entries: Word[]): Ordered[] {
    const wordsSet = new Set(entries.map((entry) => entry.word.toLocaleLowerCase('fr')));
    const candidates: Ordered[] = [
      { prompt: 'En classe', parts: ['Je lis', 'la consigne', 'avant de répondre'] },
      { prompt: 'Pour demander de l’aide', parts: ['Je pose', 'une question', 'au professeur'] },
      { prompt: 'À la pharmacie', parts: ['Bonjour', 'je voudrais', 'ce médicament', 's’il vous plaît'] },
      { prompt: 'Pour un apprentissage', parts: ['Je cherche', 'une place', 'dans cette profession'] },
      { prompt: 'À la poste', parts: ['Je voudrais', 'envoyer', 'ce colis'] },
      { prompt: 'Chez le médecin', parts: ['J’ai', 'un rendez-vous', 'à dix heures'] }
    ];
    return candidates.filter((item) => item.parts.some((part) => [...wordsSet].some((word) => part.toLocaleLowerCase('fr').includes(word))));
  }

  function choose(value: string) {
    if (!currentDialogue) return;
    attempts++;
    const isCorrect = value === currentDialogue.answer;
    if (isCorrect) {
      correct++;
      feedback = 'Bonne réponse. La phrase est naturelle.';
    } else feedback = 'Essaie encore. Relis toute la phrase.';
    responseDetails = [...responseDetails, {
      questionIndex: index,
      questionId: `dialogue-${index + 1}`,
      category: 'Réemploi en dialogue',
      prompt: currentDialogue.prompt,
      response: value,
      expected: currentDialogue.answer,
      correct: isCorrect,
      attempts: 1
    }];
  }

  function shuffleOrder() {
    order = [...(currentOrder?.parts ?? [])].sort(() => Math.random() - .5);
    feedback = '';
  }

  function movePart(partIndex: number, direction: -1 | 1) {
    const next = partIndex + direction;
    if (next < 0 || next >= order.length) return;
    const copy = [...order];
    [copy[partIndex], copy[next]] = [copy[next], copy[partIndex]];
    order = copy;
  }

  function checkOrder() {
    attempts++;
    const expected = currentOrder?.parts ?? [];
    const isCorrect = order.join('|') === expected.join('|');
    if (isCorrect) {
      correct++;
      feedback = 'Bonne phrase. Les mots sont dans le bon ordre.';
    } else feedback = 'Ce n’est pas encore le bon ordre.';
    responseDetails = [...responseDetails, {
      questionIndex: index,
      questionId: `ordre-${index + 1}`,
      category: 'Réemploi : ordre des mots',
      prompt: currentOrder?.prompt,
      response: order.join(' '),
      expected: expected.join(' '),
      correct: isCorrect,
      attempts: 1,
      errorFamily: isCorrect ? undefined : 'ordre-des-mots'
    }];
  }

  function next() {
    index++;
    answer = '';
    feedback = '';
    order = [];
  }

  function finish() {
    if (!attempts) return;
    const questionCount = new Set(responseDetails.map((item) => item.questionId ?? String(item.questionIndex))).size;
    void recordGameActivity({
      studentName,
      gameId: 'musee_vocabulaire',
      activityId: `atelier-${mode}`,
      correctCount: correct,
      questionCount,
      errorCount: responseDetails.filter((item) => !item.correct).length,
      responseDetails,
      metadata: { selectedWords: words.length, mode }
    });
    feedback = 'Séance enregistrée. Tu peux continuer ou changer d’atelier.';
  }
</script>

<section class="context-lab" aria-labelledby="context-lab-title">
  <div class="lab-heading"><div><p class="eyebrow">ATELIER DE RÉEMPLOI</p><h2 id="context-lab-title">Utiliser les mots dans une situation</h2></div><span>{correct} réussite{correct > 1 ? 's' : ''}</span></div>
  <div class="lab-tabs" role="tablist" aria-label="Activités de réemploi">
    <button class:active={mode === 'dialogue'} on:click={() => { mode = 'dialogue'; next(); }}>Dialogue</button>
    <button class:active={mode === 'ordre'} on:click={() => { mode = 'ordre'; next(); }}>Remettre en ordre</button>
    <button class:active={mode === 'familles'} on:click={() => { mode = 'familles'; next(); }}>Familles de mots</button>
  </div>

  {#if mode === 'dialogue' && currentDialogue}
    <p class="lab-prompt">{currentDialogue.prompt}</p>
    <div class="lab-choices">{#each currentDialogue.choices as choice}<button class:chosen={answer === choice} on:click={() => { answer = choice; choose(choice); }}>{choice}</button>{/each}</div>
  {:else if mode === 'ordre' && currentOrder}
    <p class="lab-prompt">{currentOrder.prompt} : remets la phrase dans l’ordre.</p>
    {#if !order.length}<button class="primary" on:click={shuffleOrder}>Mélanger les morceaux</button>{:else}<ol class="order-parts">{#each order as part, partIndex}<li><span>{part}</span><button aria-label="Monter" on:click={() => movePart(partIndex, -1)}>↑</button><button aria-label="Descendre" on:click={() => movePart(partIndex, 1)}>↓</button></li>{/each}</ol><button class="primary" on:click={checkOrder}>Vérifier la phrase</button>{/if}
  {:else if mode === 'familles' && currentFamily}
    <p class="lab-prompt">Trouve les mots de la même famille.</p>
    <div class="family-words">{#each currentFamily as word}<button class:chosen={vocabulary.has(word)} disabled={vocabulary.has(word)}>{word}</button>{/each}</div>
    <p>Les mots d’une famille ont une partie de sens en commun.</p>
  {:else}
    <p>Choisis plusieurs thèmes ou ajoute une liste contenant des phrases pour ouvrir cet atelier.</p>
  {/if}
  {#if feedback}<p class:success={feedback.startsWith('Bonne')} class="lab-feedback" aria-live="polite">{feedback}</p>{/if}
  <div class="lab-actions"><button on:click={next}>Situation suivante</button><button on:click={finish}>Enregistrer la séance</button></div>
</section>

<style>
  .context-lab{padding:1.25rem;border:1px solid #d8c9ae;border-radius:1rem;background:#f8f2e5;margin:1rem 0}.lab-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.eyebrow{margin:0;color:#886126;font-size:.75rem;font-weight:900;letter-spacing:.08em}.lab-heading h2{margin:.25rem 0 0}.lab-tabs,.lab-choices,.lab-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin:1rem 0}.lab-tabs button,.lab-choices button,.family-words button,.lab-actions button{min-height:44px;padding:.65rem .85rem;border:1px solid #cdbd9e;border-radius:.65rem;background:#fffaf0;color:#332b1e;font-weight:800}.lab-tabs .active,.lab-choices .chosen,.family-words .chosen{background:#dfefdc;border-color:#70a36e}.lab-prompt{font-size:1.15rem;font-weight:800}.order-parts{display:grid;gap:.5rem;padding:0;list-style:none}.order-parts li{display:flex;align-items:center;gap:.5rem;padding:.55rem;background:#fffaf0;border:1px solid #d8c9ae;border-radius:.55rem}.order-parts li span{flex:1}.order-parts button{min-width:40px;min-height:40px}.lab-feedback{font-weight:800;color:#8e4d27}.lab-feedback.success{color:#267046}.lab-actions{justify-content:flex-end}
</style>
