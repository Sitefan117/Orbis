(() => {
  const style = document.createElement('style');
  style.textContent = `
    .large-answer, .answer-input, .answer { min-width: 9rem !important; min-height: 3rem !important; font: inherit; font-size: 1rem; padding: .45rem .55rem; }
    .inline-box { width: 2.4rem; height: 2.4rem; min-width: 2.4rem; vertical-align: middle; border: 1.5px solid #667085; border-radius: .25rem; background: #fff; font: inherit; font-size: 1rem; }
    .response-line { min-height: 2.2rem; margin-top: .65rem; border-bottom: 1.5px solid #667085; }
    .task { min-height: 3.6rem; }
    .balance { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .65rem; align-items: center; white-space: normal !important; font-size: 1rem !important; line-height: 1.25; }
    .balance span { display: block; padding: .35rem .45rem; background: #fff; border: 1px solid #9ecbd0; border-radius: .35rem; }
    @media (max-width: 650px) { .balance { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media print { .large-answer, .answer-input, .answer { min-height: 2.5rem !important; } .response-line { min-height: 1.8rem; } }
  `;
  document.head.appendChild(style);

  const balance = document.querySelector('.balance');
  if (balance) {
    balance.innerHTML = '<span><strong>=</strong><br>même valeur</span><span><strong>≠</strong><br>valeurs différentes</span><span><strong>&lt;</strong><br>plus petit que</span><span><strong>&gt;</strong><br>plus grand que</span>';
  }

  const replaceText = (node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
    const parent = node.parentElement;
    if (parent && ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
    node.nodeValue = node.nodeValue
      .replaceAll('×', '·')
      .replace(/(\d)\s*x(?![a-zA-Z])/g, '$1·x')
      .replace(/(\d)\s*\(/g, '$1·(');
  };

  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
  textNodes.forEach(replaceText);

  document.querySelectorAll('.task').forEach((task, index) => {
    if (task.closest('.solution')) return;
    task.querySelectorAll('input[data-answer], input.answer-input, input.answer').forEach((input) => {
      input.classList.add('large-answer');
    });
    if (!task.querySelector('input, textarea, .write, .work, .blank, .inline-box') && !task.querySelector('.response-line')) {
      const line = document.createElement('div');
      line.className = 'response-line';
      line.setAttribute('aria-label', `Ligne de réponse ${index + 1}`);
      task.appendChild(line);
    }
  });

  document.querySelectorAll('.task').forEach((task) => {
    if (task.closest('.solution')) return;
    const walker = document.createTreeWalker(task, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.nodeValue.includes('□')) return;
      const fragment = document.createDocumentFragment();
      node.nodeValue.split('□').forEach((part, index, parts) => {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (index < parts.length - 1) {
          const input = document.createElement('input');
          input.className = 'inline-box';
          input.type = 'text';
          input.inputMode = 'numeric';
          input.setAttribute('aria-label', 'Case de réponse');
          fragment.appendChild(input);
        }
      });
      node.parentNode.replaceChild(fragment, node);
    });
  });
})();
