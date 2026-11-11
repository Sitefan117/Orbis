<script lang="ts">
  import { base } from '$app/paths';
  import { onMount, tick } from 'svelte';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import lexique from '../../../../static/vocabulaire/lexique.csv?raw';
  import poses from '../../../../static/mascotte-noireau/index.json';
  import { gridSize, gridWord, makeGrid, matchRounds, normalize, readLexique, shuffle, spriteStyle, type Word } from './lexique';

  export let initialMode = 'whack-image';
  const modes = [
    ['pendu', 'Pendu restaurateur'], ['whack-image', 'Image → mot'],
    ['whack-word', 'Mot → image'], ['millionaire', 'Qui veut gagner des mots ?'],
    ['letters', 'Reconstruire le mot'], ['search', 'Mots cachés'],
    ['match', 'Associer à l’image'], ['syllables', 'Récolte des syllabes']
  ] as const;
  type Mode = typeof modes[number][0];
  type Reaction = 'ready' | 'correct' | 'retry' | 'hint' | 'progress' | 'complete';
  type Tile = { id: number; text: string; decoy: boolean };
  type ExerciseFormat = 'definitions' | 'phrases';
  const modeLabels = Object.fromEntries(modes);
  const frenchAlphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÆÇÉÈÊËÎÏÔŒÙÛÜŸ');
  const original = readLexique(lexique);
  const sheet = poses.planches.find((entry) => entry.id === 'catalogue-guide')!;
  const poseByReaction: Record<Reaction, string> = {
    ready: 'presenter', correct: 'celebrer', retry: 'oups', hint: 'pointer bas',
    progress: 'reflechir', complete: 'saluer'
  };
  const opening: Record<Mode, string> = {
    pendu: 'Lis l’indice. Essaie des lettres pour trouver le mot.',
    'whack-image': 'Regarde l’image. Choisis le bon mot.',
    'whack-word': 'Lis le mot. Choisis la bonne image.',
    millionaire: 'Choisis la réponse qui convient.',
    letters: 'Choisis les lettres dans le bon ordre.',
    search: 'Clique sur les lettres du mot. Lis de gauche à droite ou de haut en bas.',
    match: 'Choisis un mot, puis son image. Tu peux aussi glisser le mot sur l’image.',
    syllables: 'Choisis un morceau par colonne pour former le mot.'
  };

  let bank = original;
  let selectedThemes = ['ecole'];
  let categories = getCategories(bank);
  let mode: Mode = 'whack-image';
  let playing: Word[] = [];
  let queue: Word[] = [];
  let seriesSize = 0;
  let target: Word | undefined;
  let options: Word[] = [];
  let ready = false;
  let inHall = true;
  let gameHeading: HTMLHeadingElement;
  let hallNavigation: HTMLElement;
  async function enterMachine(next: Mode) {
    start(next);
    inHall = false;
    await tick();
    gameHeading?.focus();
  }
  async function returnToHall() {
    inHall = true;
    await tick();
    hallNavigation?.querySelector<HTMLButtonElement>(`button[data-mode="${mode}"]`)?.focus();
  }
  let student = '';
  let message = '';
  let reaction: Reaction = 'ready';
  let solved = false;
  let skipped = false;
  let attempts = 0;
  let eliminated: string[] = [];
  let gallery: Word[] = [];
  let tiles: Tile[] = [];
  let typed: Tile[] = [];
  let guesses: string[] = [];
  let syllableOptions: string[][] = [];
  let vignettes: Word[] = [];
  let parts: string[] = [];
  let grid = { cells: [] as string[], targets: [] as ReturnType<typeof makeGrid>['targets'] };
  let selectedCells: number[] = [];
  let greenCells: number[] = [];
  let fadedCells: number[] = [];
  let found: string[] = [];
  let matched: string[] = [];
  let picked: Word | undefined;
  let matchWords: Word[] = [];
  let matchSets: Word[][] = [];
  let matchIndex = -1;
  let quizFormat: ExerciseFormat = 'definitions';
  let sheetFormat: ExerciseFormat = 'definitions';
  let printedFormat: ExerciseFormat = 'definitions';
  let importMessage = '';
  let settingsOpen = false;
  let printWords: Word[] = [];
  let showKey = false;

  $: categories = getCategories(bank);
  $: selectedCount = bank.filter((entry) => selectedThemes.includes(entry.theme)).length;
  $: selectedSentenceCount = bank.filter((entry) => entry.sentence && selectedThemes.includes(entry.theme)).length;
  $: isImageMode = mode === 'whack-image' || mode === 'whack-word' || mode === 'match';
  $: pose = reaction === 'ready' && mode === 'syllables' ? 'pointer bas'
    : reaction === 'progress' && mode === 'match' ? 'encourager'
    : reaction === 'ready' && mode === 'millionaire' ? 'accueillir' : poseByReaction[reaction];
  $: poseRow = sheet.poses.findIndex((row) => row.includes(pose));
  $: poseCol = sheet.poses[poseRow].indexOf(pose);
  $: alphabet = Array.from(new Set([...frenchAlphabet, ...gridWord(target?.word ?? '')]));
  $: matchImages = options;

  function getCategories(entries: Word[]) {
    return Array.from(new Map(entries.map((word) => [word.theme, word])).values());
  }

  onMount(() => {
    inHall = !new URLSearchParams(window.location.search).has('mode');
    const requested = new URLSearchParams(window.location.search).get('mode') ?? initialMode;
    student = getStudentName('');
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('orbis-musee-themes') ?? 'null');
      if (Array.isArray(saved) && saved.length && saved.every((id) => categories.some((word) => word.theme === id))) selectedThemes = saved;
    } catch { /* The default theme works without storage. */ }
    start(modes.find(([id]) => id === requested)?.[0] ?? 'whack-image');
    ready = true;
  });

  function report(text: string, state: Reaction = 'progress') {
    message = text;
    reaction = state;
  }

  function rememberThemes() {
    try { localStorage.setItem('orbis-musee-themes', JSON.stringify(selectedThemes)); } catch { /* Optional. */ }
  }

  function toggleTheme(theme: string) {
    selectedThemes = selectedThemes.includes(theme) ? selectedThemes.filter((item) => item !== theme) : [...selectedThemes, theme];
  }

  function start(next: Mode) {
    mode = next;
    settingsOpen = false;
    playing = bank.filter((entry) => selectedThemes.includes(entry.theme));
    rememberThemes();
    const eligible = playing.filter((entry) => {
      if (next === 'syllables') return entry.syllables.length >= 2;
      if (next === 'whack-image' || next === 'whack-word' || next === 'match') return Boolean(entry.sprite);
      if (next === 'letters' || next === 'pendu') return gridWord(entry.word).length >= 2;
      return next !== 'millionaire' || quizFormat === 'definitions' || Boolean(entry.sentence);
    });
    queue = shuffle(eligible);
    seriesSize = queue.length;
    if (next === 'match') {
      matchSets = matchRounds(queue);
      matchIndex = -1;
    }
    nextRound();
  }

  function distinctWords(entries: Word[]) {
    return Array.from(new Map(entries.map((entry) => [normalize(entry.word), entry])).values());
  }

  function nextRound() {
    target = undefined;
    options = [];
    eliminated = [];
    guesses = [];
    tiles = [];
    typed = [];
    parts = [];
    vignettes = [];
    picked = undefined;
    solved = false;
    skipped = false;
    attempts = 0;
    report(opening[mode], 'ready');

    if (mode === 'search') {
      grid = makeGrid(distinctWords(playing));
      selectedCells = [];
      greenCells = [];
      fadedCells = [];
      found = [];
      return;
    }
    if (mode === 'match') {
      matchIndex = matchSets.length ? (matchIndex + 1) % matchSets.length : -1;
      matchWords = shuffle(matchSets[matchIndex] ?? []);
      options = shuffle(matchWords);
      matched = [];
      return;
    }

    if (!queue.length) {
      if (seriesSize) report('Série terminée. Tu peux en lancer une autre.', 'complete');
      return;
    }
    const [entry, ...rest] = queue;
    target = entry;
    queue = rest;
    const distractors = distinctWords(playing.filter((item) =>
      normalize(item.word) !== normalize(entry.word) && (mode !== 'whack-word' || (item.sprite && item.sprite !== entry.sprite))));
    const nearby = shuffle(distractors.filter((item) => item.theme === entry.theme));
    const others = shuffle(distractors.filter((item) => item.theme !== entry.theme));
    options = shuffle([entry, ...[...nearby, ...others].slice(0, mode === 'millionaire' ? 3 : 2)]);
    if (mode === 'letters') {
      const letters = Array.from(gridWord(entry.word));
      const extras = shuffle(frenchAlphabet.slice(0, 26).filter((letter) => !letters.includes(letter))).slice(0, 3);
      tiles = shuffle([...letters, ...extras].map((text, id) => ({ id, text, decoy: id >= letters.length })));
    }
    if (mode === 'syllables') {
      if (entry.sprite) {
        const others = shuffle(distinctWords(playing.filter((item) => item.sprite && item.sprite !== entry.sprite)));
        vignettes = shuffle([entry, ...others.slice(0, 2)]);
      }
      parts = entry.syllables.map(() => '');
      syllableOptions = entry.syllables.map((part, index) => {
        const candidates = new Set(playing.map((item) => item.syllables[index]).filter((item) => item && item !== part));
        return shuffle([part, ...shuffle([...candidates]).slice(0, 2)]);
      });
    }
  }

  function collect(entry: Word) {
    if (!gallery.some((item) => item.id === entry.id)) gallery = [...gallery, entry];
  }

  function success(entry: Word) {
    collect(entry);
    solved = true;
    report(`Bien joué ! « ${entry.word} » est dans ta collection.`, 'correct');
  }

  function choose(entry: Word) {
    if (!target || solved || eliminated.includes(entry.id)) return;
    if (entry.id === target.id) success(target);
    else {
      eliminated = [...eliminated, entry.id];
      report('Ce n’est pas le bon choix. Essaie encore.', 'retry');
    }
  }

  function addGuess(letter: string) {
    if (!target || solved || skipped || guesses.includes(letter) || eliminated.includes(letter)) return;
    guesses = [...guesses, letter];
    const answer = gridWord(target.word);
    if (Array.from(answer).every((char) => guesses.includes(char))) success(target);
    else if (!answer.includes(letter)) {
      attempts++;
      report('Cette lettre n’est pas dans le mot.', 'retry');
      if (attempts === 6) {
        skipped = true;
        report(`Le mot était « ${target.word} ». Passe au suivant quand tu veux.`, 'retry');
      }
    } else report('Une lettre du mot a été retrouvée.');
  }

  function displayTiles(word: string, chosen: Tile[]) {
    let position = 0;
    return Array.from(word.toLocaleUpperCase('fr'), (char) =>
      /\p{L}/u.test(char) ? chosen[position++]?.text ?? '＿' : char).join(' ');
  }

  function addTile(tile: Tile) {
    if (!target || solved || typed.length >= gridWord(target.word).length) return;
    typed = [...typed, tile];
    const guess = typed.map((item) => item.text).join('');
    if (guess === gridWord(target.word)) success(target);
    else if (guess.length === gridWord(target.word).length) report('Vérifie les lettres et leur ordre. Essaie encore.', 'retry');
    else report('Continue à chercher les lettres.');
  }

  function checkParts() {
    if (!target || solved || parts.some((part) => !part)) return;
    if (parts.join('') === target.word) success(target);
    else report('Relis ton mot. Il faut changer au moins un morceau.', 'retry');
  }

  function selectCell(index: number) {
    if (greenCells.includes(index) || fadedCells.includes(index)) return;
    selectedCells = selectedCells.includes(index) ? selectedCells.filter((item) => item !== index) : [...selectedCells, index];
    const match = grid.targets.filter(({ entry }) => !found.includes(entry.id)).map(({ entry, paths }) =>
      ({ entry, path: paths.find((path) => path.every((cell) => selectedCells.includes(cell) || greenCells.includes(cell))) }))
      .find((item) => item.path?.includes(index));
    if (match?.path) {
      found = [...found, match.entry.id];
      greenCells = [...new Set([...greenCells, ...match.path])];
      selectedCells = selectedCells.filter((cell) => !greenCells.includes(cell));
      collect(match.entry);
      report(`« ${match.entry.word} » trouvé ! ${found.length}/${grid.targets.length}.`, found.length === grid.targets.length ? 'complete' : 'correct');
    } else report('Tes lettres sont en bleu.');
  }

  function selectMatch(entry: Word) {
    if (picked?.id !== entry.id) {
      eliminated = [];
    }
    picked = entry;
  }

  function matchImage(entry: Word) {
    if (!picked || matched.includes(entry.id) || eliminated.includes(entry.id)) return;
    if (picked.id !== entry.id) {
      eliminated = [...eliminated, entry.id];
      report('Cette image ne correspond pas au mot choisi.', 'retry');
      return;
    }
    matched = [...matched, entry.id];
    collect(entry);
    picked = undefined;
    eliminated = [];
    report('Association correcte !', matched.length === matchWords.length ? 'complete' : 'correct');
  }

  function useHint() {
    if (solved || skipped || reaction === 'complete') return;
    let text = '';
    if (mode === 'search') {
      const useful = new Set(grid.targets.flatMap(({ paths }) => paths.flat()));
      const faded = new Set(fadedCells);
      const extra = shuffle(grid.cells.map((_, i) => i).filter((i) => !useful.has(i) && !faded.has(i))).slice(0, 8);
      fadedCells = [...fadedCells, ...extra];
      selectedCells = selectedCells.filter((i) => !fadedCells.includes(i));
      if (extra.length) text = `Noireau a mis ${extra.length} case${extra.length === 1 ? '' : 's'} en gris.`;
    } else if (mode === 'match') {
      if (!picked) return report('Choisis d’abord un mot.', 'hint');
      const candidate = options.find((entry) => entry.id !== picked?.id && !matched.includes(entry.id) && !eliminated.includes(entry.id));
      if (candidate) {
        eliminated = [...eliminated, candidate.id];
        text = 'Noireau a retiré une image.';
      }
    } else if (target) {
      if (mode === 'pendu') {
        const answer = gridWord(target.word);
        const extra = shuffle(alphabet.filter((letter) =>
          !answer.includes(letter) && !guesses.includes(letter) && !eliminated.includes(letter))).slice(0, 5);
        eliminated = [...eliminated, ...extra];
        if (extra.length) text = 'Noireau a retiré des lettres.';
      } else if (mode === 'letters') {
        const decoy = typed.find((item) => item.decoy) ?? tiles.find((item) => item.decoy);
        if (decoy) {
          tiles = tiles.filter((item) => item.id !== decoy.id);
          typed = typed.filter((item) => item.id !== decoy.id);
          text = 'Noireau a retiré une lettre.';
        }
      } else if (mode === 'syllables') {
        const answer = target.syllables;
        const index = syllableOptions.findIndex((choices, position) => choices.some((part) => part !== answer[position]));
        if (index >= 0) {
          const wrong = syllableOptions[index].includes(parts[index]) && parts[index] !== answer[index]
            ? parts[index] : syllableOptions[index].find((part) => part !== answer[index]);
          syllableOptions = syllableOptions.map((choices, position) => position === index ? choices.filter((item) => item !== wrong) : choices);
          if (parts[index] === wrong) parts = parts.map((part, position) => position === index ? '' : part);
          text = 'Noireau a retiré un morceau.';
        }
      } else {
        const wrong = options.find((item) => item.id !== target?.id && !eliminated.includes(item.id));
        if (wrong) {
          eliminated = [...eliminated, wrong.id];
          text = mode === 'whack-word' ? 'Noireau a retiré une image.' : 'Noireau a retiré un mot.';
        }
      }
    }
    report(text || 'Noireau n’a plus de choix à retirer. À toi de jouer !', 'hint');
  }

  async function importCsv(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Le fichier dépasse 2 Mo.');
      const entries = readLexique(await file.text());
      bank = Array.from(new Map([...bank, ...entries].map((word) => [word.id, word])).values());
      selectedThemes = [...new Set(entries.map((word) => word.theme))];
      importMessage = `${entries.length} entrées chargées pour cette session. Valide les thèmes pour les utiliser.`;
    } catch (error) {
      importMessage = error instanceof Error ? error.message : 'Impossible de lire ce CSV.';
    } finally {
      input.value = '';
    }
  }

  let worksheet: HTMLElement;

  async function prepareSheet() {
    const choices = bank.filter((entry) => selectedThemes.includes(entry.theme) &&
      (sheetFormat === 'definitions' || entry.sentence));
    if (!choices.length) return;
    printWords = shuffle(distinctWords(choices)).slice(0, 10);
    printedFormat = sheetFormat;
    showKey = false;
    await tick();
    worksheet.focus();
  }
</script>

<svelte:head><title>Le musée des mots · Orbis</title></svelte:head>

<div class="museum" class:studio={mode === 'millionaire'} class:workshop={mode === 'match'}>
  <header class="no-print">
    <div class="shell">
      <a href={catalogHref(base, 'jeux', student)} use:restoreCatalogReturn={base}>← Arcade Orbis</a>
      <h1>Le musée des mots</h1>
      <p>La salle des machines</p>
    </div>
  </header>
  <main class="shell no-print">
    <section class="settings" aria-label="Thèmes de vocabulaire">
      <button class="secondary" aria-expanded={settingsOpen} on:click={() => settingsOpen = !settingsOpen}>Choisir les thèmes</button>
      <span>{selectedThemes.length} thème{selectedThemes.length > 1 ? 's' : ''} · {selectedCount} entrées</span>
      {#if settingsOpen}
        <div class="filters">
          {#each [['base', 'Les essentiels'], ['avance', 'Pour aller plus loin']] as [tier, title]}
            <fieldset>
              <legend>{title}</legend>
              {#each categories.filter((entry) => entry.tier === tier) as theme (theme.theme)}
                <label><input type="checkbox" checked={selectedThemes.includes(theme.theme)} on:change={() => toggleTheme(theme.theme)} /> {theme.label}</label>
              {/each}
            </fieldset>
          {/each}
        </div>
        <div class="actions">
          <button class="primary" disabled={!selectedCount} on:click={() => { printWords = []; start(mode); }}>Utiliser ces thèmes</button>
          <button on:click={() => selectedThemes = categories.map((entry) => entry.theme)}>Tout cocher</button>
          <button on:click={() => selectedThemes = []}>Tout décocher</button>
        </div>
        <details>
          <summary>Lexique CSV et fiches</summary>
          <div class="actions">
            <a href={`${base}/vocabulaire/lexique.csv`} download>Télécharger le lexique CSV</a>
            <label>Ajouter un CSV <input type="file" accept=".csv,text/csv" on:change={importCsv} /></label>
            <label>Type de fiche
              <select bind:value={sheetFormat}>
                <option value="definitions">Définitions</option>
                <option value="phrases">Phrases à compléter</option>
              </select>
            </label>
            <button disabled={sheetFormat === 'phrases' ? !selectedSentenceCount : !selectedCount} on:click={prepareSheet}>Préparer la fiche</button>
          </div>
          <p role="status">{importMessage}</p>
        </details>
      {/if}
    </section>

    {#if inHall}
    <div class="hall-guide"><span class="noireau" role="img" aria-label="Noireau, ton guide" style:background-image={`url('${base}/mascotte-noireau/${sheet.fichier}')`} style:background-position="0% 0%"></span><div><h2>Bienvenue au musée.</h2><p>Choisis une machine pour jouer.<br />Je suis là si tu as besoin d’aide.</p></div></div>
    <nav class="machine-hall" aria-label="Choisir un jeu" bind:this={hallNavigation}>
      {#each modes as [id, label], index}
        <button data-mode={id} disabled={!ready || !selectedCount} on:click={() => enterMachine(id)}><span class="machine-art" aria-hidden="true" style:background-image={`url('${base}/images/musee-vocabulaire/machines.png')`} style:background-position={`${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100}%`}></span><span class="machine-label"><small>{String(index + 1).padStart(2, '0')}</small>{label}</span></button>
      {/each}
    </nav>
    {:else}
    <button class="return-hall" on:click={returnToHall}>← Choisir une autre machine</button>
    <section class="game" aria-label={modeLabels[mode]}>
      <div class="machine-heading"><span class="machine-art" aria-hidden="true" style:background-image={`url('${base}/images/musee-vocabulaire/machines.png')`} style:background-position={`${(modes.findIndex(([id]) => id === mode) % 4) * 100 / 3}% ${Math.floor(modes.findIndex(([id]) => id === mode) / 4) * 100}%`}></span><h2 tabindex="-1" bind:this={gameHeading}>{modeLabels[mode]}</h2></div>
      {#if ready}
        {#if mode === 'millionaire'}
          <label class="quiz-format">Type de question
            <select bind:value={quizFormat} on:change={() => start('millionaire')}>
              <option value="definitions">Définitions</option>
              <option value="phrases">Phrases à compléter</option>
            </select>
          </label>
        {/if}
        <div class="coach">
          <span class="noireau" role="img" aria-label="Noireau"
            style:background-image={`url('${base}/mascotte-noireau/${sheet.fichier}')`}
            style:background-position={`${poseCol * 100 / 3}% ${poseRow * 100}%`}></span>
          <p aria-live="polite">{message}</p>
        </div>
        {#if mode === 'search' && grid.targets.length}
          <div class="search">
            <div class="grid" style:grid-template-columns={`repeat(${gridSize}, minmax(0, 1fr))`} aria-label="Grille des mots cachés">
              {#each grid.cells as letter, index}
                <button aria-label={`${letter}, ligne ${Math.floor(index / gridSize) + 1}, colonne ${index % gridSize + 1}`}
                  aria-pressed={selectedCells.includes(index) || greenCells.includes(index)}
                  class:blue={selectedCells.includes(index)} class:green={greenCells.includes(index)}
                  class:faded={fadedCells.includes(index)} disabled={fadedCells.includes(index) || greenCells.includes(index)}
                  on:click={() => selectCell(index)}>{letter}</button>
              {/each}
            </div>
            <ul>
              {#each grid.targets as { entry }}
                <li class:green={found.includes(entry.id)}>{found.includes(entry.id) ? '✓ ' : ''}{entry.word}</li>
              {/each}
            </ul>
          </div>
          <button disabled={!selectedCells.length} on:click={() => { selectedCells = []; report(opening.search, 'ready'); }}>Effacer le bleu</button>
        {:else if mode === 'match' && matchWords.length >= 2}
          <p>Série {matchIndex + 1} sur {matchSets.length}</p>
          <div class="matches">
            <div class="choices">
              {#each matchWords as entry (entry.id)}
                <button draggable={!matched.includes(entry.id)} disabled={matched.includes(entry.id)}
                  aria-pressed={picked?.id === entry.id}
                  on:dragstart={(event) => { event.dataTransfer?.setData('text/plain', entry.id); selectMatch(entry); }}
                  on:click={() => selectMatch(entry)}>{entry.word}</button>
              {/each}
            </div>
            <div class="choices">
              {#each matchImages as entry (entry.id)}
                <button class:green={matched.includes(entry.id)} class:faded={eliminated.includes(entry.id)}
                  disabled={matched.includes(entry.id) || eliminated.includes(entry.id)}
                  aria-label={matched.includes(entry.id) ? entry.word : entry.definition}
                  on:click={() => matchImage(entry)} on:dragover|preventDefault on:drop|preventDefault={() => matchImage(entry)}>
                  <span class="sprite" style={spriteStyle(base, entry.sprite)}></span>
                  {#if matched.includes(entry.id)}✓ {entry.word}{/if}
                </button>
              {/each}
            </div>
          </div>
        {:else if target && (!(isImageMode || mode === 'millionaire') || options.length >= 2)}
          {#if mode === 'syllables' && vignettes.length}
            <div class="vignettes" aria-label="Vignettes du collectionneur">
              {#each vignettes as entry (entry.id)}
                <div class:chosen={entry.id === target.id}>
                  <span class="sprite" role="img" aria-label={entry.definition} style={spriteStyle(base, entry.sprite)}></span>
                  {#if entry.id === target.id}<small>Choisie par Noireau</small>{/if}
                </div>
              {/each}
            </div>
          {:else if mode === 'whack-image'}
            <span class="sprite large" role="img" aria-label={target.definition} style={spriteStyle(base, target.sprite)}></span>
          {:else if mode === 'whack-word'}
            <p class="prompt">{target.word}</p>
          {:else}
            <p class="prompt">{mode === 'millionaire' && quizFormat === 'phrases' ? target.sentence : target.definition}</p>
          {/if}

          {#if mode === 'pendu'}
            <p>Essais restants · {6 - attempts}</p>
            <p class="slots">{Array.from(target.word.toLocaleUpperCase('fr'), (char) => !/\p{L}/u.test(char) || guesses.includes(char) || skipped ? char : '＿').join(' ')}</p>
            <div class="tiles">
              {#each alphabet as letter}
                <button class:faded={eliminated.includes(letter)} disabled={guesses.includes(letter) || eliminated.includes(letter) || solved || skipped} on:click={() => addGuess(letter)}>{letter}</button>
              {/each}
            </div>
          {:else if mode === 'letters'}
            <p class="slots">{displayTiles(target.word, typed)}</p>
            <div class="tiles">
              {#each tiles as tile (tile.id)}
                <button disabled={typed.includes(tile) || solved} on:click={() => addTile(tile)}>{tile.text}</button>
              {/each}
            </div>
            <button disabled={!typed.length || solved} on:click={() => { typed = typed.slice(0, -1); report(opening.letters); }}>Enlever la dernière lettre</button>
          {:else if mode === 'syllables'}
            <div class="syllables">
              {#each syllableOptions as group, index}
                <fieldset>
                  <legend>{index === 0 ? 'Début' : index === parts.length - 1 ? 'Fin' : `Milieu ${parts.length > 3 ? index : ''}`}</legend>
                  {#each group as part}
                    <button aria-pressed={parts[index] === part} disabled={solved}
                      on:click={() => { parts = parts.map((item, position) => position === index ? part : item); }}>{part}</button>
                  {/each}
                </fieldset>
              {/each}
            </div>
            <p class="slots">{parts.map((part) => part || '＿').join(' · ')}</p>
            <button class="primary" disabled={solved || parts.some((part) => !part)} on:click={checkParts}>Vérifier le mot</button>
          {:else}
            <div class="choices">
              {#each options as entry (entry.id)}
                <button class:green={solved && entry.id === target.id} class:faded={eliminated.includes(entry.id)}
                  disabled={solved || eliminated.includes(entry.id)}
                  aria-label={mode === 'whack-word' ? entry.definition : entry.word}
                  on:click={() => choose(entry)}>
                  {#if mode === 'whack-word'}
                    <span class="sprite" style={spriteStyle(base, entry.sprite)}></span>
                  {:else}{entry.word}{/if}
                </button>
              {/each}
            </div>
          {/if}
        {:else if reaction !== 'complete'}
          <p>{mode === 'whack-image' ? 'Il faut au moins deux mots, dont un avec une image.'
            : isImageMode ? 'Il faut au moins deux mots avec une image.'
            : mode === 'millionaire' && quizFormat === 'phrases' && !seriesSize
              ? 'Ces thèmes ne contiennent aucune phrase à compléter. Choisis « Définitions » ou ajoute un thème.'
              : 'Il manque des mots pour ce jeu. Essaie avec un autre thème.'}</p>
          <div class="actions">
            <button on:click={() => settingsOpen = true}>Changer les thèmes</button>
            {#if mode !== 'millionaire'}<button on:click={() => { quizFormat = 'definitions'; start('millionaire'); }}>Jouer au quiz de définitions</button>{/if}
          </div>
        {/if}
        <div class="actions controls">
          {#if (target && (!(isImageMode || mode === 'millionaire') || options.length >= 2)) || (mode === 'match' && matchWords.length >= 2) || (mode === 'search' && grid.targets.length)}
            <button disabled={solved || skipped || reaction === 'complete'} on:click={useHint}>Aide</button>
            <button class="primary" on:click={nextRound}>{mode === 'search' ? 'Nouvelle grille' : mode === 'match'
              ? matchSets.length === 1 ? 'Rejouer la série' : 'Nouvelle série' : 'Mot suivant'}</button>
          {:else if reaction === 'complete'}
            <button class="primary" on:click={() => start(mode)}>Rejouer</button>
          {/if}
        </div>
      {/if}
    </section>
    {/if}
    <aside class="game">
      <h2>Ma collection · {gallery.length}</h2>
      {#if gallery.length}
        <ul class="collection">
          {#each gallery as entry (entry.id)}
            <li>
              {#if entry.sprite}<span class="sprite" style={spriteStyle(base, entry.sprite)}></span>{/if}
              {entry.word}
            </li>
          {/each}
        </ul>
      {:else}<p>Retrouve un mot pour l’ajouter à ta collection.</p>{/if}
    </aside>
  </main>
  {#if printWords.length}
    <section class="worksheet" aria-labelledby="worksheet-title" tabindex="-1" bind:this={worksheet}>
      <div class="actions no-print">
        <button on:click={() => showKey = !showKey}>{showKey ? 'Voir la fiche élève' : 'Voir le corrigé'}</button>
        <button class="primary" on:click={() => window.print()}>{showKey ? 'Imprimer le corrigé' : 'Imprimer la fiche'}</button>
      </div>
      <h2 id="worksheet-title">{showKey ? 'Corrigé · Le musée des mots' : 'Fiche élève · Le musée des mots'}</h2>
      {#if !showKey}
        <p>Prénom _____________________ Date _____________________</p>
        <p>{printedFormat === 'phrases' ? 'Pour chaque phrase, écris la bonne réponse de la liste dans le trou.' : 'Lis chaque indice. Écris la bonne réponse de la liste.'}</p>
        <p>{[...printWords].map((word) => word.word).sort((a, b) => a.localeCompare(b, 'fr')).join(' · ')}</p>
      {/if}
      <ol>
        {#each printWords as entry}
          <li>
            {#if printedFormat === 'phrases'}
              {@const [start, end] = entry.sentence.split('___')}
              {start}{#if showKey}<strong>{entry.word}</strong>{:else}__________________{/if}{end}
            {:else}
              {entry.definition}<br />{showKey ? entry.word : '________________________________________'}
            {/if}
          </li>
        {/each}
      </ol>
    </section>
  {/if}
</div>

<style>
  .museum { min-height: 100vh; background: #f5efe3; color: #322820; }
  .shell { width: min(72rem, 100%); margin: auto; padding: 1.25rem; }
  header { background: #25453c; color: #fff9ee; }
  header a { color: #eee5d3; }
  h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin: .45rem 0; }
  h2 { margin-top: 0; }
  .settings, .game { background: #fffaf0; border: 1px solid #d8c9ae; padding: clamp(.9rem, 3vw, 1.6rem); border-radius: 1rem; margin-bottom: 1rem; }
  .settings > span { margin-inline-start: .75rem; }
  .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: .75rem; margin-block: .9rem; }
  fieldset { border: 1px solid #d8c9ae; border-radius: .7rem; min-width: 0; }
  legend { font-weight: 750; }
  fieldset label { display: block; padding: .3rem; }
  input[type=checkbox] { accent-color: #25453c; }
  details { margin-top: .8rem; }
  details .actions { margin-top: .6rem; }
  nav, .actions, .tiles, .choices { display: flex; flex-wrap: wrap; gap: .55rem; }
  nav { margin-bottom: 1rem; }
  button { border: 1px solid #bda77e; border-radius: .6rem; padding: .65rem .85rem; background: #fffdf7; font-weight: 700; }
  button:hover:not(:disabled) { border-color: #25453c; background: #e9f0e8; }
  button:focus-visible, a:focus-visible { outline: 3px solid #38749a; outline-offset: 2px; }
  button.primary, button[aria-pressed=true]:not(.grid button) { background: #25453c; border-color: #25453c; color: white; }
  .secondary { background: #ede1c8; }
  .quiz-format { display: block; margin-bottom: .8rem; }
  .game { text-align: center; }
  .coach { display: flex; justify-content: center; align-items: center; gap: .8rem; min-height: 7rem; background: #efe6d3; border-radius: .85rem; margin-bottom: 1rem; padding: .3rem .65rem; }
  .coach p { font-weight: 700; }
  .noireau { display: block; width: 4.8rem; aspect-ratio: 3/4; flex: 0 0 auto; background-size: 400% 200%; background-repeat: no-repeat; }
  .sprite { display: block; width: min(6rem, 100%); aspect-ratio: 1; margin: auto; background-repeat: no-repeat; }
  .sprite.large { width: min(11rem, 100%); }
  .prompt { font-size: clamp(1.1rem, 3vw, 1.65rem); font-weight: 750; }
  .controls, .game .choices, .tiles, .game .actions { justify-content: center; margin-top: .85rem; }
  .choices button { min-width: min(7rem, 100%); text-align: center; }
  .slots { overflow-wrap: anywhere; font-weight: 800; }
  .syllables { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem; }
  .syllables button { display: block; width: 100%; margin-block: .3rem; text-align: center; }
  .vignettes { display: flex; flex-wrap: wrap; justify-content: center; gap: .55rem; margin-bottom: .9rem; }
  .vignettes > div { width: min(8rem, 30%); border: 2px solid #d8c9ae; border-radius: .65rem; padding: .35rem; }
  .vignettes .chosen { border-color: #25453c; background: #e9f0e8; }
  .matches { display: grid; gap: .75rem; }
  .search { display: grid; grid-template-columns: minmax(0, 30rem) minmax(0, 12rem); gap: 1rem; justify-content: center; margin-bottom: .75rem; }
  .grid { display: grid; align-self: start; gap: 1px; }
  .grid button { padding: 0; border-radius: .2rem; aspect-ratio: 1; min-width: 0; text-align: center; font-size: clamp(.68rem, 2.5vw, 1rem); }
  .grid button.blue { background: #b5dcf7; border-color: #267297; }
  button.green, .grid button.green, li.green { background: #bde6c8; color: #174c30; border-color: #387a50; opacity: 1; }
  button.faded { opacity: .35; text-decoration: line-through; }
  .search ul, .collection { list-style: none; padding: 0; margin: 0; }
  .search li, .collection li { padding: .45rem; border-radius: .4rem; }
  .collection { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
  .collection li { background: #efe6d3; align-content: center; min-width: 5rem; }
  .collection .sprite { width: 3.5rem; }
  .worksheet { width: min(48rem, calc(100% - 1.3rem)); margin: 0 auto 1rem; padding: clamp(.8rem, 3vw, 2rem); background: white; border: 1px solid #d8c9ae; border-radius: 1rem; }
  .worksheet h2 { margin: .8rem 0; }
  .worksheet li { margin-bottom: .55rem; line-height: 1.5; }
  @media (max-width: 580px) { .search { grid-template-columns: minmax(0, 1fr); } .search ul { display: flex; flex-wrap: wrap; justify-content: center; } .shell { padding: .65rem; } }
  /* Museum signage, television stage and specimen table share a quiet typography. */
  .museum { background: #eeeae1; color: #213735; font-family: Arial, sans-serif; }
  header { position: relative; overflow: hidden; background: #183d3a; border-bottom: 12px solid #d9a358; }
  header::after { content: ''; position: absolute; right: 7%; top: 22%; width: 23%; height: 140%; border: 1px solid #b5c9b05c; border-radius: 50% 50% 0 0; transform: rotate(18deg); pointer-events: none; }
  header .shell { padding-block: 2rem 3rem; position: relative; z-index: 1; }
  h1 { font-family: Georgia, serif; font-weight: 400; font-size: clamp(3rem, 7vw, 5.7rem); line-height: 1.02; letter-spacing: -.045em; margin-block: 1rem 1.8rem; }
  .settings { background: transparent; border: 0; border-bottom: 1px solid #b5b8ab; border-radius: 0; padding-inline: 0; }
  button { border-radius: 3px; min-height: 44px; transition: background .15s, border-color .15s; }
  nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; border: 1px solid #b5b8ab; margin-block: 1.5rem 2rem; }
  nav button { display: flex; align-items: center; gap: .7rem; text-align: left; border-radius: 0; border: 0; border-bottom: 1px solid #b5b8ab; background: transparent; padding: 1rem; }
  nav small { font-family: Georgia, serif; font-size: 1.3rem; font-weight: 400; opacity: .7; }
  .game { border-radius: 0; border: 0; border-top: 4px solid #bd8b4f; padding: clamp(1rem, 4vw, 3rem); background: #faf8f1; }
  .game h2 { font-family: Georgia, serif; font-size: clamp(1.7rem, 4vw, 2.5rem); font-weight: 400; }
  .coach { background: transparent; border-radius: 0; border-bottom: 1px solid #c5c6b8; }
  .coach p { font-weight: 400; line-height: 1.6; max-width: 36rem; text-align: left; }
  .prompt { max-width: 44rem; margin: 2rem auto; line-height: 1.5; }
  .studio section.game { background: #182e44; color: #fff7e7; border-top-color: #e6b96f; }
  .studio section.game .coach { border-color: #577083; }
  .studio section.game .choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 48rem; margin: 2rem auto; gap: 1rem; }
  .studio section.game .choices button { padding: 1.3rem; border: 2px solid #cfad72; box-shadow: 0 5px 0 #0b1f31; }
  .workshop section.game { background: #e1d5bc; border: 12px solid #9c7650; box-shadow: inset 0 0 0 1px #715c42; }
  .workshop .matches { gap: 2rem; padding-block: 1rem; }
  .workshop .matches .choices button { min-width: 8rem; padding: 1rem; border-radius: 0; box-shadow: 3px 4px 0 #aa96766b; }
  .workshop .matches .choices + .choices { border-top: 1px dashed #887555; padding-top: 1.7rem; }
  .collection li { border-radius: 0; border-bottom: 3px solid #b7905d; background: #ede9dd; padding: 1rem; }
  @media (max-width: 650px) { nav { grid-template-columns: repeat(2, minmax(0, 1fr)); } nav button { padding: .75rem; } .studio section.game .choices { grid-template-columns: 1fr; } header::after { right: -8%; width: 45%; } .workshop section.game { border-width: 5px; } }
  h1, .game h2, nav small { font-family: Arial, sans-serif; letter-spacing: normal; }
  h1 { font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 750; margin: .8rem 0; }
  header .shell { padding-block: 1rem; }
  header::after { display: none; }
  .hall-guide { display: flex; align-items: center; gap: 1.5rem; padding: 1rem 2rem; background: #faf4e7; border-left: 5px solid #b7603c; }
  .hall-guide h2 { margin: 0; font-size: 1.4rem; }
  .hall-guide p { line-height: 1.6; margin-bottom: 0; }
  .hall-guide .noireau { width: 6rem; }
  nav.machine-hall { gap: 1.5rem 1rem; padding: 1.5rem; background: #fbf1e2; border: 8px solid #d2b58f; box-shadow: 0 8px 0 #b59772; }
  .machine-hall button { display: flex; flex-direction: column; padding: 0; border: 0; background: transparent; gap: 0; }
  .machine-art { display: block; width: 100%; aspect-ratio: 3 / 4; background-size: 400% 200%; background-repeat: no-repeat; }
  .machine-label { display: flex; align-items: center; gap: .5rem; width: 100%; min-height: 4.2rem; padding: .6rem; background: #fffaf1; border: 2px solid #9b7954; color: #213735; font-size: 1rem; line-height: 1.4; box-shadow: 0 4px 0 #b59772; }
  .machine-hall button:hover:not(:disabled) .machine-label { background: #e4eee9; border-color: #25453c; }
  .return-hall { margin-bottom: 1.25rem; }
  .machine-heading { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; }
  .machine-heading .machine-art { width: 6rem; flex: 0 0 6rem; border-radius: .4rem; }
  .machine-heading h2 { margin: 0; text-align: left; }
  .museum button, .museum select, .museum input { font-family: Arial, sans-serif; }
  .museum button:focus-visible, .museum h2:focus-visible { outline: 3px solid #d48628; outline-offset: 4px; }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
  .coach p, .prompt { text-align: left; line-height: 1.6; }
  @media (max-width: 650px) { nav.machine-hall { padding: .5rem; gap: 1rem .5rem; border-width: 4px; } .hall-guide { padding: 1rem; gap: .8rem; } .machine-label { font-size: .9rem; } }
  @media print {
    .worksheet { width: auto; margin: 0; padding: 0; color: black; border: 0; border-radius: 0; }
    .worksheet li { break-inside: avoid; line-height: 1.45; }
    .worksheet h2 { font-size: 1.65rem; }
    .museum { background: white; min-height: auto; }
  }
</style>
