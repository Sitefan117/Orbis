<script lang="ts">
  type Word = { word: string; sprite: number; definition: string };
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  type Mode = 'millionaire' | 'letters' | 'search' | 'match' | 'syllables';
  const words: Word[] = [
    { word: 'CAHIER', sprite: 0, definition: 'Un support où l’on écrit ou dessine.' },
    { word: 'CARTABLE', sprite: 1, definition: 'Un sac pour transporter ses affaires d’école.' },
    { word: 'TABLEAU', sprite: 2, definition: 'Une surface sur laquelle l’enseignant écrit.' },
    { word: 'RECREATION', sprite: 3, definition: 'Un moment où les élèves jouent et se détendent.' },
    { word: 'BIBLIOTHEQUE', sprite: 4, definition: 'Un lieu où l’on trouve et lit des livres.' },
    { word: 'TROUSSE', sprite: 5, definition: 'Un étui qui contient du matériel pour écrire.' }
  ];
  const SEARCH_SIZE = 13;
  const searchPlacements = [
    { word: 'CARTABLE', row: 0, col: 0, direction: 'h' },
    { word: 'CAHIER', row: 2, col: 1, direction: 'h' },
    { word: 'TROUSSE', row: 4, col: 3, direction: 'h' },
    { word: 'TABLEAU', row: 6, col: 12, direction: 'v' },
    { word: 'RECREATION', row: 1, col: 11, direction: 'v' },
    { word: 'BIBLIOTHEQUE', row: 11, col: 0, direction: 'h' }
  ];
  const searchGrid = buildSearchGrid();
  let mode: Mode = 'millionaire';
  let question = 0;
  let feedback = '';
  let score = 0;
  let selectedAnswer = '';
  let letters: string[] = [];
  let typed: string[] = [];
  let found: string[] = [];
  let selectedCells: string[] = [];
  let eliminatedSearchCells: string[] = [];
  let dragged = '';
  let matched: Record<string, string> = {};
  let eliminatedOptions: string[] = [];
  let eliminatedImages: string[] = [];
  let eliminatedSyllables: string[] = [];
  let syllableRound = 0;
  let syllableSelection = ['', '', ''];
  const syllableWords = [
    { word: 'CARTABLE', sprite: 1, parts: ['CAR', 'TA', 'BLE'], choices: [['CAR', 'CA', 'CRA'], ['TA', 'TE', 'TO'], ['BLE', 'BE', 'BLA']] },
    { word: 'DIRECTEUR', sprite: 6, parts: ['DI', 'REC', 'TEUR'], choices: [['DI', 'DE', 'DA'], ['REC', 'RE', 'RA'], ['TEUR', 'TÈRE', 'TOUR']] },
    { word: 'BIBLIOTHÈQUE', sprite: 4, parts: ['BI', 'BLIO', 'THÈQUE'], choices: [['BI', 'BE', 'BA'], ['BLIO', 'LIO', 'BIO'], ['THÈQUE', 'TÈQUE', 'TIQUE']] }
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

  function chooseQuiz(answer: string) { if (eliminatedOptions.includes(answer)) return; selectedAnswer = answer; if (answer === currentQuiz.answer) { score += 1; feedback = 'Bonne réponse ! La vitrine est restaurée.'; } else feedback = 'Cette proposition ne convient pas encore.'; }
  function next() { question += 1; selectedAnswer = ''; feedback = ''; typed = []; letters = []; eliminatedOptions = []; eliminatedImages = []; }
  function startLetters() { const decoys = ['M', 'P']; const chars = [...currentWord.word.split(''), ...decoys]; letters = chars.sort(() => Math.random() - .5); typed = []; feedback = 'Clique sur les lettres dans le bon ordre. Deux lettres sont inutiles.'; eliminatedOptions = []; }
  function addLetter(letter: string, i: number) { if (typed.length >= currentWord.word.length) return; typed = [...typed, letter]; letters = letters.filter((_, index) => index !== i); if (typed.join('') === currentWord.word) { score += 1; feedback = 'Mot reconstruit !'; } else if (typed.length === currentWord.word.length) { feedback = 'Ce n’est pas le bon mot. Recommence.'; } }
  function resetLetters() { startLetters(); }
  function buildSearchGrid() {
    const fillers = 'AZERTYUIOPQSDFGHJKLMWXCVBN';
    const grid = Array.from({ length: SEARCH_SIZE }, (_, row) => Array.from({ length: SEARCH_SIZE }, (_, col) => fillers[(row * 7 + col * 11) % fillers.length]));
    for (const placement of searchPlacements) placement.word.split('').forEach((letter, index) => { const row = placement.row + (placement.direction === 'v' ? index : 0); const col = placement.col + (placement.direction === 'h' ? index : 0); grid[row][col] = letter; });
    return grid;
  }
  function placementCells(placement: typeof searchPlacements[number]) { return placement.word.split('').map((_, index) => `${placement.row + (placement.direction === 'v' ? index : 0)}-${placement.col + (placement.direction === 'h' ? index : 0)}`); }
  function clickSearchCell(row: number, col: number) {
    const key = `${row}-${col}`;
    if (eliminatedSearchCells.includes(key)) return;
    selectedCells = selectedCells.includes(key) ? selectedCells.filter((cell) => cell !== key) : [...selectedCells, key];
    for (const placement of searchPlacements) {
      const cells = placementCells(placement);
      if (!found.includes(placement.word) && cells.every((cell) => selectedCells.includes(cell))) { found = [...found, placement.word]; score += 1; feedback = `Bien trouvé : ${placement.word.toLowerCase()} !`; }
    }
  }
  function isFoundCell(row: number, col: number) { const key = `${row}-${col}`; return searchPlacements.some((placement) => found.includes(placement.word) && placementCells(placement).includes(key)); }
  function dropOn(word: Word) { if (!dragged || matched[word.word] || eliminatedImages.includes(word.word)) return; if (dragged === word.word) { matched = { ...matched, [word.word]: word.word }; score += 1; feedback = 'Association correcte !'; } else feedback = 'Cette image ne correspond pas. Essaie encore.'; dragged = ''; }
  function chooseSyllable(position: number, syllable: string) { syllableSelection[position] = syllable; syllableSelection = [...syllableSelection]; feedback = ''; }
  function checkSyllables() { if (syllableSelection.some((part) => !part)) { feedback = 'Choisis une syllabe dans chaque colonne.'; return; } if (syllableSelection.join('') === syllableTarget.word) { score += 1; feedback = `Bravo ! Tu as reconstruit « ${syllableTarget.word.toLowerCase()} ».`; } else feedback = 'Une syllabe ne convient pas. Écoute le mot et essaie encore.'; }
  function nextSyllable() { syllableRound += 1; syllableSelection = ['', '', '']; eliminatedSyllables = []; feedback = ''; }
  function selectMode(nextMode: Mode) { mode = nextMode; feedback = ''; if (nextMode === 'letters') startLetters(); }
  onMount(() => { const requested = new URLSearchParams(window.location.search).get('mode') as Mode; if (['millionaire', 'letters', 'search', 'match', 'syllables'].includes(requested)) selectMode(requested); });
  function spriteStyle(sprite: number) { const x = (sprite % 3) * 50; const y = Math.floor(sprite / 3) * 50; return `background-image:url('${base}/images/musee-vocabulaire/ecole-sprites-v1.png');background-position:${x}% ${y}%`; }
  function useHint() {
    if (mode === 'millionaire') {
      const wrong = currentQuiz.options.find((option) => option !== currentQuiz.answer && !eliminatedOptions.includes(option));
      if (wrong) { eliminatedOptions = [...eliminatedOptions, wrong]; feedback = 'Une réponse inutile a été éliminée.'; }
    } else if (mode === 'letters') {
      const needed = currentWord.word.slice(typed.length).split('');
      const extraIndex = letters.findIndex((letter, index) => letters.slice(0, index + 1).filter((item) => item === letter).length > needed.filter((item) => item === letter).length);
      if (extraIndex >= 0) { letters = letters.filter((_, index) => index !== extraIndex); feedback = 'Une lettre inutile a été retirée.'; }
    } else if (mode === 'search') {
      const useful = new Set(searchPlacements.filter((placement) => !found.includes(placement.word)).flatMap(placementCells));
      const candidates = searchGrid.flatMap((row, r) => row.map((_, c) => `${r}-${c}`)).filter((cell) => !useful.has(cell) && !eliminatedSearchCells.includes(cell));
      eliminatedSearchCells = [...eliminatedSearchCells, ...candidates.slice(0, 6)]; feedback = 'Six lettres inutiles ont été estompées.';
    } else if (mode === 'match') {
      if (!dragged) { feedback = 'Choisis d’abord un mot, puis demande une aide.'; return; }
      const wrong = words.find((word) => word.word !== dragged && !matched[word.word] && !eliminatedImages.includes(word.word));
      if (wrong) { eliminatedImages = [...eliminatedImages, wrong.word]; feedback = 'Une image inutile a été éliminée.'; }
    } else {
      const wrong = syllableTarget.choices.flatMap((choices, position) => choices.map((choice) => ({ choice, position }))).find(({ choice, position }) => choice !== syllableTarget.parts[position] && !eliminatedSyllables.includes(`${position}-${choice}`));
      if (wrong) { eliminatedSyllables = [...eliminatedSyllables, `${wrong.position}-${wrong.choice}`]; feedback = 'Une syllabe inutile a été éliminée.'; }
    }
  }
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
      <section class="card hero"><span class="tag">Question {question % quiz.length + 1}/3</span><h2>{currentQuiz.prompt}</h2><div class="answers">{#each currentQuiz.options as answer}<button disabled={eliminatedOptions.includes(answer)} class:eliminated={eliminatedOptions.includes(answer)} class:chosen={selectedAnswer === answer} class:correct={selectedAnswer && answer === currentQuiz.answer} class:wrong={selectedAnswer === answer && answer !== currentQuiz.answer} on:click={() => chooseQuiz(answer)}>{answer}</button>{/each}</div><p class="feedback">{feedback}</p>{#if selectedAnswer}<button class="primary" on:click={next}>Question suivante →</button>{/if}</section>
    {:else if mode === 'letters'}
      <section class="card hero"><span class="tag">Le petit restaurateur</span><h2>Reconstruis le mot à partir des lettres</h2><div class="character"><span class="walker">Petit restaurateur →</span><span class="sprite character-sprite" style={spriteStyle(currentWord.sprite)}></span></div><p class="definition">{currentWord.definition}</p><div class="typed">{#each typed as letter}<span>{letter}</span>{/each}{#each Array(Math.max(0, currentWord.word.length - typed.length)) as _}<span class="empty">·</span>{/each}</div><div class="letters">{#each letters as letter, i}<button on:click={() => addLetter(letter, i)}>{letter}</button>{/each}</div><p class="feedback">{feedback}</p><button class="secondary" on:click={resetLetters}>Recommencer</button></section>
    {:else if mode === 'search'}
      <section class="card hero"><span class="tag">Sans diagonales · horizontal et vertical</span><h2>Retrouve les mots de l’école</h2><p>Clique sur les lettres d’un mot. Elles deviennent bleues pendant ta recherche, puis vertes quand le mot entier est trouvé.</p><div class="search-layout"><div class="word-grid">{#each searchGrid as row, r}<div>{#each row as char, c}<button aria-label={`Lettre ${char}, ligne ${r + 1}, colonne ${c + 1}`} class:selected={selectedCells.includes(`${r}-${c}`)} class:found={isFoundCell(r, c)} class:eliminated={eliminatedSearchCells.includes(`${r}-${c}`)} disabled={eliminatedSearchCells.includes(`${r}-${c}`)} on:click={() => clickSearchCell(r, c)}>{char}</button>{/each}</div>{/each}</div><div class="word-list">{#each words as word}<div class:found={found.includes(word.word)}>{found.includes(word.word) ? '✓' : '○'} {word.word}</div>{/each}</div></div><p class="feedback">{feedback}</p></section>
    {:else if mode === 'match'}
      <section class="card hero"><span class="tag">Association par glisser-déposer</span><h2>Glisse chaque mot vers sa représentation</h2><p>Attrape un mot et dépose-le sur la bonne image. Sur tablette, touche d’abord le mot puis l’image.</p><div class="match-layout"><div class="drag-list">{#each remainingMatch as word}<button class:active-word={dragged === word.word} draggable="true" on:dragstart={() => dragged = word.word} on:click={() => dragged = word.word}>{word.word}</button>{/each}</div><div class="image-list">{#each words as word}<button class:matched={matched[word.word]} class:eliminated={eliminatedImages.includes(word.word)} disabled={eliminatedImages.includes(word.word)} on:dragover|preventDefault on:drop={() => dropOn(word)} on:click={() => dropOn(word)}><span class="sprite match-sprite" style={spriteStyle(word.sprite)}></span><small>{matched[word.word] ? word.word : 'Dépose ici'}</small></button>{/each}</div></div><p class="feedback">{feedback}</p></section>
    {:else}
      <section class="card hero syllable-game"><span class="tag">Début · milieu · fin</span><h2>Le petit collectionneur de syllabes</h2><p>Le personnage prend une vignette. Choisis ensuite les trois syllabes qui permettent de reconstruire son mot.</p>
        <div class="vignettes" aria-label="Vignettes de mots">{#each syllableWords as item, i}<button class:chosen={i === syllableRound % syllableWords.length} on:click={() => { syllableRound = i; syllableSelection = ['', '', '']; eliminatedSyllables = []; feedback = ''; }}><span class="sprite vignette-sprite" style={spriteStyle(item.sprite)}></span><small>{i === syllableRound % syllableWords.length ? 'Choisie' : 'À choisir'}</small></button>{/each}</div>
        <div class="collector"><span class="person">Le collectionneur</span><span class="arrow">→</span><span class="picked sprite" style={spriteStyle(syllableTarget.sprite)}></span><strong>{syllableSelection.join(' · ') || 'Quel est ce mot ?'}</strong></div>
        <div class="syllable-columns">{#each ['Début du mot', 'Milieu du mot', 'Fin du mot'] as label, position}<div><h3>{position + 1}. {label}</h3>{#each syllableTarget.choices[position] as syllable}<button disabled={eliminatedSyllables.includes(`${position}-${syllable}`)} class:eliminated={eliminatedSyllables.includes(`${position}-${syllable}`)} class:selected={syllableSelection[position] === syllable} on:click={() => chooseSyllable(position, syllable)}>{syllable}</button>{/each}</div>{/each}</div>
        <div class="assembled">{#each syllableSelection as part}<span class:empty={!part}>{part || '?'}</span>{/each}</div><p class="feedback">{feedback}</p><div class="actions"><button class="primary" on:click={checkSyllables}>Vérifier le mot</button>{#if feedback.startsWith('Bravo')}<button class="secondary" on:click={nextSyllable}>Vignette suivante →</button>{/if}</div>
      </section>
    {/if}
    <div class="global-help"><button class="help" on:click={useHint}>Aide : éliminer un élément inutile</button></div>
    <section class="card note"><strong>Intégration musée :</strong> chaque réussite restaure une vitrine. Pour une vraie maîtrise, on pourra demander ensuite une phrase avec le mot ou une fiche imprimable de révision.</section>
  </main>
</div>

<style>
  :global(body) { margin: 0; background: #f5efe4; color: #352b25; font-family: Inter, system-ui, sans-serif; } * { box-sizing: border-box; } button { font: inherit; cursor: pointer; }
  header { background: #31544f; color: #fffaf0; padding: 2rem max(1.25rem, calc((100% - 72rem)/2)); display: flex; align-items: center; justify-content: space-between; gap: 1rem; } h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.4rem); } header p { margin: .35rem 0 0; color: #d5e4dc; }.eyebrow, .tag { text-transform: uppercase; letter-spacing: .1em; font-size: .72rem; font-weight: 900; color: #c79845; }.eyebrow { color: #d9c8a5; }.score { background: #25423e; padding: .8rem 1rem; border-radius: 1rem; white-space: nowrap; }.score strong { font-size: 1.7rem; color: #f5d58a; }
  main { width: min(72rem, 100%); margin: auto; padding: 1.25rem; }.tabs { display: flex; flex-wrap: wrap; gap: .6rem; margin-bottom: 1rem; }.tabs button, .tabs a { background: #fffaf0; color: #352b25; border: 2px solid #d9c8a5; border-radius: 999px; padding: .75rem 1rem; font-weight: 900; text-decoration: none; }.tabs button.active { background: #c79845; color: white; border-color: #c79845; }.card { background: #fffaf0; border: 1px solid #dfd1b7; border-radius: 1.25rem; box-shadow: 0 12px 30px #5d442015; padding: clamp(1.1rem, 3vw, 2rem); }.hero { text-align: center; min-height: 28rem; } h2 { margin: .7rem 0 1.2rem; font-size: clamp(1.4rem, 3vw, 2.2rem); }.answers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; max-width: 40rem; margin: 2rem auto 1rem; }.answers button, .letters button, .drag-list button { border: 2px solid #d9c8a5; background: #fffdf8; border-radius: .8rem; padding: 1rem; font-weight: 900; }.answers button:hover, .letters button:hover { border-color: #31544f; }.answers .correct { background: #cce9d6; border-color: #3c8c59; }.answers .wrong { background: #f4caca; border-color: #b64d4d; }.character { font-size: 5rem; background: #f1e5cf; border-radius: 1rem; padding: .7rem; }.character span { font-size: 3rem; }.definition { margin: 1rem auto; max-width: 36rem; font-weight: 800; }.typed { display: flex; justify-content: center; gap: .35rem; margin: 1.2rem 0; }.typed span { width: 2.6rem; padding: .6rem; border-bottom: 3px solid #31544f; font-weight: 900; font-size: 1.4rem; }.typed .empty { color: #c79845; }.letters { display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; }.letters button { min-width: 2.8rem; padding: .7rem; }.search-layout, .match-layout { display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(12rem, .6fr); gap: 1.5rem; max-width: 52rem; margin: 2rem auto 1rem; align-items: start; }.word-grid { border: 3px solid #31544f; border-radius: .7rem; overflow: hidden; background: #e9ddc6; }.word-grid div { display: grid; grid-template-columns: repeat(9, 1fr); }.word-list, .drag-list { display: grid; gap: .45rem; }.match-layout { grid-template-columns: .7fr 1fr; }.drag-list button { text-align: left; }.image-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }.image-list small { font-weight: 900; }.feedback { min-height: 1.5rem; font-weight: 900; color: #31544f; }.primary, .secondary { border: 0; border-radius: .8rem; padding: .8rem 1.2rem; font-weight: 900; }.primary { background: #31544f; color: white; }.secondary { background: #eadfc9; color: #352b25; }.note { margin-top: 1rem; color: #705f51; line-height: 1.5; }.note strong { color: #31544f; }
  .vignettes { display: flex; justify-content: center; gap: .7rem; flex-wrap: wrap; margin: 1rem 0; }.vignettes button { min-width: 7rem; border: 2px solid #d9c8a5; border-radius: .8rem; background: #fffdf8; padding: .6rem; }.vignettes button.chosen { border-color: #31544f; background: #e1ece6; }.vignettes span { display: block; font-size: 2.5rem; }.vignettes small { font-weight: 900; }.collector { display: flex; align-items: center; justify-content: center; gap: .7rem; background: #f1e5cf; border-radius: 1rem; padding: 1rem; margin: 1rem auto; max-width: 34rem; }.person { font-size: 3.8rem; }.arrow { font-size: 1.8rem; color: #c79845; }.picked { font-size: 3.8rem; }.collector strong { min-width: 8rem; }.syllable-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; max-width: 46rem; margin: 1.2rem auto; }.syllable-columns > div { background: #f7eddc; border-radius: .8rem; padding: .7rem; }.syllable-columns h3 { font-size: .9rem; margin: 0 0 .6rem; color: #705f51; }.syllable-columns button { display: block; width: 100%; border: 2px solid #d9c8a5; border-radius: .6rem; background: white; padding: .65rem; margin-top: .4rem; font-weight: 900; }.syllable-columns button.selected { color: white; background: #31544f; border-color: #31544f; }.assembled { display: flex; justify-content: center; gap: .3rem; }.assembled span { min-width: 4rem; border-bottom: 3px solid #c79845; padding: .5rem; font-size: 1.25rem; font-weight: 900; }.assembled span.empty { color: #b5a790; }.actions { display: flex; justify-content: center; gap: .6rem; flex-wrap: wrap; }
  .sprite { display: block; background-repeat: no-repeat; background-size: 300% 300%; background-color: transparent; }.character { display: flex; align-items: center; justify-content: center; gap: 1rem; min-height: 9rem; }.character .walker { font-size: 1rem; font-weight: 900; color: #31544f; }.character-sprite { width: 8rem; height: 8rem; }.answers button.eliminated, .syllable-columns button.eliminated { opacity: .16; text-decoration: line-through; }.word-grid div { grid-template-columns: repeat(13, 1fr); }.word-grid button { aspect-ratio: 1; min-width: 0; padding: .15rem; border: 1px solid #d4c2a2; background: #fffaf0; color: #352b25; font-weight: 900; font-size: clamp(.55rem, 1.6vw, .9rem); }.word-grid button.selected { background: #a9d4ee; border-color: #2779a7; color: #123e57; }.word-grid button.found { background: #9dddaf; border-color: #287544; color: #174d2a; }.word-grid button.eliminated { opacity: .18; }.word-list div { background: #eadfc9; border-radius: .6rem; padding: .7rem; text-align: left; font-weight: 900; }.word-list div.found { background: #cce9d6; color: #287544; }.image-list button { min-height: 7rem; background: #f1e5cf; border: 2px dashed #c79845; border-radius: .8rem; display: grid; place-items: center; padding: .35rem; }.image-list button.matched { background: #cce9d6; border-style: solid; }.image-list button.eliminated { opacity: .14; }.match-sprite { width: 5.5rem; height: 5.5rem; }.drag-list button.active-word { border-color: #31544f; background: #e1ece6; }.vignette-sprite { width: 5rem; height: 5rem; margin: auto; }.collector .person { font-size: .9rem; font-weight: 900; color: #31544f; }.collector .picked { width: 6rem; height: 6rem; }.global-help { display: flex; justify-content: center; margin-top: -4.5rem; padding-bottom: 1.5rem; position: relative; z-index: 2; }.help { border: 2px solid #c79845; background: #fff5d9; color: #5f481b; border-radius: 999px; padding: .75rem 1rem; font-weight: 900; }
  @media (max-width: 650px) { header { flex-direction: column; align-items: flex-start; }.answers, .search-layout, .match-layout, .syllable-columns { grid-template-columns: 1fr; }.image-list { grid-template-columns: repeat(2, 1fr); }.hero { min-height: 24rem; } }
</style>
