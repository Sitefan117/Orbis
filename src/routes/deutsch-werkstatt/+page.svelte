<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { getStudentName, submitActivityResult } from '$lib/client/activity';
  import { museumEntries, museumThemes, wortschatz6H, wortschatz6HThemes, type WordListEntry } from '$lib/deutsch-werkstatt/wordlists';

  type Mode = 'hangman' | 'image-word' | 'word-image' | 'quiz' | 'rebuild' | 'hidden' | 'match' | 'syllables' | 'sentences';
  type Stage = 'menu' | 'play' | 'result';
  type Mastery = 'nouveau' | 'a_decouvrir' | 'fragile' | 'consolider' | 'solide';
  type Word = WordListEntry & { plural?: string; sentence: string; hint: string; image: string; parts?: string[] };

  const allWords: Word[] = [...wortschatz6H, ...museumEntries].map((entry) => ({
    ...entry,
    sentence: entry.de,
    hint: entry.source === 'Musée des mots' ? entry.definition ?? 'Vocabulaire thématique.' : `${entry.section} · Wortschatz ${entry.level}`,
    image: 'typography-workbench.png',
    parts: entry.de.replace(/^(der|die|das)\s+/i, '').split(/\s+/)
  }));
  const allThemes = [...wortschatz6HThemes, ...museumThemes];

  const modes: Array<{ id: Mode; number: string; title: string; detail: string; icon: string }> = [
    { id: 'hangman', number: '01', title: 'Le pendu de l’atelier', detail: 'Déduis le mot, lettre après lettre.', icon: '⌁' },
    { id: 'image-word', number: '02', title: 'Image → mot', detail: 'Lis la scène et choisis le mot allemand.', icon: '▧' },
    { id: 'word-image', number: '03', title: 'Mot → image', detail: 'Associe le mot à la bonne situation.', icon: '▤' },
    { id: 'quiz', number: '04', title: 'Contrôle qualité', detail: 'Un quiz rapide sur le vocabulaire.', icon: '✓' },
    { id: 'rebuild', number: '05', title: 'Remonte le mot', detail: 'Replace les lettres dans le bon ordre.', icon: '↗' },
    { id: 'hidden', number: '06', title: 'Mots cachés', detail: 'Repère la bonne pièce dans la grille.', icon: '⌕' },
    { id: 'match', number: '07', title: 'Poste d’association', detail: 'Relie français et allemand.', icon: '⇄' },
    { id: 'syllables', number: '08', title: 'Ligne des syllabes', detail: 'Assemble les modules sonores.', icon: '▦' },
    { id: 'sentences', number: '09', title: 'Atelier de phrases', detail: 'Complète une phrase naturelle.', icon: 'Aa' }
  ];
  const modeImages: Record<Mode, string> = { hangman: 'rail-signal.png', 'image-word': 'factory-hero.png', 'word-image': 'typography-workbench.png', quiz: 'rail-signal.png', rebuild: 'typography-workbench.png', hidden: 'factory-hero.png', match: 'rail-signal.png', syllables: 'typography-workbench.png', sentences: 'factory-hero.png' };
  const masteryLabels: Record<Mastery, string> = { nouveau: 'Nouveau', a_decouvrir: 'À découvrir', fragile: 'Fragile', consolider: 'À consolider', solide: 'Solide' };
  const letters = [...'abcdefghijklmnopqrstuvwxyzäöüß'];

  let stage: Stage = 'menu';
  let activeMode: Mode = 'quiz';
  let selectedThemes = [...wortschatz6HThemes, ...museumThemes];
  let currentIndex = 0;
  let score = 0;
  let errors = 0;
  let attempts = 0;
  let student = 'Explorateur';
  let voiceEnabled = false;
  let answer = '';
  let selected = '';
  let selectedFrench = '';
  let feedback = '';
  let shuffledLetters: string[] = [];
  let progress: Record<string, Mastery> = {};
  let submitted = false;
  let audioAvailable = false;
  let activeAudio: HTMLAudioElement | null = null;

  $: words = allWords.filter((word) => selectedThemes.includes(word.theme));
  $: currentWord = words.length ? words[currentIndex % words.length] : allWords[0];
  $: currentMode = modes.find((mode) => mode.id === activeMode) ?? modes[0];
  $: options = makeOptions(currentWord, activeMode);
  $: progressCount = Object.values(progress).filter((value) => value === 'solide').length;
  $: prompt = promptFor(activeMode, currentWord);

  onMount(() => {
    student = getStudentName('Explorateur');
    audioAvailable = true;
    try { progress = JSON.parse(localStorage.getItem('deutsch-werkstatt-progress') ?? '{}'); } catch { progress = {}; }
  });
  onDestroy(() => { activeAudio?.pause(); });

  function normalize(value: string) { return value.trim().toLocaleLowerCase('de-DE').replace(/ß/g, 'ss'); }
  function pickWord() { return words[Math.floor(Math.random() * words.length)]; }
  function makeOptions(word: Word, mode: Mode) {
    const others = words.filter((item) => item.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
    if (mode === 'word-image') return [word.fr, ...others.map((item) => item.fr)].sort(() => Math.random() - 0.5);
    return [word.de, ...others.map((item) => item.de)].sort(() => Math.random() - 0.5);
  }
  function promptFor(mode: Mode, word: Word) {
    if (mode === 'image-word') return `Quelle étiquette allemande correspond à « ${word.fr} » ?`;
    if (mode === 'word-image') return `Quelle image correspond à « ${word.de} » ?`;
    if (mode === 'sentences') return `Complète la phrase avec le mot allemand pour « ${word.fr} ».`;
    if (mode === 'rebuild' || mode === 'syllables') return `Reconstruis : ${word.fr}`;
    return `Trouve le mot allemand pour « ${word.fr} ».`;
  }
  function sentenceFor(word: Word) {
    if (word.article) return `Ich lerne heute ${word.article} _____.`;
    return 'Heute übe ich: _____. ';
  }
  function start(mode: Mode) {
    activeMode = mode; stage = 'play'; currentIndex = 0; score = 0; errors = 0; attempts = 0; feedback = ''; answer = ''; selected = ''; selectedFrench = '';
    shuffledLetters = activeMode === 'rebuild' ? currentWord.de.replace(/^der |^die |^das /i, '').split('').sort(() => Math.random() - 0.5) : (currentWord.parts ?? []);
    if (voiceEnabled) playWord();
  }
  function audioPathFor(word: Word) {
    const folder = word.source === 'Musée des mots' ? 'museum-thorsten-130' : 'thorsten-130';
    return `${base}/audio/deutsch-werkstatt/${folder}/${word.id}.wav`;
  }
  function playWord(force = true) {
    if (!force && !voiceEnabled) return;
    activeAudio?.pause();
    activeAudio = new Audio(audioPathFor(currentWord));
    activeAudio.play().catch(() => {
      // Secours uniquement si le fichier local ne peut pas être lu.
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentWord.de);
        utterance.lang = 'de-DE';
        utterance.rate = 0.78;
        window.speechSynthesis.speak(utterance);
      }
    });
  }
  function guessValue() {
    if (activeMode === 'hangman' || activeMode === 'quiz' || activeMode === 'image-word' || activeMode === 'word-image' || activeMode === 'hidden') return selected;
    if (activeMode === 'match') return selected;
    if (activeMode === 'rebuild') return `${currentWord.article ? `${currentWord.article} ` : ''}${answer}`.trim();
    if (activeMode === 'syllables') return `${currentWord.article ? `${currentWord.article} ` : ''}${answer}`.trim();
    return answer;
  }
  function isCorrect(value: string) {
    const expected = [currentWord.de, currentWord.article ? `${currentWord.article} ${currentWord.de.replace(`${currentWord.article} `, '')}` : currentWord.de];
    return expected.some((item) => normalize(item) === normalize(value)) || (activeMode === 'sentences' && normalize(value) === normalize(currentWord.de));
  }
  function submitAnswer() {
    const value = guessValue(); if (!value) return; attempts += 1;
    if (isCorrect(value)) { score += attempts === 1 ? 1 : 0; feedback = '✓ Richtig ! Bonne réponse.'; updateMastery(true); playWord(); }
    else { errors += 1; feedback = attempts >= 2 ? 'Pas encore. Écoute le mot et vérifie les lettres.' : 'Pas encore. Essaie encore.'; updateMastery(false); }
  }
  function updateMastery(success: boolean) {
    const old = progress[currentWord.id] ?? 'nouveau';
    const order: Mastery[] = ['nouveau', 'a_decouvrir', 'fragile', 'consolider', 'solide'];
    const at = order.indexOf(old);
    const next = success ? order[Math.min(order.length - 1, at + 1)] : order[Math.max(1, at - 1)];
    progress = { ...progress, [currentWord.id]: next };
    try { localStorage.setItem('deutsch-werkstatt-progress', JSON.stringify(progress)); } catch { /* mode local sans stockage */ }
  }
  function next() {
    if (!feedback) return; if (currentIndex >= 9) { stage = 'result'; sendResult(); return; }
    currentIndex += 1; answer = ''; selected = ''; selectedFrench = ''; feedback = ''; attempts = 0;
    shuffledLetters = activeMode === 'rebuild' ? currentWord.de.replace(/^der |^die |^das /i, '').split('').sort(() => Math.random() - 0.5) : (currentWord.parts ?? []);
    if (voiceEnabled) playWord();
  }
  async function sendResult() {
    if (submitted) return; submitted = true;
    await submitActivityResult({ studentName: student, world: 'deutsch_werkstatt', mission: activeMode, score, total: 10, errorCount: errors, metadata: { mastery: progress[currentWord.id], voiceEnabled } });
  }
  function chooseLetter(letter: string) { answer += letter; shuffledLetters = shuffledLetters.filter((item, index) => index !== shuffledLetters.indexOf(letter)); }
  function chooseFrench(fr: string) { selectedFrench = fr; selected = words.find((item) => item.fr === fr)?.de ?? ''; }
  function toggleTheme(theme: string) {
    selectedThemes = selectedThemes.includes(theme) ? selectedThemes.filter((item) => item !== theme) : [...selectedThemes, theme];
    currentIndex = 0;
    feedback = '';
  }
  function selectAllThemes() { selectedThemes = [...allThemes]; currentIndex = 0; }
  function clearThemes() { selectedThemes = [wortschatz6HThemes[0]]; currentIndex = 0; }
</script>

<svelte:head><title>Deutsch Werkstatt — die Wörterfabrik</title><meta name="description" content="Jeu d’allemand pour apprendre le vocabulaire en jouant." /></svelte:head>

<div class="werkstatt-page">
  <header class="werkstatt-header"><a class="back-link" href={`${base}/`}>← QG Orbis</a><div><span class="eyebrow">ORBiS · ALLEMAND · 12–16 ANS</span><h1>Deutsch Werkstatt</h1><p>die Wörterfabrik · apprendre, assembler, réutiliser</p></div><div class="header-stamp">WERK<br /><strong>09</strong></div></header>
  {#if stage === 'menu'}
    <main class="werkstatt-main">
      <section class="hero-grid"><div class="hero-copy"><span class="eyebrow">ATELIER 01 · LANGUE VIVANTE</span><h2>Construis ton allemand, pièce par pièce.</h2><p>Une fabrique de mots inspirée des ateliers d’ingénierie, du Bauhaus et de la signalétique ferroviaire. Les noms affichent leur article, les verbes gardent leur infinitif et chaque réussite fait évoluer ton niveau de maîtrise.</p><div class="actions"><button class="primary" onclick={() => start('quiz')}>Lancer le contrôle qualité</button><button class="secondary" onclick={() => voiceEnabled = !voiceEnabled} aria-pressed={voiceEnabled}>◖)) Lecture Piper : {voiceEnabled ? 'activée' : 'désactivée'}</button></div><small>{audioAvailable ? 'Voix Piper : Thorsten · vitesse lente 1.30.' : 'Les audios Piper seront disponibles après chargement.'}</small></div><img class="hero-art" src={`${base}/images/deutsch-werkstatt/factory-hero.png`} alt="Fabrique géométrique de mots avec convoyeurs et modules de lettres" /></section>
      <section class="progress-strip"><div><strong>{progressCount}/{words.length}</strong><span>mots solides · liste active</span></div><div><strong>{Object.keys(progress).length}</strong><span>mots rencontrés</span></div><div><strong>6H</strong><span>Wortschatz · allemand</span></div></section>
      <section class="list-panel"><div class="section-heading"><div><span class="eyebrow">LES LISTES DE MOTS</span><h2>Choisis ton parcours</h2></div><p>{words.length} entrées · {selectedThemes.length} thèmes</p></div><p class="list-intro">Le <strong>Wortschatz 6H</strong> est la liste allemande de 6H issue du document de vocabulaire. Coche plusieurs thèmes pour créer ton parcours.</p><div class="list-actions"><button class="secondary" onclick={selectAllThemes}>Tout sélectionner</button><button class="secondary" onclick={clearThemes}>Garder un seul thème</button></div><div class="source-heading"><span class="eyebrow">WORTSCHATZ · 6H</span><strong>Allemand 6H · 201 entrées</strong></div><div class="theme-grid">{#each wortschatz6HThemes as theme}<label class:active={selectedThemes.includes(theme)} class="theme-card"><input type="checkbox" checked={selectedThemes.includes(theme)} onchange={() => toggleTheme(theme)} /><strong>{theme}</strong><small>Wortschatz · niveau 6H</small></label>{/each}</div><div class="source-heading museum-heading"><span class="eyebrow">MUSÉE DES MOTS</span><strong>Liste allemande · 940 entrées</strong></div><div class="theme-grid">{#each museumThemes as theme}<label class:active={selectedThemes.includes(theme)} class="theme-card"><input type="checkbox" checked={selectedThemes.includes(theme)} onchange={() => toggleTheme(theme)} /><strong>{theme}</strong><small>Musée des mots · 12–16 ans</small></label>{/each}</div></section>
      <section><div class="section-heading"><div><span class="eyebrow">LE PLAN DE L’USINE</span><h2>Choisis un poste de travail</h2></div><p>9 jeux · une même progression</p></div><div class="mode-grid">{#each modes as mode}<button class="mode-card" onclick={() => start(mode.id)}><span class="mode-number">{mode.number}</span><span class="mode-icon">{mode.icon}</span><strong>{mode.title}</strong><small>{mode.detail}</small></button>{/each}</div></section>
      <section class="visual-row"><img src={`${base}/images/deutsch-werkstatt/typography-workbench.png`} alt="Établi de typographie avec modules de lettres" /><div><span class="eyebrow">RÈGLE D’ATELIER</span><h2>Chaque mot a une pièce importante.</h2><p><strong>der, die, das</strong> font partie de la réponse. Les mots restent capitalisés en allemand et les caractères ä, ö, ü et ß sont acceptés. En Suisse, l’orthographe <strong>ss</strong> peut être utilisée.</p><button class="secondary" onclick={() => start('sentences')}>Essayer l’atelier de phrases →</button></div><img src={`${base}/images/deutsch-werkstatt/rail-signal.png`} alt="Signal ferroviaire et cartes de mots dans un atelier" /></section>
    </main>
  {:else if stage === 'play'}
    <main class="werkstatt-main play-main"><div class="play-top"><button class="secondary" onclick={() => stage = 'menu'}>← Postes</button><div><span class="eyebrow">POSTE {currentMode.number} · QUESTION {currentIndex + 1}/10</span><h2>{currentMode.title}</h2></div><button class="voice-button" onclick={() => playWord()} disabled={!audioAvailable}>◖)) Écouter le mot</button></div><div class="play-layout"><section class="exercise-card"><div class="exercise-heading"><span class="mode-icon">{currentMode.icon}</span><div><span class="eyebrow">{currentWord.article ? `${currentWord.article} · ${currentWord.plural}` : 'VERBE À L’INFINITIF'}</span><h3>{prompt}</h3><button class="inline-audio" onclick={() => playWord()}>🔊 Écouter</button></div></div>{#if activeMode === 'hangman'}<div class="hangman-word">{currentWord.de.split('').map((letter) => answer.toLocaleLowerCase().includes(letter.toLocaleLowerCase()) ? letter : '＿').join(' ')}</div><div class="letter-grid">{#each letters as letter}<button class="letter" onclick={() => answer += letter} disabled={answer.includes(letter)}>{letter}</button>{/each}</div>{:else if activeMode === 'rebuild'}<div class="answer-line">{answer || '…'}</div><div class="letter-grid">{#each shuffledLetters as letter}<button class="letter" onclick={() => chooseLetter(letter)}>{letter}</button>{/each}</div><button class="secondary" onclick={() => { answer = ''; shuffledLetters = currentWord.de.replace(/^der |^die |^das /i, '').split('').sort(() => Math.random() - 0.5); }}>Réinitialiser</button>{:else if activeMode === 'syllables'}<div class="answer-line">{answer || '…'}</div><div class="syllable-grid">{#each shuffledLetters as part}<button class="syllable" onclick={() => { answer += part; shuffledLetters = shuffledLetters.filter((item) => item !== part); }}>{part}</button>{/each}</div>{:else if activeMode === 'sentences'}<p class="sentence-prompt">{sentenceFor(currentWord)}</p><input class="answer-input" bind:value={answer} placeholder="Écris la réponse allemande" onkeydown={(event) => event.key === 'Enter' && submitAnswer()} />{:else if activeMode === 'match'}<div class="match-grid"><div>{#each words.slice(0, 4) as item}<button class:chosen={selectedFrench === item.fr} onclick={() => chooseFrench(item.fr)}>{item.fr}</button>{/each}</div><div>{#each options as option}<button class:chosen={selected === option} onclick={() => selected = option}>{option}</button>{/each}</div></div>{:else if activeMode === 'word-image'}<img class="exercise-image" src={`${base}/images/deutsch-werkstatt/${currentWord.image}`} alt="Illustration de vocabulaire" /><div class="option-grid">{#each options as option}<button class:chosen={selected === option} onclick={() => selected = option}>{option}</button>{/each}</div>{:else}<div class="visual-prompt"><img src={`${base}/images/deutsch-werkstatt/${modeImages[activeMode]}`} alt="Décor de l’atelier linguistique" /><div><strong>{currentWord.fr}</strong><span>{currentWord.hint}</span></div></div><div class="option-grid">{#each options as option}<button class:chosen={selected === option} onclick={() => selected = option}>{option}</button>{/each}</div>{/if}<div class="exercise-actions"><button class="primary" onclick={submitAnswer} disabled={!!feedback}>Vérifier la pièce</button>{#if feedback}<div class:good={feedback.startsWith('✓')} class="feedback">{feedback}</div><button class="secondary" onclick={next}>Pièce suivante →</button>{/if}</div></section><aside class="workshop-aside"><img src={`${base}/images/deutsch-werkstatt/rail-signal.png`} alt="Signal de l’atelier" /><span class="eyebrow">CONSIGNE</span><p>{currentWord.hint}</p><div class="mastery-box"><strong>{masteryLabels[progress[currentWord.id] ?? 'nouveau']}</strong><span>niveau de maîtrise</span></div><button class="voice-button" onclick={() => voiceEnabled = !voiceEnabled} aria-pressed={voiceEnabled}>◖)) {voiceEnabled ? 'Couper' : 'Activer'} la lecture</button></aside></div></main>
  {:else}
    <main class="werkstatt-main result-page"><span class="eyebrow">RAPPORT DE PRODUCTION</span><h2>Série terminée.</h2><p class="result-score">{score}<small>/ 10 pièces réussies</small></p><p>Les mots rencontrés continuent leur parcours dans ton atelier personnel.</p><div class="actions"><button class="primary" onclick={() => start(activeMode)}>Rejouer le poste</button><button class="secondary" onclick={() => stage = 'menu'}>Voir les neuf postes</button></div></main>
  {/if}
</div>

<style>
  :global(body) { background: #eee9df; }
  .werkstatt-page { min-height: 100vh; color: #202226; background: #eee9df; font-family: 'Arial Narrow', 'Avenir Next', system-ui, sans-serif; }
  .werkstatt-header { background: #25272b; color: #f6f0e5; min-height: 8.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.2rem max(1.2rem, calc((100vw - 74rem) / 2)); border-bottom: 0.5rem solid #d94b36; }
  .werkstatt-header h1 { margin: .25rem 0 0; font-size: clamp(2rem, 5vw, 4rem); letter-spacing: -.04em; line-height: .95; }
  .werkstatt-header p { margin: .4rem 0 0; color: #a9c9d6; letter-spacing: .08em; }
  .back-link { color: #f6f0e5; text-decoration: none; font-weight: 800; align-self: flex-start; }
  .header-stamp { border: 2px solid #4e9ab0; padding: .5rem .7rem; text-align: center; font-size: .7rem; letter-spacing: .12em; } .header-stamp strong { font-size: 1.8rem; color: #e85b41; }
  .eyebrow { font-size: .72rem; letter-spacing: .14em; font-weight: 900; color: #3e7180; } .werkstatt-header .eyebrow { color: #e8b65c; }
  .werkstatt-main { width: min(74rem, 100%); margin: auto; padding: 2rem 1rem 4rem; display: grid; gap: 2rem; }
  .hero-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 1.5rem; align-items: stretch; background: #f7f1e7; border: 2px solid #25272b; padding: 1rem; }
  .hero-copy { padding: clamp(1rem, 3vw, 3rem); display: grid; align-content: center; gap: 1rem; } h2 { font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1; margin: 0; letter-spacing: -.04em; } h3 { font-size: clamp(1.3rem, 3vw, 2rem); margin: .2rem 0 0; } p { line-height: 1.55; } .hero-art { width: 100%; height: 100%; min-height: 20rem; object-fit: cover; filter: saturate(.88) contrast(1.05); }
  .actions { display: flex; gap: .7rem; flex-wrap: wrap; align-items: center; } button { border: 0; cursor: pointer; font: inherit; } .primary, .secondary, .voice-button { padding: .85rem 1rem; font-weight: 900; border: 2px solid #25272b; } .primary { background: #d94b36; color: #fff9ef; } .secondary { background: #a9c9d6; color: #202226; } .voice-button { background: #f6f0e5; color: #25272b; padding: .6rem .8rem; }
  .progress-strip { display: grid; grid-template-columns: repeat(3, 1fr); border-block: 2px solid #25272b; } .progress-strip div { display: grid; gap: .1rem; padding: 1rem; border-right: 2px solid #25272b; } .progress-strip div:last-child { border-right: 0; } .progress-strip strong { font-size: 1.8rem; } .progress-strip span { color: #53606a; font-size: .82rem; }
  .list-panel { background: #f7f1e7; border: 2px solid #25272b; padding: clamp(1rem, 3vw, 2rem); } .list-intro { max-width: 60rem; color: #53606a; } .list-actions { display:flex; flex-wrap:wrap; gap:.6rem; margin:1rem 0; } .source-heading { display:flex; justify-content:space-between; gap:1rem; align-items:baseline; margin-top:1.5rem; border-top:2px solid #25272b; padding-top:1rem; } .source-heading strong { color:#25272b; } .theme-grid { display: grid; grid-template-columns: repeat(3, minmax(13rem, 1fr)); gap: .7rem; margin-top: 1rem; } .theme-card { min-height: 5.5rem; text-align: left; padding: .9rem; background: #e3ded3; border: 2px solid #25272b; display: grid; align-content: center; gap: .3rem; cursor:pointer; } .theme-card input { width:1.1rem; height:1.1rem; accent-color:#2f7d58; margin:0 0 .2rem; } .theme-card.active { background: #e9b65d; box-shadow: inset 0 -4px #d94b36; } .theme-card small { color: #53606a; }
  .section-heading { display:flex; justify-content: space-between; gap: 1rem; align-items: end; } .section-heading p { margin: 0; color:#53606a; }
  .mode-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .8rem; margin-top: 1rem; } .mode-card { min-height: 10rem; text-align: left; padding: 1rem; background: #f7f1e7; border: 2px solid #25272b; display: grid; align-content: start; gap: .5rem; transition: transform .15s, background .15s; } .mode-card:hover, .mode-card:focus-visible { transform: translateY(-3px); background: #e9d9b6; } .mode-number { color:#d94b36; font-weight: 900; } .mode-icon { font-size: 2rem; color:#3e7180; font-weight:900; } .mode-card strong { font-size: 1.1rem; } .mode-card small { color: #53606a; line-height: 1.4; }
  .visual-row { display: grid; grid-template-columns: 10rem 1fr 10rem; gap: 1rem; align-items: center; background: #25272b; color:#f7f1e7; padding: 1rem; } .visual-row img { width:100%; aspect-ratio:1; object-fit:cover; } .visual-row h2 { margin-top:.4rem; } .visual-row p { color:#d9d4cb; } .visual-row .secondary { margin-top:.5rem; }
  .play-main { min-height: calc(100vh - 8.5rem); } .play-top { display:flex; align-items:center; justify-content:space-between; gap:1rem; } .play-layout { display:grid; grid-template-columns:minmax(0, 1fr) 17rem; gap:1rem; align-items:start; } .exercise-card, .workshop-aside { background:#f7f1e7; border:2px solid #25272b; padding:clamp(1rem, 3vw, 2rem); } .exercise-heading { display:flex; gap:1rem; align-items:start; margin-bottom:1.5rem; } .exercise-heading .mode-icon { flex:0 0 auto; } .inline-audio { display:inline-flex; margin-top:.7rem; padding:.45rem .7rem; background:#e9b65d; border:2px solid #25272b; font-weight:900; } .hangman-word, .answer-line { min-height:4rem; display:grid; place-items:center; font-size:clamp(1.8rem, 6vw, 3.5rem); letter-spacing:.15em; background:#25272b; color:#f7f1e7; padding:1rem; margin-bottom:1rem; } .letter-grid, .option-grid, .syllable-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(3.3rem,1fr)); gap:.6rem; } .letter, .option-grid button, .syllable, .match-grid button { background:#e3ded3; border:2px solid #25272b; padding:.8rem; min-height:3rem; font-weight:800; } .letter:hover, .option-grid button.chosen, .match-grid button.chosen, .syllable:hover { background:#e9b65d; } .exercise-actions { display:flex; flex-wrap:wrap; gap:.7rem; align-items:center; margin-top:1.5rem; } .feedback { flex:1 1 100%; padding:.8rem; background:#d8eadc; border-left:5px solid #2f7d58; font-weight:900; } .feedback:not(.good) { background:#f4d8d0; border-color:#d94b36; } .visual-prompt { display:flex; gap:1rem; align-items:center; background:#25272b; color:#f7f1e7; padding:1rem; margin-bottom:1rem; } .visual-prompt img, .exercise-image { width:7rem; height:7rem; object-fit:cover; } .visual-prompt div { display:grid; gap:.4rem; } .visual-prompt span { color:#c8d9df; } .answer-input { width:100%; border:2px solid #25272b; background:#fffaf0; padding:1rem; font-size:1.2rem; } .sentence-prompt { font-size:1.6rem; background:#25272b; color:#f7f1e7; padding:1.2rem; } .match-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; } .match-grid > div { display:grid; gap:.6rem; } .workshop-aside { display:grid; gap:1rem; } .workshop-aside img { width:100%; aspect-ratio:1; object-fit:cover; } .mastery-box { border-top:2px solid #25272b; padding-top:1rem; display:grid; gap:.2rem; } .mastery-box strong { color:#d94b36; } .mastery-box span { color:#53606a; font-size:.8rem; } .result-page { align-content:center; justify-items:start; min-height:60vh; } .result-score { font-size:clamp(4rem,12vw,8rem); font-weight:900; color:#d94b36; line-height:.9; margin:.5rem 0; } .result-score small { display:block; color:#25272b; font-size:1rem; letter-spacing:.04em; }
  @media (max-width: 900px) { .theme-grid { grid-template-columns: repeat(2, minmax(13rem, 1fr)); } }
  @media (max-width: 760px) { .werkstatt-header { align-items:flex-start; } .werkstatt-header .back-link { font-size:.8rem; } .hero-grid, .play-layout, .visual-row { grid-template-columns:1fr; } .theme-grid { grid-template-columns:1fr; } .visual-row img { max-height:12rem; } .visual-row img:last-child { display:none; } .play-top { align-items:flex-start; flex-wrap:wrap; } .progress-strip strong { font-size:1.3rem; } }
  @media (prefers-reduced-motion: reduce) { .mode-card { transition:none; } }
</style>
