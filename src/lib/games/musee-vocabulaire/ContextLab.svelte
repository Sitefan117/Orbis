<script lang="ts">
  import { base } from '$app/paths';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import type { ResponseDetail } from '$lib/orbis/results/contract';
  import { normalize, shuffle, type Word } from './lexique';
  import { conversations, type ConversationLine } from './context-content';

  export let words: Word[] = [];
  export let studentName = '';

  type LabMode = 'dialogue' | 'ordre' | 'discussion' | 'familles';
  type Dialogue = { id: string; prompt: string; choices: string[]; answer: string; theme: string; contextIndex: number };
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
  let conversationOrder: ConversationLine[] = [];
  let feedback = '';
  let solved = false;
  let correct = 0;
  let attempts = 0;
  let responseDetails: ResponseDetail[] = [];

  $: vocabulary = new Set(words.map((item) => item.word.toLocaleLowerCase('fr')));
  $: dialogues = buildDialogues(words);
  $: orders = buildOrders(words);
  $: families = Object.values(familyMap).filter((family) => family.some((word) => vocabulary.has(word)));
  $: selectedThemes = new Set(words.map((item) => item.theme));
  $: availableConversations = conversations.filter((item) => item.themes.some((theme) => selectedThemes.has(theme)));
  $: currentDialogue = dialogues[index % Math.max(1, dialogues.length)];
  $: currentOrder = orders[index % Math.max(1, orders.length)];
  $: currentFamily = families[index % Math.max(1, families.length)];
  $: currentConversation = availableConversations[index % Math.max(1, availableConversations.length)];

  function buildDialogues(entries: Word[]): Dialogue[] {
    const contextIndexes = new Map<string, number>();
    for (const entry of entries.filter((item) => item.sentence.includes('___'))) {
      const themeIndex = contextIndexes.get(entry.theme) ?? 0;
      contextIndexes.set(entry.id, themeIndex);
      contextIndexes.set(entry.theme, themeIndex + 1);
    }
    return entries.filter((entry) => entry.sentence.includes('___')).map((entry, entryIndex) => {
      const sameTheme = entries.filter((item) => item.id !== entry.id && item.theme === entry.theme);
      const otherThemes = entries.filter((item) => item.id !== entry.id && item.theme !== entry.theme);
      const pool = [...sameTheme, ...otherThemes];
      const start = pool.length ? entryIndex % pool.length : 0;
      const distractors: string[] = [];
      const seen = new Set([normalize(entry.word)]);
      for (const item of [...pool.slice(start), ...pool.slice(0, start)]) {
        if (seen.has(normalize(item.word))) continue;
        distractors.push(item.word);
        seen.add(normalize(item.word));
        if (distractors.length === 2) break;
      }
      const contextIndex = contextIndexes.get(entry.id) ?? -1;
      return { id: entry.id, prompt: entry.sentence, choices: shuffle([entry.word, ...distractors]), answer: entry.word, theme: entry.theme, contextIndex: contextIndex < 5 ? contextIndex : -1 };
    }).filter((item) => item.choices.length >= 2);
  }

  function contextStyle(theme: string, contextIndex: number) {
    const column = contextIndex % 3;
    const row = Math.floor(contextIndex / 3);
    return `background-image:url('${base}/images/musee-vocabulaire/context/${theme}.jpg');background-position:${column * 50}% ${row * 100}%`;
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
    if (!currentDialogue || solved) return;
    attempts++;
    const isCorrect = value === currentDialogue.answer;
    if (isCorrect) {
      correct++;
      solved = true;
      feedback = 'Bonne réponse. La phrase est naturelle.';
    } else feedback = 'Essaie encore. Relis toute la phrase.';
    responseDetails = [...responseDetails, {
      questionIndex: index,
      questionId: `dialogue-${currentDialogue.id}`,
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

  function shuffleConversation() {
    if (!currentConversation || solved) return;
    conversationOrder = shuffle(currentConversation.lines);
    if (conversationOrder.every((line, lineIndex) => line === currentConversation.lines[lineIndex]) && conversationOrder.length > 1) {
      conversationOrder = [...conversationOrder.slice(1), conversationOrder[0]];
    }
    feedback = '';
  }

  function moveConversationLine(lineIndex: number, direction: -1 | 1) {
    const nextIndex = lineIndex + direction;
    if (nextIndex < 0 || nextIndex >= conversationOrder.length) return;
    const copy = [...conversationOrder];
    [copy[lineIndex], copy[nextIndex]] = [copy[nextIndex], copy[lineIndex]];
    conversationOrder = copy;
  }

  function checkConversation() {
    if (!currentConversation) return;
    attempts++;
    const isCorrect = conversationOrder.every((line, lineIndex) => line === currentConversation.lines[lineIndex]);
    if (isCorrect) {
      correct++;
      solved = true;
      feedback = 'Bonne discussion. Les répliques sont dans le bon ordre.';
    } else feedback = 'L’ordre n’est pas encore juste. Regarde qui parle et ce qui est demandé.';
    responseDetails = [...responseDetails, {
      questionIndex: index,
      questionId: `discussion-${currentConversation.id}`,
      category: 'Réemploi : ordre d’une discussion',
      prompt: currentConversation.title,
      response: conversationOrder.map((line) => `${line.speaker} : ${line.text}`).join(' / '),
      expected: currentConversation.lines.map((line) => `${line.speaker} : ${line.text}`).join(' / '),
      correct: isCorrect,
      attempts: 1,
      errorFamily: isCorrect ? undefined : 'ordre-des-repliques'
    }];
  }

  function checkOrder() {
    if (solved) return;
    attempts++;
    const expected = currentOrder?.parts ?? [];
    const isCorrect = order.join('|') === expected.join('|');
    if (isCorrect) {
      correct++;
      solved = true;
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
    conversationOrder = [];
    solved = false;
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
    <button class:active={mode === 'dialogue'} on:click={() => { mode = 'dialogue'; next(); }}>Phrase à compléter</button>
    <button class:active={mode === 'ordre'} on:click={() => { mode = 'ordre'; next(); }}>Remettre une phrase en ordre</button>
    <button class:active={mode === 'discussion'} on:click={() => { mode = 'discussion'; next(); }}>Discussion</button>
    <button class:active={mode === 'familles'} on:click={() => { mode = 'familles'; next(); }}>Familles de mots</button>
  </div>

  {#if mode === 'dialogue' && currentDialogue}
    <div class:with-context={currentDialogue.contextIndex >= 0} class="dialogue-stage">
      {#if currentDialogue.contextIndex >= 0}
        <figure class="context-figure">
          <span class="context-image" role="img" aria-label="Illustration de la situation" style={contextStyle(currentDialogue.theme, currentDialogue.contextIndex)}></span>
          <figcaption>Observe la situation.</figcaption>
        </figure>
      {/if}
      <div class="dialogue-question">
        <p class="lab-prompt">{currentDialogue.prompt}</p>
        <div class="lab-choices">{#each currentDialogue.choices as choice}<button class:chosen={answer === choice} disabled={solved} on:click={() => { answer = choice; choose(choice); }}>{choice}</button>{/each}</div>
      </div>
    </div>
  {:else if mode === 'ordre' && currentOrder}
    <p class="lab-prompt">{currentOrder.prompt} : remets la phrase dans l’ordre.</p>
    {#if !order.length}<button class="primary" on:click={shuffleOrder}>Mélanger les morceaux</button>{:else}<ol class="order-parts">{#each order as part, partIndex}<li><span>{part}</span><button aria-label="Monter" disabled={solved || partIndex === 0} on:click={() => movePart(partIndex, -1)}>↑</button><button aria-label="Descendre" disabled={solved || partIndex === order.length - 1} on:click={() => movePart(partIndex, 1)}>↓</button></li>{/each}</ol><button class="primary" disabled={solved} on:click={checkOrder}>Vérifier la phrase</button>{/if}
  {:else if mode === 'discussion' && currentConversation}
    <p class="lab-prompt">{currentConversation.title}</p>
    <p>Remets les répliques dans l’ordre.</p>
    {#if !conversationOrder.length}
      <button class="primary" on:click={shuffleConversation}>Mélanger les répliques</button>
    {:else}
      <ol class="order-parts conversation-parts">
        {#each conversationOrder as line, lineIndex}
          <li><span><strong>{line.speaker} :</strong> {line.text}</span><button aria-label={`Monter la réplique de ${line.speaker}`} disabled={solved || lineIndex === 0} on:click={() => moveConversationLine(lineIndex, -1)}>↑</button><button aria-label={`Descendre la réplique de ${line.speaker}`} disabled={solved || lineIndex === conversationOrder.length - 1} on:click={() => moveConversationLine(lineIndex, 1)}>↓</button></li>
        {/each}
      </ol>
      <button class="primary" disabled={solved} on:click={checkConversation}>Vérifier la discussion</button>
    {/if}
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
  .context-lab{padding:1.25rem;border:1px solid #d8c9ae;border-radius:1rem;background:#f8f2e5;margin:1rem 0}.lab-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.eyebrow{margin:0;color:#886126;font-size:.75rem;font-weight:900;letter-spacing:.08em}.lab-heading h2{margin:.25rem 0 0}.lab-tabs,.lab-choices,.lab-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin:1rem 0}.lab-tabs button,.lab-choices button,.family-words button,.lab-actions button{min-height:44px;padding:.65rem .85rem;border:1px solid #cdbd9e;border-radius:.65rem;background:#fffaf0;color:#332b1e;font-weight:800}.lab-tabs .active,.lab-choices .chosen,.family-words .chosen{background:#dfefdc;border-color:#70a36e}.dialogue-stage{margin:1rem 0}.dialogue-stage.with-context{display:grid;grid-template-columns:minmax(14rem,20rem) minmax(0,1fr);gap:1.25rem;align-items:center}.dialogue-question{min-width:0}.lab-prompt{font-size:1.2rem;font-weight:800;line-height:1.55}.context-figure{display:grid;justify-items:center;gap:.45rem;margin:0;padding:.65rem;border:1px solid #d8c9ae;border-radius:.85rem;background:#fffaf0}.context-image{display:block;width:100%;aspect-ratio:1;background-size:300% 200%;background-repeat:no-repeat;border-radius:.65rem;border:1px solid #cdbd9e}.context-figure figcaption{font-size:.9rem;font-weight:700;color:#5f5442;text-align:center}.order-parts{display:grid;gap:.5rem;padding:0;list-style:none}.order-parts li{display:flex;align-items:center;gap:.5rem;padding:.55rem;background:#fffaf0;border:1px solid #d8c9ae;border-radius:.55rem;text-align:left}.order-parts li span{flex:1;line-height:1.5}.order-parts button{min-width:44px;min-height:44px}.conversation-parts li{border-left:4px solid #886126}.lab-feedback{font-weight:800;color:#8e4d27}.lab-feedback.success{color:#267046}.lab-actions{justify-content:flex-end}
  @media(max-width:680px){.dialogue-stage.with-context{grid-template-columns:1fr}.context-figure{width:min(100%,20rem);justify-self:center}.lab-heading{align-items:flex-start}.lab-heading>span{white-space:nowrap}}
</style>
