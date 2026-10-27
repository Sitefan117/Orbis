/* Restore the course catalogue when returning from a standalone HTML document. */
(() => {
  const script = document.currentScript;
  if (!script?.src) return;
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
