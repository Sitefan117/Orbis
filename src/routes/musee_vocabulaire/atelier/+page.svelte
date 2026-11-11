<script lang="ts">
  type Word = { word: string; icon: string; definition: string };
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  type Mode = 'millionaire' | 'letters' | 'search' | 'match' | 'syllables';
  const words: Word[] = [
    { word: 'CAHIER', icon: '📓', definition: 'Un support où l’on écrit ou dessine.' },
    { word: 'CARTABLE', icon: '🎒', definition: 'Un sac pour transporter ses affaires d’école.' },
    { word: 'TABLEAU', icon: '🧑‍🏫', definition: 'Une surface sur laquelle l’enseignant écrit.' },
    { word: 'RECREATION', icon: '⚽', definition: 'Un moment où les élèves jouent et se détendent.' },
    { word: 'BIBLIOTHEQUE', icon: '📚', definition: 'Un lieu où l’on trouve et lit des livres.' },
    { word: 'TROUSSE', icon: '🖊️', definition: 'Un étui qui contient du matériel pour écrire.' }
  ];
  const gridRows = ['CARTABLEX', 'AHQWZIOPE', 'HBNIBLIOP', 'ITROUSSEX', 'ERDCAHIER', 'AUVQPLMNS', 'UXTABLEAU'];
  let mode: Mode = 'millionaire';
  let question = 0;
  let feedback = '';
  let score = 0;
  let selectedAnswer = '';
  let letters: string[] = [];
  let typed: string[] = [];
  let found: string[] = [];
  let dragged = '';
  let matched: Record<string, string> = {};
  let syllableRound = 0;
  let syllableSelection = ['', '', ''];
  const syllableWords = [
    { word: 'CARTABLE', icon: '🎒', parts: ['CAR', 'TA', 'BLE'], choices: [['CAR', 'CA', 'CRA'], ['TA', 'TE', 'TO'], ['BLE', 'BE', 'BLA']] },
    { word: 'DIRECTEUR', icon: '🧑‍💼', parts: ['DI', 'REC', 'TEUR'], choices: [['DI', 'DE', 'DA'], ['REC', 'RE', 'RA'], ['TEUR', 'TÈRE', 'TOUR']] },
    { word: 'BIBLIOTHÈQUE', icon: '📚', parts: ['BI', 'BLIO', 'THÈQUE'], choices: [['BI', 'BE', 'BA'], ['BLIO', 'LIO', 'BIO'], ['THÈQUE', 'TÈQUE', 'TIQUE']] }
  ];
  const quiz = [
    { prompt: 'Je range mes crayons dans ma…', answer: 'TROUSSE', options: ['TROUSSE', 'BIBLIOTHEQUE', 'TABLEAU', 'RECREATION'] },
    { prompt: 'Complète : « J’écris mes devoirs dans mon ___ ».', answer: 'CAHIER', options: ['CAHIER', 'CARTABLE', 'TABLEAU', 'TROUSSE'] },
    { prompt: 'Quel mot désigne le sac de l’élève ?', answer: 'CARTABLE', options: ['RECREATION', 'CARTABLE', 'CAHIER', 'BIBLIOTHEQUE'] }
  ];
  $: currentQuiz = quiz[question % quiz.length];
  $: currentWord = words[question % words.length];
  $: scrambled = letters.join('');
  $: remainingMatch = words.filter((item) => !matched[item.word]);
  $: syllableTarget = syllableWords[syllableRound % syllableWords.length];

  function chooseQuiz(answer: string) { selectedAnswer = answer; if (answer === currentQuiz.answer) { score += 1; feedback = 'Bonne réponse ! La vitrine est restaurée.'; } else feedback = `Pas encore : la bonne réponse était « ${currentQuiz.answer.toLowerCase()} ».`; }
  function next() { question += 1; selectedAnswer = ''; feedback = ''; typed = []; letters = []; }
  function startLetters() { const chars = currentWord.word.split(''); letters = [...chars].sort(() => Math.random() - .5); typed = []; feedback = 'Clique sur les lettres dans le bon ordre.'; }
  function addLetter(letter: string, i: number) { if (typed.length >= currentWord.word.length) return; typed = [...typed, letter]; letters = letters.filter((_, index) => index !== i); if (typed.join('') === currentWord.word) { score += 1; feedback = 'Mot reconstruit !'; } else if (typed.length === currentWord.word.length) { feedback = 'Ce n’est pas le bon mot. Recommence.'; } }
  function resetLetters() { letters = currentWord.word.split('').sort(() => Math.random() - .5); typed = []; feedback = ''; }
  function toggleFound(word: string) { if (found.includes(word)) return; found = [...found, word]; score += 1; feedback = `Bien trouvé : ${word.toLowerCase()} !`; }
  function dropOn(word: Word) { if (!dragged || matched[word.word]) return; if (dragged === word.word) { matched = { ...matched, [word.word]: word.word }; score += 1; feedback = 'Association correcte !'; } else feedback = 'Essaie encore avec cette image.'; dragged = ''; }
  function chooseSyllable(position: number, syllable: string) { syllableSelection[position] = syllable; syllableSelection = [...syllableSelection]; feedback = ''; }
  function checkSyllables() { if (syllableSelection.some((part) => !part)) { feedback = 'Choisis une syllabe dans chaque colonne.'; return; } if (syllableSelection.join('') === syllableTarget.word) { score += 1; feedback = `Bravo ! Tu as reconstruit « ${syllableTarget.word.toLowerCase()} ».`; } else feedback = 'Une syllabe ne convient pas. Écoute le mot et essaie encore.'; }
  function nextSyllable() { syllableRound += 1; syllableSelection = ['', '', '']; feedback = ''; }
  function selectMode(nextMode: Mode) { mode = nextMode; feedback = ''; if (nextMode === 'letters') startLetters(); }
  onMount(() => { const requested = new URLSearchParams(window.location.search).get('mode') as Mode; if (['millionaire', 'letters', 'search', 'match', 'syllables'].includes(requested)) selectMode(requested); });
</script>

<svelte:head><title>Atelier du musée des mots</title></svelte:head>
<div class="page">
  <header><div><p class="eyebrow">Musée des mots · atelier de test</p><h1>Les défis de la classe</h1><p>Huit mécaniques, un même vocabulaire scolaire.</p></div><div class="score">🏛️ <strong>{score}</strong> objets restaurés</div></header>
  <main>
    <nav class="tabs">
      <a href={`${base}/musee_vocabulaire?mode=pendu`}>🪢 Pendu restaurateur</a>
      <a href={`${base}/musee_vocabulaire?mode=whack-image`}>🔨 Image → mot</a>
      <a href={`${base}/musee_vocabulaire?mode=whack-word`}>🖼️ Mot → image</a>
      <button class:active={mode === 'millionaire'} on:click={() => selectMode('millionaire')}>💰 Qui veut gagner des mots ?</button>
      <button class:active={mode === 'letters'} on:click={() => selectMode('letters')}>🧩 Reconstruire le mot</button>
      <button class:active={mode === 'search'} on:click={() => selectMode('search')}>🔎 Mots cachés</button>
      <button class:active={mode === 'match'} on:click={() => selectMode('match')}>🖱️ Glisser vers l’image</button>
      <button class:active={mode === 'syllables'} on:click={() => selectMode('syllables')}>🚶 La récolte des syllabes</button>
    </nav>

    {#if mode === 'millionaire'}
      <section class="card hero"><span class="tag">Question {question % quiz.length + 1}/3</span><h2>{currentQuiz.prompt}</h2><div class="answers">{#each currentQuiz.options as answer}<button class:chosen={selectedAnswer === answer} class:correct={selectedAnswer && answer === currentQuiz.answer} class:wrong={selectedAnswer === answer && answer !== currentQuiz.answer} on:click={() => chooseQuiz(answer)}>{answer}</button>{/each}</div><p class="feedback">{feedback}</p>{#if selectedAnswer}<button class="primary" on:click={next}>Question suivante →</button>{/if}</section>
    {:else if mode === 'letters'}
      <section class="card hero"><span class="tag">Le petit restaurateur</span><h2>Reconstruis le mot à partir des lettres</h2><div class="character">🧑‍🔧 <span>{currentWord.icon}</span></div><p class="definition">{currentWord.definition}</p><div class="typed">{#each typed as letter}<span>{letter}</span>{/each}{#each Array(Math.max(0, currentWord.word.length - typed.length)) as _}<span class="empty">·</span>{/each}</div><div class="letters">{#each letters as letter, i}<button on:click={() => addLetter(letter, i)}>{letter}</button>{/each}</div><p class="feedback">{feedback}</p><button class="secondary" on:click={resetLetters}>Recommencer</button></section>
    {:else if mode === 'search'}
      <section class="card hero"><span class="tag">Sans diagonales · horizontal et vertical</span><h2>Retrouve les mots de l’école</h2><p>Les mots peuvent être lus de gauche à droite ou de haut en bas. Clique sur un mot trouvé.</p><div class="search-layout"><div class="word-grid">{#each gridRows as row}<div>{#each row.split('') as char}<span>{char}</span>{/each}</div>{/each}</div><div class="word-list">{#each words as word}<button class:found={found.includes(word.word)} on:click={() => toggleFound(word.word)}>{found.includes(word.word) ? '✓' : '○'} {word.word}</button>{/each}</div></div><p class="feedback">{feedback}</p></section>
    {:else if mode === 'match'}
      <section class="card hero"><span class="tag">Association par glisser-déposer</span><h2>Glisse chaque mot vers sa représentation</h2><p>Sur ordinateur, attrape un mot et dépose-le sur la bonne image. Sur tablette, on pourra prévoir un mode toucher.</p><div class="match-layout"><div class="drag-list">{#each remainingMatch as word}<button draggable="true" on:dragstart={() => dragged = word.word} on:click={() => dragged = word.word}>{word.word}</button>{/each}</div><div class="image-list">{#each words as word}<div role="button" tabindex="0" class:matched={matched[word.word]} on:dragover|preventDefault on:drop={() => dropOn(word)}><span>{word.icon}</span><small>{matched[word.word] ? word.word : 'Dépose ici'}</small></div>{/each}</div></div><p class="feedback">{feedback}</p></section>
    {:else}
      <section class="card hero syllable-game"><span class="tag">Début · milieu · fin</span><h2>Le petit collectionneur de syllabes</h2><p>Le personnage prend une vignette. Choisis ensuite les trois syllabes qui permettent de reconstruire son mot.</p>
        <div class="vignettes" aria-label="Vignettes de mots">{#each syllableWords as item, i}<button class:chosen={i === syllableRound % syllableWords.length} on:click={() => { syllableRound = i; syllableSelection = ['', '', '']; feedback = ''; }}><span>{item.icon}</span><small>{i === syllableRound % syllableWords.length ? 'Choisie' : 'À choisir'}</small></button>{/each}</div>
        <div class="collector"><span class="person">🚶</span><span class="arrow">→</span><span class="picked">{syllableTarget.icon}</span><strong>{syllableSelection.join(' · ') || 'Quel est ce mot ?'}</strong></div>
        <div class="syllable-columns">{#each ['Début du mot', 'Milieu du mot', 'Fin du mot'] as label, position}<div><h3>{position + 1}. {label}</h3>{#each syllableTarget.choices[position] as syllable}<button class:selected={syllableSelection[position] === syllable} on:click={() => chooseSyllable(position, syllable)}>{syllable}</button>{/each}</div>{/each}</div>
        <div class="assembled">{#each syllableSelection as part}<span class:empty={!part}>{part || '?'}</span>{/each}</div><p class="feedback">{feedback}</p><div class="actions"><button class="primary" on:click={checkSyllables}>Vérifier le mot</button>{#if feedback.startsWith('Bravo')}<button class="secondary" on:click={nextSyllable}>Vignette suivante →</button>{/if}</div>
      </section>
    {/if}
    <section class="card note"><strong>Intégration musée :</strong> chaque réussite restaure une vitrine. Pour une vraie maîtrise, on pourra demander ensuite une phrase avec le mot ou une fiche imprimable de révision.</section>
  </main>
</div>

<style>
  :global(body) { margin: 0; background: #f5efe4; color: #352b25; font-family: Inter, system-ui, sans-serif; } * { box-sizing: border-box; } button { font: inherit; cursor: pointer; }
  header { background: #31544f; color: #fffaf0; padding: 2rem max(1.25rem, calc((100% - 72rem)/2)); display: flex; align-items: center; justify-content: space-between; gap: 1rem; } h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.4rem); } header p { margin: .35rem 0 0; color: #d5e4dc; }.eyebrow, .tag { text-transform: uppercase; letter-spacing: .1em; font-size: .72rem; font-weight: 900; color: #c79845; }.eyebrow { color: #d9c8a5; }.score { background: #25423e; padding: .8rem 1rem; border-radius: 1rem; white-space: nowrap; }.score strong { font-size: 1.7rem; color: #f5d58a; }
  main { width: min(72rem, 100%); margin: auto; padding: 1.25rem; }.tabs { display: flex; flex-wrap: wrap; gap: .6rem; margin-bottom: 1rem; }.tabs button, .tabs a { background: #fffaf0; color: #352b25; border: 2px solid #d9c8a5; border-radius: 999px; padding: .75rem 1rem; font-weight: 900; text-decoration: none; }.tabs button.active { background: #c79845; color: white; border-color: #c79845; }.card { background: #fffaf0; border: 1px solid #dfd1b7; border-radius: 1.25rem; box-shadow: 0 12px 30px #5d442015; padding: clamp(1.1rem, 3vw, 2rem); }.hero { text-align: center; min-height: 28rem; } h2 { margin: .7rem 0 1.2rem; font-size: clamp(1.4rem, 3vw, 2.2rem); }.answers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; max-width: 40rem; margin: 2rem auto 1rem; }.answers button, .letters button, .drag-list button { border: 2px solid #d9c8a5; background: #fffdf8; border-radius: .8rem; padding: 1rem; font-weight: 900; }.answers button:hover, .letters button:hover { border-color: #31544f; }.answers .correct { background: #cce9d6; border-color: #3c8c59; }.answers .wrong { background: #f4caca; border-color: #b64d4d; }.character { font-size: 5rem; background: #f1e5cf; border-radius: 1rem; padding: .7rem; }.character span { font-size: 3rem; }.definition { margin: 1rem auto; max-width: 36rem; font-weight: 800; }.typed { display: flex; justify-content: center; gap: .35rem; margin: 1.2rem 0; }.typed span { width: 2.6rem; padding: .6rem; border-bottom: 3px solid #31544f; font-weight: 900; font-size: 1.4rem; }.typed .empty { color: #c79845; }.letters { display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; }.letters button { min-width: 2.8rem; padding: .7rem; }.search-layout, .match-layout { display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(12rem, .6fr); gap: 1.5rem; max-width: 52rem; margin: 2rem auto 1rem; align-items: start; }.word-grid { border: 3px solid #31544f; border-radius: .7rem; overflow: hidden; background: #e9ddc6; }.word-grid div { display: grid; grid-template-columns: repeat(9, 1fr); }.word-grid span { padding: .55rem .15rem; border: 1px solid #d4c2a2; font-weight: 900; font-size: clamp(.7rem, 2vw, 1.1rem); }.word-list, .drag-list { display: grid; gap: .45rem; }.word-list button { border: 0; background: #eadfc9; border-radius: .6rem; padding: .7rem; text-align: left; font-weight: 900; }.word-list button.found { background: #cce9d6; color: #287544; }.match-layout { grid-template-columns: .7fr 1fr; }.drag-list button { text-align: left; }.image-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }.image-list div { min-height: 6rem; background: #f1e5cf; border: 2px dashed #c79845; border-radius: .8rem; display: grid; place-items: center; padding: .5rem; }.image-list div.matched { background: #cce9d6; border-style: solid; }.image-list span { font-size: 2.8rem; }.image-list small { font-weight: 900; }.feedback { min-height: 1.5rem; font-weight: 900; color: #31544f; }.primary, .secondary { border: 0; border-radius: .8rem; padding: .8rem 1.2rem; font-weight: 900; }.primary { background: #31544f; color: white; }.secondary { background: #eadfc9; color: #352b25; }.note { margin-top: 1rem; color: #705f51; line-height: 1.5; }.note strong { color: #31544f; }
  .vignettes { display: flex; justify-content: center; gap: .7rem; flex-wrap: wrap; margin: 1rem 0; }.vignettes button { min-width: 7rem; border: 2px solid #d9c8a5; border-radius: .8rem; background: #fffdf8; padding: .6rem; }.vignettes button.chosen { border-color: #31544f; background: #e1ece6; }.vignettes span { display: block; font-size: 2.5rem; }.vignettes small { font-weight: 900; }.collector { display: flex; align-items: center; justify-content: center; gap: .7rem; background: #f1e5cf; border-radius: 1rem; padding: 1rem; margin: 1rem auto; max-width: 34rem; }.person { font-size: 3.8rem; }.arrow { font-size: 1.8rem; color: #c79845; }.picked { font-size: 3.8rem; }.collector strong { min-width: 8rem; }.syllable-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; max-width: 46rem; margin: 1.2rem auto; }.syllable-columns > div { background: #f7eddc; border-radius: .8rem; padding: .7rem; }.syllable-columns h3 { font-size: .9rem; margin: 0 0 .6rem; color: #705f51; }.syllable-columns button { display: block; width: 100%; border: 2px solid #d9c8a5; border-radius: .6rem; background: white; padding: .65rem; margin-top: .4rem; font-weight: 900; }.syllable-columns button.selected { color: white; background: #31544f; border-color: #31544f; }.assembled { display: flex; justify-content: center; gap: .3rem; }.assembled span { min-width: 4rem; border-bottom: 3px solid #c79845; padding: .5rem; font-size: 1.25rem; font-weight: 900; }.assembled span.empty { color: #b5a790; }.actions { display: flex; justify-content: center; gap: .6rem; flex-wrap: wrap; }
  @media (max-width: 650px) { header { flex-direction: column; align-items: flex-start; }.answers, .search-layout, .match-layout, .syllable-columns { grid-template-columns: 1fr; }.image-list { grid-template-columns: repeat(2, 1fr); }.hero { min-height: 24rem; } }
</style>
