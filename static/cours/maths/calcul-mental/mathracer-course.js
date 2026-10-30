(() => {
  const PROGRESS_KEY = 'orbis-mathracer-course-v2';
  const ANSWERS_KEY = 'orbis-mathracer-answers-v1';
  const stages = Array.from(document.querySelectorAll('[data-stage]'));
  const count = document.querySelector('[data-progress-count]');
  const fill = document.querySelector('[data-progress-fill]');
  const track = document.querySelector('[data-progress-track]');
  const mapLinks = Array.from(document.querySelectorAll('[data-stage-link]'));

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
