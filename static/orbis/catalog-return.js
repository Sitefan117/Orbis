/* Restore the course catalogue when returning from a standalone HTML document. */
(() => {
  const script = document.currentScript;
  if (!script?.src) return;

  // Tous les cours HTML partagent ce correctif d'impression. Une page sans
  // marge navigateur ne réserve plus d'espace aux en-têtes automatiques
  // (date, titre, URL). Le padding cloné redonne une marge propre au contenu
  // sur chaque feuille imprimée.
  const printStyle = document.createElement('style');
  printStyle.dataset.orbisPrintClean = 'true';
  printStyle.textContent = `
    @page { size: auto; margin: 0 !important; }
    @media print {
      html { margin: 0 !important; padding: 0 !important; }
      body {
        margin: 0 !important;
        padding: 10mm !important;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
      }
    }
  `;
  document.head.append(printStyle);

  const root = new URL('../', script.src);
  const fallback = new URL('?vue=cours', root);
  let destination = fallback;
  try {
    const saved = JSON.parse(sessionStorage.getItem('orbis-catalog-cours') || 'null');
    if (typeof saved?.href === 'string') {
      const candidate = new URL(saved.href, location.origin);
      if (candidate.origin === root.origin && candidate.pathname === root.pathname && candidate.searchParams.get('vue') === 'cours') destination = candidate;
    }
  } catch { /* The explicit fallback also works without browser storage. */ }
  const student = new URLSearchParams(location.search).get('eleve');
  if (student) destination.searchParams.set('eleve', student);
  document.querySelectorAll('a[data-orbis-catalog-return]').forEach((link) => {
    link.href = `${destination.pathname}${destination.search}`;
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      event.preventDefault();
      location.replace(link.href);
    });
  });
})();
