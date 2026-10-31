(() => {
  const PROGRESS_KEY = 'orbis-mathracer-course-v2';
  const ANSWERS_KEY = 'orbis-mathracer-answers-v1';
  const stages = Array.from(document.querySelectorAll('[data-stage]'));
  const count = document.querySelector('[data-progress-count]');
  const fill = document.querySelector('[data-progress-fill]');
  const track = document.querySelector('[data-progress-track]');
  const mapLinks = Array.from(document.querySelectorAll('[data-stage-link]'));

  const dotRow = (count, tone = '') => `<span class="dot-row ${tone}">${Array.from({ length: count }, () => '<i></i>').join('')}</span>`;
  const rows = (rowCount, perRow, splitAt = 0) => `<div class="array-model">${Array.from({ length: rowCount }, (_, index) => dotRow(perRow, splitAt && index >= splitAt ? 'accent' : '')).join('')}</div>`;
  const numberLine = (points) => `<div class="number-line">${points.map((point, index) => `<span class="number-stop"><b>${point.value}</b>${index < points.length - 1 ? `<i style="--jump:${Math.max(1, points[index + 1].value - point.value)}">+${points[index + 1].value - point.value}</i>` : ''}</span>`).join('')}</div>`;
  const visualModels = {
    1: { title: 'Je complète la boîte de 10', body: `<div class="ten-frame" aria-label="Une boîte de dix avec sept cases remplies et trois cases à compléter">${Array.from({ length: 10 }, (_, i) => `<i class="${i < 7 ? 'filled' : 'missing'}">${i === 7 ? '?' : ''}</i>`).join('')}</div>`, caption: 'Je vois 7 jetons. Trois places sont vides : 7 + 3 = 10.' },
    2: { title: 'Je passe par 10', body: numberLine([{ value: 8 }, { value: 10 }, { value: 15 }]), caption: 'Je coupe 7 en 2 et 5 : 8 + 2 = 10, puis 10 + 5 = 15.' },
    3: { title: 'Deux bonds jusqu’à 50', body: numberLine([{ value: 37 }, { value: 40 }, { value: 50 }]), caption: 'De 37 à 40 : +3. De 40 à 50 : +10. En tout, il manque 13.' },
    4: { title: 'Deux bonds jusqu’à 100', body: numberLine([{ value: 68 }, { value: 70 }, { value: 100 }]), caption: 'Je rejoins d’abord la dizaine suivante, puis 100 : 2 + 30 = 32.' },
    5: { title: 'Je démonte le nombre', body: '<div class="part-whole"><b>42</b><span>+</span><b>30</b><span>+</span><b>5</b><span>=</span><strong>77</strong></div>', caption: '35, c’est 30 et 5. J’ajoute chaque morceau séparément.' },
    6: { title: 'Double et moitié : le même dessin', body: `<div class="split-model"><div>${dotRow(7)}</div><div>${dotRow(7, 'accent')}</div></div>`, caption: 'Deux groupes de 7 font 14. Si je partage 14 en deux groupes égaux, chaque groupe contient 7.' },
    7: { title: 'Les groupes repères', body: '<div class="reference-groups"><span><b>×2</b> deux groupes</span><span><b>×5</b> moitié de ×10</span><span><b>×10</b> dix groupes</span></div>', caption: 'Je rattache chaque calcul à une quantité que je sais représenter.' },
    8: { title: 'Ma boîte à stratégies', body: '<div class="strategy-cards"><span><b>×4</b> ×2 puis doubler</span><span><b>×6</b> ×5 + 1 groupe</span><span><b>×9</b> ×10 − 1 groupe</span></div>', caption: 'Je pars toujours d’un fait connu au lieu de deviner.' },
    9: { title: 'Je double les rangées', body: `<div class="doubling-model"><span>2 × 7 = 14</span>${rows(2, 7)}<b>↓ je double</b><span>4 × 7 = 28</span>${rows(4, 7)}</div>`, caption: 'Pour passer de ×2 à ×4, je double le nombre de rangées. Pour ×8, je double encore.' },
    10: { title: 'Deux rangées plus une', body: `${rows(3, 7, 2)}<div class="model-equation">2 × 7 + 1 × 7 = 21</div>`, caption: 'Les deux premières rangées font 14 ; la rangée orange ajoute encore 7.' },
    11: { title: 'Cinq groupes plus un groupe', body: `${rows(6, 4, 5)}<div class="model-equation">5 × 4 + 1 × 4 = 24</div>`, caption: 'Je connais ×5. J’ajoute exactement une rangée identique pour obtenir ×6.' },
    12: { title: 'Dix groupes moins un', body: `<div class="crossed-array">${rows(10, 5, 9)}<span>− une rangée</span></div><div class="model-equation">10 × 5 − 5 = 45</div>`, caption: 'Je construis 10 rangées, puis j’en retire une : il en reste 9.' },
    13: { title: 'Cinq groupes plus deux', body: `${rows(7, 6, 5)}<div class="model-equation">5 × 6 + 2 × 6 = 42</div>`, caption: 'Les cinq rangées bleues font 30 et les deux rangées orange font 12.' },
    14: { title: 'Combien de groupes de 4 ?', body: `<div class="grouped-dots">${Array.from({ length: 5 }, () => `<span>${dotRow(4)}</span>`).join('')}</div><div class="model-equation">? × 4 = 20 → 5 groupes</div>`, caption: 'Je groupe les 20 jetons par 4, puis je compte les groupes : il y en a 5.' },
    15: { title: 'Une seule famille de nombres', body: '<div class="fact-family"><strong>20</strong><span>4 × 5</span><span>5 × 4</span><span>20 ÷ 4</span><span>20 ÷ 5</span></div>', caption: 'Les trois nombres 4, 5 et 20 permettent d’écrire deux multiplications et deux divisions.' },
    16: { title: 'Le sens des quatre opérations', body: '<div class="operation-meanings"><span><b>+</b> réunir</span><span><b>−</b> retirer ou comparer</span><span><b>×</b> répéter des groupes</span><span><b>÷</b> partager</span></div>', caption: 'Je cherche d’abord ce qui arrive aux quantités, puis je choisis le signe.' },
    17: { title: 'J’aligne les mêmes rangs', body: '<table class="place-value"><thead><tr><th>C</th><th>D</th><th>U</th></tr></thead><tbody><tr><td>3</td><td>4</td><td>7</td></tr><tr><td>2</td><td>8</td><td>6</td></tr><tr class="result"><td>6</td><td>3</td><td>3</td></tr></tbody></table><div class="model-equation">347 + 286 = 633</div>', caption: 'Les unités restent sous les unités, les dizaines sous les dizaines et les centaines sous les centaines.' },
    18: { title: 'La méthode LIRE en images', body: '<div class="lire-flow"><span><b>L</b> 🔎 Question</span><i>→</i><span><b>I</b> 🧩 Données</span><i>→</i><span><b>R</b> ✏️ Dessin</span><i>→</i><span><b>E</b> ✅ Réponse</span></div>', caption: 'Je ne calcule pas tout de suite : je comprends, je représente, puis seulement je calcule.' }
  };

  stages.forEach((stage) => {
    const model = visualModels[stage.dataset.stage];
    const theory = stage.querySelector('.learning-box.theory');
    if (!model || !theory || theory.querySelector('.concept-visual')) return;
    const visual = document.createElement('figure');
    visual.className = 'concept-visual';
    visual.innerHTML = `<h4>${model.title}</h4><div class="visual-canvas">${model.body}</div><figcaption><b>Ce que je vois :</b> ${model.caption}</figcaption>`;
    theory.appendChild(visual);
  });

  function readStored(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  let completed = new Set(readStored(PROGRESS_KEY, []).map(String));
  let savedAnswers = readStored(ANSWERS_KEY, {});

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fonctionne sans stockage persistant */ }
  }

  function renderProgress() {
    const total = stages.length;
    const done = stages.filter((stage) => completed.has(stage.dataset.stage)).length;
    if (count) count.textContent = `${done} étape${done > 1 ? 's' : ''} sur ${total}`;
    if (fill) fill.style.width = `${total ? (done / total) * 100 : 0}%`;
    if (track) track.setAttribute('aria-valuenow', String(done));
    mapLinks.forEach((link) => link.classList.toggle('is-complete', completed.has(link.dataset.stageLink)));
  }

  function normalize(value) {
    return String(value).trim().replace(',', '.').replace(/\s+/g, '').toLowerCase();
  }

  const answerInputs = Array.from(document.querySelectorAll('[data-answer]'));
  answerInputs.forEach((input) => {
    if (input.name && savedAnswers[input.name] !== undefined) input.value = savedAnswers[input.name];
    input.addEventListener('input', () => {
      input.classList.remove('is-correct', 'is-incorrect');
      if (input.name) {
        savedAnswers[input.name] = input.value;
        save(ANSWERS_KEY, savedAnswers);
      }
    });
  });

  document.querySelectorAll('[data-check-quiz]').forEach((button) => {
    button.addEventListener('click', () => {
      const quiz = button.closest('[data-quiz]');
      if (!quiz) return;
      const inputs = Array.from(quiz.querySelectorAll('[data-answer]'));
      let score = 0;
      inputs.forEach((input) => {
        const accepted = String(input.dataset.answer).split('|').map(normalize);
        const correct = accepted.includes(normalize(input.value));
        input.classList.toggle('is-correct', correct);
        input.classList.toggle('is-incorrect', !correct);
        if (correct) score += 1;
      });

      const pass = Number(quiz.dataset.pass || inputs.length);
      const passed = score >= pass;
      const feedback = quiz.querySelector('[data-quiz-feedback]');
      if (feedback) {
        feedback.textContent = passed
          ? `Bravo : ${score}/${inputs.length}. Validation réussie.`
          : `${score}/${inputs.length}. Corrige les cases rouges, puis réessaie.`;
        feedback.classList.toggle('good', passed);
        feedback.classList.toggle('bad', !passed);
      }

      const stage = quiz.closest('[data-stage]');
      if (stage && passed && quiz.classList.contains('evaluation')) {
        completed.add(stage.dataset.stage);
        save(PROGRESS_KEY, [...completed]);
        renderProgress();
      }
    });
  });

  document.querySelectorAll('[data-print]').forEach((button) => button.addEventListener('click', () => window.print()));
  renderProgress();
})();
