<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  type Word = { word: string; icon: string; definition: string; room: string };
  type Prototype = 'pendu' | 'whack-image' | 'whack-word';

  const words: Word[] = [
    { word: 'cahier', icon: '📓', definition: 'Un support où l’on écrit ou dessine.', room: 'La salle des fournitures' },
    { word: 'cartable', icon: '🎒', definition: 'Un sac utilisé pour transporter ses affaires d’école.', room: 'La salle des fournitures' },
    { word: 'tableau', icon: '🧑‍🏫', definition: 'Une surface sur laquelle l’enseignant écrit.', room: 'La salle de la classe' },
    { word: 'récréation', icon: '⚽', definition: 'Un moment où les élèves peuvent jouer et se détendre.', room: 'La cour de récréation' },
    { word: 'bibliothèque', icon: '📚', definition: 'Un lieu où l’on trouve et lit des livres.', room: 'La salle de lecture' },
    { word: 'trousse', icon: '🖊️', definition: 'Un petit étui qui contient du matériel pour écrire.', room: 'La salle des fournitures' }
  ];

  let prototype: Prototype = 'whack-image';
  let index = 0;
  let score = 0;
  let attempts = 0;
  let message = 'Choisis la bonne réponse.';
  let unlocked = 2;
  let damaged = 5;
  let selected: string | null = null;

  $: current = words[index % words.length];
  $: options = prototype === 'whack-word'
    ? [current, words[(index + 1) % words.length], words[(index + 3) % words.length]]
    : [current, words[(index + 2) % words.length], words[(index + 4) % words.length]];

  function choose(answer: Word) {
    if (selected) return;
    selected = answer.word;
    attempts += 1;
    if (answer.word === current.word) {
      score += 1; damaged = Math.max(0, damaged - 1); unlocked = Math.min(6, unlocked + 1);
      message = `Bravo ! « ${current.word} » rejoint la collection.`;
    } else {
      message = `Pas encore. Observe bien l’image et la définition de « ${current.word} ».`;
    }
  }

  function next() {
    index += 1; selected = null; message = 'Choisis la bonne réponse.';
  }

  function selectPrototype(nextPrototype: Prototype) {
    prototype = nextPrototype; index = 0; score = 0; attempts = 0; selected = null; message = 'Choisis la bonne réponse.';
  }

  onMount(() => {
    const requested = new URLSearchParams(window.location.search).get('mode') as Prototype;
    if (['pendu', 'whack-image', 'whack-word'].includes(requested)) selectPrototype(requested);
  });

  function hangmanProgress() { return Math.min(6, Math.max(0, Math.round((attempts - score) / 2))); }
</script>

<svelte:head><title>Le musée des mots — prototypes</title></svelte:head>

<div class="page museum-page">
  <header class="museum-header">
    <div>
      <p class="eyebrow">Prototype vocabulaire · école</p>
      <h1>Le musée des mots</h1>
      <p>Trois petites mécaniques pour apprendre les mots de l’école.</p>
    </div>
    <div class="collection"><span>🏛️</span><strong>{unlocked}/6</strong><small>objets restaurés</small></div>
  </header>

  <main class="museum-main">
    <nav class="tabs" aria-label="Choisir un prototype">
      <button class:active={prototype === 'pendu'} on:click={() => selectPrototype('pendu')}>🪢 Pendu restaurateur</button>
      <button class:active={prototype === 'whack-image'} on:click={() => selectPrototype('whack-image')}>🔨 Image → mot</button>
      <button class:active={prototype === 'whack-word'} on:click={() => selectPrototype('whack-word')}>🖼️ Mot → image</button>
      <a href={`${base}/musee_vocabulaire/atelier?mode=millionaire`}>💰 Qui veut gagner des mots ?</a>
      <a href={`${base}/musee_vocabulaire/atelier?mode=letters`}>🧩 Reconstruire le mot</a>
      <a href={`${base}/musee_vocabulaire/atelier?mode=search`}>🔎 Mots cachés</a>
      <a href={`${base}/musee_vocabulaire/atelier?mode=match`}>🖱️ Glisser vers l’image</a>
      <a href={`${base}/musee_vocabulaire/atelier?mode=syllables`}>🚶 Récolte des syllabes</a>
    </nav>

    <section class="intro card">
      <div><span class="tag">{prototype === 'pendu' ? 'Prototype 1' : prototype === 'whack-image' ? 'Prototype 2' : 'Prototype 3'}</span>
        <h2>{prototype === 'pendu' ? 'Restaure l’objet sans le laisser tomber' : prototype === 'whack-image' ? 'Frappe le bon mot' : 'Frappe la bonne image'}</h2>
        <p>{prototype === 'pendu' ? 'Chaque erreur abîme un objet du musée. Une bonne réponse le restaure.' : 'Trois propositions apparaissent. Certaines sont proches, d’autres complètement différentes.'}</p>
      </div>
      <div class="score"><span>Score</span><strong>{score}</strong><small>{attempts} réponse{attempts > 1 ? 's' : ''}</small></div>
    </section>

    <section class="game-layout">
      <article class="game card">
        {#if prototype === 'pendu'}
          <div class="hangman" aria-label={`Objet abîmé : étape ${hangmanProgress()} sur 6`}><div class="rope">🪢</div><div class="artifact">{current.icon}</div><div class="damage">{'🪵'.repeat(hangmanProgress()) || '✨'}</div></div>
          <p class="prompt">Quel mot correspond à cette définition ?</p><div class="definition">{current.definition}</div>
        {:else if prototype === 'whack-image'}
          <p class="prompt">Quel mot désigne cette image ?</p><div class="big-icon">{current.icon}</div><p class="room">Salle : {current.room}</p>
        {:else}
          <p class="prompt">Quelle image correspond à ce mot ?</p><div class="word-card">{current.word}</div><p class="room">Indice : {current.definition}</p>
        {/if}

        <div class="options" class:images={prototype === 'whack-word'}>
          {#each options as option}
            <button class:selected={selected === option.word} class:correct={selected && option.word === current.word} class:wrong={selected === option.word && option.word !== current.word} on:click={() => choose(option)}>
              {#if prototype === 'whack-word'}<span class="option-icon">{option.icon}</span>{/if}
              <span>{option.word}</span>
            </button>
          {/each}
        </div>
        <p class:good={selected === current.word} class:bad={selected && selected !== current.word} class="feedback">{message}</p>
        <button class="next" disabled={!selected} on:click={next}>Question suivante →</button>
      </article>

      <aside class="museum-card card">
        <div class="display">🏛️</div><h3>Collection en cours</h3><p>Les objets sont débloqués quand le mot est reconnu. Plus tard, on pourra demander une phrase pour le faire passer de « restauré » à « exposé ».</p>
        <div class="shelves">{#each words as word, i}<div class:locked={i >= unlocked} title={word.word}>{i < unlocked ? word.icon : '🔒'}</div>{/each}</div>
        <hr /><p class="small"><strong>À tester :</strong> faut-il afficher la définition tout de suite, ou seulement après une erreur ?</p>
      </aside>
    </section>
  </main>
</div>

<style>
  :global(body) { background: #f5efe4; color: #352b25; }
  .museum-page { min-height: 100vh; background: radial-gradient(circle at 15% 0%, #fffaf0 0 22rem, transparent 40rem), #f5efe4; }
  .museum-header { background: #31544f; color: #fffaf0; padding: 2rem max(1.25rem, calc((100% - 72rem) / 2)); display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
  .eyebrow, .tag { text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; font-weight: 900; color: #d9c8a5; margin: 0 0 .5rem; }
  h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.6rem); } h2 { margin: .7rem 0 .35rem; } h3 { margin-bottom: .35rem; }
  .museum-header p:not(.eyebrow) { margin: .5rem 0 0; color: #d5e4dc; }
  .collection { display: grid; grid-template-columns: auto auto; gap: .1rem .5rem; align-items: center; background: #25423e; padding: .8rem 1rem; border-radius: 1rem; min-width: 9rem; }.collection span { grid-row: span 2; font-size: 2rem; }.collection small { color: #c5d7ce; }
  .museum-main { width: min(72rem, 100%); margin: auto; padding: 1.25rem; }.tabs { display: flex; gap: .6rem; flex-wrap: wrap; margin-bottom: 1rem; }.tabs button, .tabs a { border: 2px solid #d9c8a5; color: #352b25; background: #fffaf0; padding: .75rem 1rem; border-radius: 999px; font-weight: 900; text-decoration: none; }.tabs button.active { background: #c79845; border-color: #c79845; color: white; }
  .card { background: rgba(255,250,240,.9); border: 1px solid #dfd1b7; border-radius: 1.25rem; box-shadow: 0 12px 30px #5d442015; padding: 1.25rem; }.intro { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }.intro p, .museum-card p { color: #705f51; line-height: 1.5; margin-bottom: 0; }.score { text-align: center; background: #e9ddc6; padding: .7rem 1rem; border-radius: 1rem; min-width: 6rem; }.score span, .score small { display: block; font-size: .75rem; color: #766450; }.score strong { font-size: 2rem; display: block; color: #31544f; }
  .game-layout { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(16rem, .8fr); gap: 1rem; margin-top: 1rem; }.game { text-align: center; }.prompt { font-weight: 900; font-size: 1.15rem; }.big-icon, .hangman { min-height: 10rem; display: grid; place-items: center; font-size: 6rem; background: #f1e5cf; border-radius: 1rem; }.hangman { position: relative; }.rope { position: absolute; top: .4rem; left: 1rem; font-size: 2rem; }.damage { position: absolute; bottom: .5rem; font-size: 1.3rem; }.definition, .word-card { padding: 1rem; border: 2px dashed #c79845; border-radius: .8rem; background: #fffdf8; font-size: 1.2rem; font-weight: 800; }.word-card { font-size: 2.2rem; color: #31544f; }.room { color: #88735f; font-size: .85rem; }.options { display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; margin-top: 1.25rem; }.options button { min-height: 4rem; border: 2px solid #d9c8a5; background: #fffdf8; border-radius: .9rem; font-weight: 900; font-size: 1rem; }.options button:hover { border-color: #31544f; transform: translateY(-2px); }.options button.correct { background: #cce9d6; border-color: #3c8c59; }.options button.wrong { background: #f4caca; border-color: #b64d4d; }.option-icon { display: block; font-size: 2.4rem; margin-bottom: .3rem; }.feedback { min-height: 1.5rem; font-weight: 900; }.feedback.good { color: #287544; }.feedback.bad { color: #a33b3b; }.next { border: 0; border-radius: .8rem; background: #31544f; color: white; padding: .8rem 1.2rem; font-weight: 900; }.museum-card { align-self: start; }.display { background: #31544f; color: white; font-size: 4rem; text-align: center; padding: 1rem; border-radius: .8rem; }.shelves { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; margin-top: 1rem; }.shelves div { background: #eadfc9; border-radius: .6rem; padding: .7rem; text-align: center; font-size: 1.7rem; }.shelves .locked { opacity: .45; } hr { border: 0; border-top: 1px solid #dfd1b7; margin: 1rem 0; }.small { font-size: .85rem; }
  @media (max-width: 700px) { .museum-header, .intro { align-items: flex-start; flex-direction: column; }.game-layout { grid-template-columns: 1fr; }.options { grid-template-columns: 1fr; }.options button { min-height: 3.5rem; }.collection { align-self: stretch; } }
</style>
